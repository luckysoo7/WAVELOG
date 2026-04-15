"""주간 라디오 베스트 영상 생성기.

사용법:
  python crawler/weekly_video.py --program bcamp
  python crawler/weekly_video.py --program byulbam --output /tmp/byulbam_weekly.mp4
  python crawler/weekly_video.py --program bcamp --dry-run   # 선곡 목록만 출력
  python crawler/weekly_video.py --program bcamp --limit 3   # 3곡만 (테스트용)

렌더링 엔진: Pillow (PNG 프레임 생성) → FFmpeg (인코딩만)
이유: FFmpeg drawtext는 워터마크 도구 — 안티앨리어싱 없음, 그라데이션 불가.
     Pillow는 RGBA 공간에서 정밀 합성, FreeType 안티앨리어싱 완전 지원.
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

from db import connect, DB_PATH

ROOT     = Path(__file__).resolve().parent.parent
ASSETS   = Path(__file__).resolve().parent / "assets"
DATA_DIR = ROOT / "data"
USED_IDS_FILE = DATA_DIR / "used_video_ids.json"

FONT_BOLD   = str(Path.home() / ".local/share/fonts/pretendard/Pretendard-Bold.otf")
FONT_MEDIUM = str(Path.home() / ".local/share/fonts/pretendard/Pretendard-Medium.otf")
FONT_REG    = str(Path.home() / ".local/share/fonts/pretendard/Pretendard-Regular.otf")

# 프로그램별 디자인 토큰
PROGRAM_META = {
    "bcamp": {
        "name":   "배철수의 음악캠프",
        "bg":     str(ASSETS / "bg_retro_amber.jpg"),
        "accent": (232, 112, 74),    # --sunset-orange
        "tags":   "#배철수의음악캠프 #라디오플리 #플리 #음악추천 #라디오",
    },
    "byulbam": {
        "name":   "별이 빛나는 밤에",
        "bg":     str(ASSETS / "bg_city_night.jpg"),
        "accent": (245, 166, 35),    # --sunset-gold
        "tags":   "#별이빛나는밤에 #김이나 #라디오플리 #플리 #음악추천 #라디오",
    },
}

MAX_TRACKS    = 20
DAYS_BACK     = 7
FRAME_W, FRAME_H = 1920, 1080


# ---------------------------------------------------------------------------
# 폰트 로더 (한 번만 로드, 재사용)
# ---------------------------------------------------------------------------

@dataclass
class Fonts:
    ghost:    ImageFont.FreeTypeFont   # 280px Bold — 고스트 트랙 번호
    title:    ImageFont.FreeTypeFont   # 76px Bold  — 곡명
    artist:   ImageFont.FreeTypeFont   # 30px Reg   — 아티스트
    counter:  ImageFont.FreeTypeFont   # 18px Med   — 트랙 카운터
    branding: ImageFont.FreeTypeFont   # 21px Reg   — 프로그램명


def load_fonts() -> Fonts:
    return Fonts(
        ghost    = ImageFont.truetype(FONT_BOLD,   280),
        title    = ImageFont.truetype(FONT_BOLD,    76),
        artist   = ImageFont.truetype(FONT_REG,     30),
        counter  = ImageFont.truetype(FONT_MEDIUM,  18),
        branding = ImageFont.truetype(FONT_REG,     21),
    )


# ---------------------------------------------------------------------------
# 이미지 합성 헬퍼
# ---------------------------------------------------------------------------

def crop_center(img: Image.Image, w: int, h: int) -> Image.Image:
    """비율 유지 센터 크롭."""
    iw, ih = img.size
    scale = max(w / iw, h / ih)
    nw, nh = int(iw * scale), int(ih * scale)
    img = img.resize((nw, nh), Image.LANCZOS)
    left = (nw - w) // 2
    top  = (nh - h) // 2
    return img.crop((left, top, left + w, top + h))


def make_bottom_vignette(w: int, h: int) -> Image.Image:
    """하단 비네트: y=480에서 시작해 y=1080 근처에서 alpha=210.

    smoothstep 커브로 자연스러운 페이드.
    """
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw    = ImageDraw.Draw(overlay)
    start_y = 480
    grad_h  = h - start_y
    for i in range(grad_h):
        t = i / grad_h
        # smoothstep: t*t*(3-2t)
        alpha = int(215 * t * t * (3 - 2 * t))
        draw.line([(0, start_y + i), (w, start_y + i)], fill=(0, 0, 0, alpha))
    return overlay


def draw_text_shadow(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    font: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int, int],
    shadow_offset: int = 2,
    shadow_alpha: int = 80,
    **kwargs,
) -> None:
    """텍스트 드롭 섀도우 후 본문 렌더링 (깊이감 추가)."""
    sx, sy = xy[0] + shadow_offset, xy[1] + shadow_offset
    draw.text((sx, sy), text, font=font, fill=(0, 0, 0, shadow_alpha), **kwargs)
    draw.text(xy,       text, font=font, fill=fill,                     **kwargs)


# ---------------------------------------------------------------------------
# 프레임 생성 (Pillow — 곡 1개당 PNG 1장)
# ---------------------------------------------------------------------------

def generate_frame(
    track:     dict,
    track_num: int,
    total:     int,
    program:   str,
    bg_path:   str,
    fonts:     Fonts,
    accent:    tuple[int, int, int],
) -> Image.Image:
    W, H = FRAME_W, FRAME_H

    # ── 1. 배경: 로드 + 크롭 + 극소 블러 (비네트로 어둡게 하므로 원본 생동감 유지) ──
    bg = Image.open(bg_path).convert("RGBA")
    bg = crop_center(bg, W, H)
    bg = bg.filter(ImageFilter.GaussianBlur(radius=1.0))   # sigma=1: 가볍게만

    # ── 2. 비네트 합성 ──
    vignette = make_bottom_vignette(W, H)
    frame = Image.alpha_composite(bg, vignette)

    # ── 3. 고스트 트랙 번호 (오른쪽 상단, 280px, alpha=28) ──
    ghost_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ghost_draw  = ImageDraw.Draw(ghost_layer)
    num_str = f"{track_num:02d}"
    # anchor="rt": 오른쪽 상단 기준점
    ghost_draw.text(
        (W - 80, 60),
        num_str,
        font=fonts.ghost,
        fill=(255, 255, 255, 28),
        anchor="rt",
    )
    frame = Image.alpha_composite(frame, ghost_layer)

    # ── 4. 텍스트 레이어 ──
    draw = ImageDraw.Draw(frame)

    # 상단 브랜딩 (좌측)
    prog_name = PROGRAM_META[program]["name"]
    draw.text(
        (56, 48),
        prog_name,
        font=fonts.branding,
        fill=(255, 255, 255, 120),
    )

    # 액센트 라인 (구분선)
    line_y = 884
    draw.rectangle([0, line_y, W, line_y + 2], fill=(*accent, 255))

    # 트랙 카운터 (accent 색, 소형)
    counter_str = f"{track_num:02d}  /  {total:02d}"
    draw.text(
        (56, 893),
        counter_str,
        font=fonts.counter,
        fill=(*accent, 255),
    )

    # URL (오른쪽 정렬, 같은 높이)
    draw.text(
        (W - 56, 893),
        "wavelog.vercel.app",
        font=fonts.counter,
        fill=(255, 255, 255, 65),
        anchor="rt",
    )

    # 곡명 (76px Bold, 드롭 섀도우)
    title = _truncate(track["title"], 28)
    draw_text_shadow(
        draw,
        (56, 916),
        title,
        font=fonts.title,
        fill=(255, 255, 255, 255),
        shadow_offset=3,
        shadow_alpha=100,
    )

    # 아티스트 (30px Regular, muted)
    artist = _truncate(track["artist"], 44)
    draw.text(
        (56, 1008),
        artist,
        font=fonts.artist,
        fill=(255, 255, 255, 155),
    )

    return frame.convert("RGB")


def _truncate(text: str, max_chars: int) -> str:
    return text if len(text) <= max_chars else text[:max_chars - 1] + "…"


# ---------------------------------------------------------------------------
# Step 1: 선곡
# ---------------------------------------------------------------------------

def load_used_ids() -> set[str]:
    if not USED_IDS_FILE.exists():
        return set()
    data = json.loads(USED_IDS_FILE.read_text())
    cutoff = (date.today() - timedelta(days=14)).isoformat()
    ids: set[str] = set()
    for entry in data:
        if entry.get("date", "") >= cutoff:
            ids.update(entry.get("ids", []))
    return ids


def save_used_ids(program: str, video_ids: list[str]) -> None:
    data = []
    if USED_IDS_FILE.exists():
        data = json.loads(USED_IDS_FILE.read_text())
    data.append({
        "date":    date.today().isoformat(),
        "program": program,
        "ids":     video_ids,
    })
    USED_IDS_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2))


def select_tracks(program: str) -> list[dict]:
    conn = connect(DB_PATH)
    since = (date.today() - timedelta(days=DAYS_BACK)).isoformat()
    rows = conn.execute(
        """
        SELECT s.title, s.artist, s.video_id, s.view_count, e.date
        FROM   songs s
        JOIN   episodes e ON s.episode_id = e.id
        WHERE  e.program_id = ?
          AND  e.date >= ?
          AND  s.video_id IS NOT NULL
        ORDER  BY COALESCE(s.view_count, 0) DESC
        """,
        (program, since),
    ).fetchall()
    conn.close()

    used_ids = load_used_ids()
    seen_artists: set[str] = set()
    selected: list[dict] = []

    for r in rows:
        vid    = r["video_id"]
        artist = r["artist"].strip().upper()
        if vid in used_ids or artist in seen_artists:
            continue
        seen_artists.add(artist)
        selected.append({
            "title":      r["title"],
            "artist":     r["artist"],
            "video_id":   vid,
            "view_count": r["view_count"],
            "date":       r["date"],
        })
        if len(selected) >= MAX_TRACKS:
            break

    return selected


# ---------------------------------------------------------------------------
# Step 2: 오디오 다운로드
# ---------------------------------------------------------------------------

def download_audio(video_id: str, out_dir: Path) -> Path | None:
    out_path = out_dir / f"{video_id}.mp3"
    if out_path.exists():
        return out_path

    cmd = [
        "yt-dlp",
        "--extract-audio", "--audio-format", "mp3", "--audio-quality", "192K",
        "--output", str(out_dir / "%(id)s.%(ext)s"),
        "--no-playlist", "--quiet",
        f"https://www.youtube.com/watch?v={video_id}",
    ]
    for attempt in range(1, 4):
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode == 0 and out_path.exists():
            return out_path
        print(f"  [다운로드 실패 {attempt}/3] {video_id}: {r.stderr.strip()[:120]}", file=sys.stderr)
    return None


def get_duration(path: Path) -> float:
    r = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(path)],
        capture_output=True, text=True,
    )
    try:
        return float(r.stdout.strip())
    except ValueError:
        return 0.0


# ---------------------------------------------------------------------------
# Step 3: 영상 합성 — Pillow 프레임 생성 + FFmpeg 인코딩
# ---------------------------------------------------------------------------

def compose_video(
    tracks:      list[dict],
    audio_files: list[Path],
    program:     str,
    output_path: Path,
) -> tuple[bool, list] | bool:
    meta      = PROGRAM_META[program]
    bg_path   = meta["bg"]
    accent    = meta["accent"]
    durations = [get_duration(f) for f in audio_files]
    total_dur = sum(durations)
    total     = len(tracks)
    tmp_dir   = output_path.parent

    # ── 폰트 로드 (한 번) ──
    print("  [Pillow] 폰트 로드 중...")
    fonts = load_fonts()

    # ── 프레임 PNG 생성 ──
    print(f"  [Pillow] 프레임 {total}장 생성 중...")
    frame_paths: list[Path] = []
    for i, track in enumerate(tracks):
        fp = tmp_dir / f"frame_{i:03d}.png"
        frame = generate_frame(track, i + 1, total, program, bg_path, fonts, accent)
        frame.save(str(fp), "PNG", optimize=False)
        frame_paths.append(fp)
        print(f"    {i+1:2d}/{total}: {track['artist']} — {track['title']}")

    # ── 오디오 concat ──
    concat_list  = tmp_dir / "concat_list.txt"
    merged_audio = tmp_dir / "merged_audio.mp3"
    concat_list.write_text(
        "\n".join(f"file '{f.resolve()}'" for f in audio_files)
    )
    r = subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0",
         "-i", str(concat_list), "-c", "copy", str(merged_audio)],
        capture_output=True, text=True,
    )
    if r.returncode != 0:
        print(f"[오류] 오디오 concat:\n{r.stderr[-400:]}", file=sys.stderr)
        return False

    # ── 비디오 concat 파일 빌드 (각 프레임에 duration 지정) ──
    # FFmpeg concat demuxer: file + duration 쌍으로 정적 이미지 → 영상
    vid_concat = tmp_dir / "video_concat.txt"
    lines = []
    for fp, dur in zip(frame_paths, durations):
        lines.append(f"file '{fp.resolve()}'")
        lines.append(f"duration {dur:.3f}")
    # FFmpeg concat은 마지막 파일 duration 이후 EOF 처리를 위해 파일 반복 필요
    lines.append(f"file '{frame_paths[-1].resolve()}'")
    vid_concat.write_text("\n".join(lines))

    # ── FFmpeg 인코딩 (이미지 시퀀스 + 오디오 → MP4) ──
    print(f"  [FFmpeg] 인코딩 중... ({total_dur / 60:.1f}분 분량)")
    cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0", "-i", str(vid_concat),
        "-i", str(merged_audio),
        "-map", "0:v", "-map", "1:a",
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-c:a", "aac", "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        str(output_path),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)

    # 임시 파일 정리
    concat_list.unlink(missing_ok=True)
    vid_concat.unlink(missing_ok=True)
    for fp in frame_paths:
        fp.unlink(missing_ok=True)

    if r.returncode != 0:
        print(f"[오류] FFmpeg:\n{r.stderr[-600:]}", file=sys.stderr)
        return False

    chapters = [
        (sum(durations[:i]), f"{t['artist']} - {t['title']}")
        for i, t in enumerate(tracks)
    ]
    return True, chapters


# ---------------------------------------------------------------------------
# Step 4: YouTube 설명란 텍스트
# ---------------------------------------------------------------------------

def format_ts(sec: float) -> str:
    s = int(sec)
    h, rem = divmod(s, 3600)
    m, ss  = divmod(rem, 60)
    return f"{h:02d}:{m:02d}:{ss:02d}" if h else f"{m:02d}:{ss:02d}"


def build_description(
    program:  str,
    tracks:   list[dict],
    chapters: list[tuple[float, str]],
) -> str:
    meta     = PROGRAM_META[program]
    today    = date.today()
    week_num = (today.day - 1) // 7 + 1
    week_str = ["첫째", "둘째", "셋째", "넷째", "다섯째"][min(week_num - 1, 4)]

    chapter_lines = "\n".join(
        f"{format_ts(t)} {label}" for t, label in chapters
    )
    return (
        f"{meta['name']} 주간 베스트 {len(tracks)}선 🎵"
        f" ({today.year}년 {today.month}월 {week_str} 주)\n\n"
        f"이번 주 가장 많이 사랑받은 선곡 {len(tracks)}곡을 모았습니다 🎧\n\n"
        f"▶ 챕터\n{chapter_lines}\n\n"
        f"📻 실제 라디오 방송 선곡을 그대로 담았습니다\n"
        f"🌐 전체 선곡표: wavelog.vercel.app\n\n"
        f"{meta['tags']}"
    )


# ---------------------------------------------------------------------------
# 메인
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--program", choices=["bcamp", "byulbam"], required=True)
    parser.add_argument("--output", help="출력 MP4 경로")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=0, help="곡 수 제한 (테스트용)")
    args = parser.parse_args()

    program = args.program
    meta    = PROGRAM_META[program]
    today   = date.today().isoformat()
    output_path = (
        Path(args.output) if args.output
        else Path(f"/tmp/{program}_weekly_{today}.mp4")
    )

    print(f"\n{'='*60}")
    print(f"  {meta['name']} 주간 영상 생성")
    print(f"  렌더러: Pillow + FFmpeg")
    print(f"  기간: 지난 {DAYS_BACK}일 / 최대 {MAX_TRACKS}곡")
    print(f"{'='*60}\n")

    # Step 1: 선곡
    print("[1/4] 선곡 중...")
    tracks = select_tracks(program)
    if not tracks:
        print("[오류] 매핑된 곡 없음.", file=sys.stderr); sys.exit(1)
    if args.limit:
        tracks = tracks[:args.limit]
    for i, t in enumerate(tracks, 1):
        views = f"{t['view_count']:,}" if t["view_count"] else "-"
        print(f"  {i:2d}. [{t['date']}] {t['artist']} — {t['title']} ({views})")

    if args.dry_run:
        print("\n[dry-run] 종료."); return

    # Step 2: 오디오 다운로드
    print(f"\n[2/4] 오디오 다운로드... ({len(tracks)}곡)")
    audio_dir = output_path.parent / f"{program}_audio_{today}"
    audio_dir.mkdir(parents=True, exist_ok=True)

    audio_files: list[Path] = []
    valid_tracks: list[dict] = []
    for i, track in enumerate(tracks, 1):
        print(f"  [{i}/{len(tracks)}] {track['artist']} — {track['title']}", end=" ", flush=True)
        ap = download_audio(track["video_id"], audio_dir)
        if ap:
            print("✓"); audio_files.append(ap); valid_tracks.append(track)
        else:
            print("✗ (skip)")

    min_req = min(5, len(tracks))
    if len(audio_files) < min_req:
        print(f"[오류] 다운로드 {len(audio_files)}곡 — 최소 {min_req}곡 필요.", file=sys.stderr)
        sys.exit(1)
    print(f"  완료: {len(audio_files)}/{len(tracks)}곡")

    # Step 3: 영상 합성
    print(f"\n[3/4] 영상 합성 중...")
    result = compose_video(valid_tracks, audio_files, program, output_path)
    if not result:
        sys.exit(1)
    _, chapters = result
    sz = output_path.stat().st_size / 1024 / 1024
    print(f"  출력: {output_path} ({sz:.1f} MB)")

    # Step 4: 설명란
    print(f"\n[4/4] 설명란 생성...")
    desc      = build_description(program, valid_tracks, chapters)
    desc_path = output_path.with_suffix(".txt")
    desc_path.write_text(desc, encoding="utf-8")
    print(f"  설명란: {desc_path}")
    print("\n챕터 미리보기:")
    for ts, label in chapters[:5]:
        print(f"  {format_ts(ts)}  {label}")
    if len(chapters) > 5:
        print(f"  ... ({len(chapters)-5}곡 더)")


if __name__ == "__main__":
    main()
