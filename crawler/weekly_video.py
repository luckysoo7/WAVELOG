"""주간 라디오 베스트 영상 생성기.

사용법:
  python crawler/weekly_video.py --program bcamp
  python crawler/weekly_video.py --program byulbam --output /tmp/byulbam_weekly.mp4
  python crawler/weekly_video.py --program bcamp --dry-run   # 선곡 목록만 출력
  python crawler/weekly_video.py --program bcamp --limit 3   # 3곡만 (테스트용)
  python crawler/weekly_video.py --program bcamp --preview   # 1프레임 PNG (수초)

렌더링 파이프라인:
  1. Playwright (Chromium) → 트랙별 정적 PNG 1장 + #spectrum-slot 좌표 측정
  2. FFmpeg PCM 추출 → NumPy RMS 진폭 (VIDEO_FPS 기준 프레임별)
  3. PIL → 슬롯 영역(820×40px)에 오디오 반응 도트를 매 프레임 합성
  4. FFmpeg rawvideo stdin 파이프 → libx264 + AAC 세그먼트
  5. 세그먼트 concat → 최종 MP4

도트 비주얼라이저:
  - 사인파 패턴 (FREQ=2 주기, PHASE_STEP으로 매 프레임 흘러감)
  - 진폭 = MIN_AMP + (MAX_AMP - MIN_AMP) × rms[f]  ← 오디오 연동
  - 조용할 때: 거의 수평 / 클 때: 파도처럼 높아짐
  - Playwright 재로드 없이 PIL만 사용 → 빠름 (5760f @ ~60fps)
"""

import argparse
import base64
import json
import math
import os
import subprocess
import sys
from datetime import date, timedelta
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

from db import connect, DB_PATH

ROOT     = Path(__file__).resolve().parent.parent
ASSETS   = Path(__file__).resolve().parent / "assets"
DATA_DIR = ROOT / "data"
USED_IDS_FILE = DATA_DIR / "used_video_ids.json"

# 시네마틱 커버
COVER_CINEMATIC  = str(ROOT / "tmp" / "cover1.jpg")
COVER_CINEMATIC3 = str(ROOT / "tmp" / "cover3.jpg")

# 프로그램별 디자인 토큰
PROGRAM_META = {
    "bcamp": {
        "name":   "배철수의 음악캠프",
        "bg":     COVER_CINEMATIC3,
        "accent": (232, 112, 74),    # --sunset-orange
        "tags":   "#배철수의음악캠프 #라디오플리 #플리 #음악추천 #라디오",
    },
    "byulbam": {
        "name":   "별이 빛나는 밤에",
        "bg":     COVER_CINEMATIC3,
        "accent": (245, 166, 35),    # --sunset-gold
        "tags":   "#별이빛나는밤에 #김이나 #라디오플리 #플리 #음악추천 #라디오",
    },
}

MAX_TRACKS    = 20
DAYS_BACK     = 7
FRAME_W, FRAME_H = 1920, 1080   # FHD — YouTube 1080p
VIDEO_FPS     = 24               # 출력 영상 프레임률
DOT_SPACING   = 15               # 도트 간격 (px) — 슬롯 너비 820 / 15 ≈ 54개


# ---------------------------------------------------------------------------
# 프레임 생성 — Playwright (정적 배경) + PIL (오디오 반응 도트)
# ---------------------------------------------------------------------------

def _bg_to_data_uri(bg_path: str) -> str:
    """배경 이미지를 base64 data URI로 변환 (HTML에 인라인 삽입)."""
    with open(bg_path, "rb") as f:
        data = base64.b64encode(f.read()).decode()
    ext = Path(bg_path).suffix.lstrip(".")
    mime = "jpeg" if ext in ("jpg", "jpeg") else ext
    return f"data:image/{mime};base64,{data}"


def _build_frame_html(
    track:     dict,
    track_num: int,
    total:     int,
    program:   str,
    bg_data:   str,
    accent:    tuple[int, int, int],
) -> str:
    """참고안2 기반 HTML 정적 프레임.

    레이아웃:
      - 배경: cover3.jpg, brightness 0.88
      - 트랙 블록: 가로 75% 지점 가운데 정렬, 수직 50%
          artist (MapoFlowerIsland 26px, opacity 0.52)
          title  (MapoFlowerIsland 42px, opacity 0.95)
          #spectrum-slot (820×40px — PIL이 나중에 도트를 합성할 영역)
      - 하단 비네트 + WAVELOG(BBH Bartle 77px) + 날짜(Anton 34px)
    """
    song_title  = track["title"]
    artist_name = track["artist"]

    # BBH Bartle — 로고용, data URI 인라인 삽입
    bbh_path = Path.home() / ".local/share/fonts/bbh-bartle/BBHBartle-Regular.ttf"
    with open(bbh_path, "rb") as f:
        bbh_uri = f"data:font/truetype;base64,{base64.b64encode(f.read()).decode()}"

    # MapoFlowerIsland — 트랙 텍스트용, data URI 인라인 삽입
    mapo_path = ROOT / "tmp" / "MapoFlowerIsland.ttf"
    with open(mapo_path, "rb") as f:
        mapo_uri = f"data:font/truetype;base64,{base64.b64encode(f.read()).decode()}"

    today_str = date.today().strftime("%d / %b / %Y").upper()

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');

  @font-face {{
    font-family: 'BBH Bartle';
    src: url('{bbh_uri}') format('truetype');
    font-weight: 400;
    font-style: normal;
  }}

  @font-face {{
    font-family: 'MapoFlowerIsland';
    src: url('{mapo_uri}') format('truetype');
    font-weight: 400;
    font-style: normal;
  }}

  *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

  body {{
    width: {FRAME_W}px;
    height: {FRAME_H}px;
    overflow: hidden;
    background: #0a0f14;
  }}

  /* 배경 — 거의 원본 밝기 (참고안 기준) */
  .bg {{
    position: absolute;
    inset: 0;
    background-image: url('{bg_data}');
    background-size: cover;
    background-position: center;
    filter: brightness(0.88);
  }}

  /* 트랙 정보 블록 — 가로 3/4 지점(75%) 가운데 정렬, 수직 중앙 */
  .track-block {{
    position: absolute;
    left: 75%;
    top: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }}

  /* 아티스트명 — 작고 흐리게, 넓은 자간 (레이블 스타일) */
  .artist {{
    font-family: 'MapoFlowerIsland', sans-serif;
    font-size: 26px;
    line-height: 1.2;
    color: rgba(255, 255, 255, 0.52);
    letter-spacing: 0.18em;
    white-space: nowrap;
    text-transform: uppercase;
    text-shadow: 1px 2px 4px rgba(0,0,0,0.45);
    margin-bottom: 10px;
  }}

  /* 곡명 — 크고 선명하게 */
  .title {{
    font-family: 'MapoFlowerIsland', sans-serif;
    font-size: 42px;
    line-height: 1.3;
    color: rgba(255, 255, 255, 0.95);
    letter-spacing: 0.04em;
    white-space: nowrap;
    text-shadow: 1px 2px 4px rgba(0,0,0,0.55);
  }}

  /* 도트 비주얼라이저 슬롯 — PIL이 프레임마다 이 위치에 도트를 합성 */
  #spectrum-slot {{
    position: relative;
    width: 820px;
    height: 110px;
    margin-top: 12px;
    flex-shrink: 0;
  }}

  /* 하단 비네트 — WAVELOG/날짜 가독성 */
  .bottom-vignette {{
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 32%;
    background: linear-gradient(to top, rgba(0,0,0,0.58) 0%, transparent 100%);
    pointer-events: none;
  }}

  /* 하단 가운데 블록 — WAVELOG + 날짜 */
  .bottom-block {{
    position: absolute;
    bottom: 36px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    white-space: nowrap;
  }}

  /* WAVELOG — 하단 가운데, BBH Bartle */
  .brand {{
    font-family: 'BBH Bartle', sans-serif;
    font-size: 77px;
    line-height: 1.0;
    color: #ffffff;
    letter-spacing: 0.02em;
    text-shadow:
      4px 4px 8px rgba(0,0,0,0.34),
      8px 8px 24px rgba(0,0,0,0.30),
      12px 12px 48px rgba(0,0,0,0.22);
  }}

  /* 날짜 — Anton, WAVELOG 아래 */
  .date {{
    font-family: 'Anton', sans-serif;
    font-size: 34px;
    line-height: 1.2;
    color: rgba(255,255,255,0.82);
    letter-spacing: 0.084em;
  }}
</style>
</head>
<body>
  <div class="bg"></div>

  <div class="track-block">
    <div class="artist">{artist_name}</div>
    <div class="title">{song_title}</div>
    <div id="spectrum-slot"></div>
  </div>

  <div class="bottom-vignette"></div>

  <div class="bottom-block">
    <div class="brand">WAVELOG</div>
    <div class="date">{today_str}</div>
  </div>

</body>
</html>"""


def generate_static_frames_playwright(
    tracks:  list[dict],
    program: str,
    bg_path: str,
    accent:  tuple[int, int, int],
    out_dir: Path,
) -> tuple[list[Path], list[dict]]:
    """Playwright로 트랙별 정적 PNG 1장 생성 + #spectrum-slot 좌표 측정.

    도트는 여기서 그리지 않는다.
    슬롯 좌표만 기록해서 PIL이 나중에 정확한 위치에 도트를 합성한다.
    """
    print("  [Playwright] 정적 배경 프레임 생성 중...")
    bg_data = _bg_to_data_uri(bg_path)
    total   = len(tracks)
    frame_paths: list[Path] = []
    slots:       list[dict] = []

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page    = browser.new_page(
            viewport={"width": FRAME_W, "height": FRAME_H},
            device_scale_factor=1.0,
        )
        for i, track in enumerate(tracks):
            html = _build_frame_html(track, i + 1, total, program, bg_data, accent)
            page.set_content(html, wait_until="networkidle")
            slot_bb = page.locator("#spectrum-slot").bounding_box()
            if slot_bb is None:
                raise RuntimeError(f"#spectrum-slot not found in frame {i}")
            fp = out_dir / f"static_{i:03d}.png"
            page.screenshot(path=str(fp), full_page=False)
            frame_paths.append(fp)
            slots.append(slot_bb)
            print(f"    {i+1:2d}/{total}: {track['artist']} — {track['title']}")
        browser.close()

    return frame_paths, slots


def _extract_fft_frames(
    audio_path: Path,
    n_bands:    int,
) -> np.ndarray:
    """FFT 기반 주파수 스펙트럼 → (n_frames, n_bands) 배열.

    핵심 설계:
      1. 4x 오버샘플링 (hop_size = chunk/4):
           - 96fps로 FFT 계산 → 비디오 프레임당 4개 hop
           - 각 프레임에서 4개 hop의 max 취함
           - → 킥드럼처럼 프레임 경계 사이에 오는 transient도 포착
           - → 나이퀴스트 aliasing 해결 (뚝뚝 끊기는 느낌 제거)
      2. sqrt 압축: FFT 매그니튜드 로그 분포 → 중간값들을 위로 끌어올림
      3. Peak-hold decay: 올라갈 때 빠르게, 떨어질 때 천천히 (bounce 효과)
      4. EMA forward pass (ALPHA=0.55):
           - 시정수 ≈ 52ms (이전 0.35 → 97ms 대비 딜레이 절반)
           - 오버샘플링으로 이미 부드러워졌으니 alpha 높여도 OK
    """
    SAMPLE_RATE = 44100
    DECAY       = 0.80
    ALPHA       = 0.55    # EMA (높을수록 responsive, 낮을수록 smooth)
    OVERSAMPLE  = 4       # 내부 계산 배율 (96fps)
    MAX_FREQ    = 4700    # 주파수 상한 (Hz)

    chunk_size = SAMPLE_RATE // VIDEO_FPS          # ~1837 samples/frame
    hop_size   = chunk_size // OVERSAMPLE          # ~459 samples/hop

    # PCM 추출
    r = subprocess.run(
        [
            "ffmpeg", "-i", str(audio_path),
            "-f", "s16le", "-acodec", "pcm_s16le",
            "-ar", str(SAMPLE_RATE), "-ac", "1", "pipe:1",
        ],
        capture_output=True,
    )
    samples = np.frombuffer(r.stdout, dtype=np.int16).astype(np.float32) / 32768.0

    # 주파수 대역 인덱스 사전 계산 (로그 스케일 20Hz ~ MAX_FREQ)
    freq_bins = np.fft.rfftfreq(chunk_size, d=1.0 / SAMPLE_RATE)
    log_edges = np.logspace(np.log10(20), np.log10(MAX_FREQ), n_bands + 1)
    band_lo   = []
    band_hi   = []
    for b in range(n_bands):
        lo = int(np.searchsorted(freq_bins, log_edges[b]))
        hi = int(np.searchsorted(freq_bins, log_edges[b + 1]))
        hi = min(max(hi, lo + 1), len(freq_bins))
        band_lo.append(lo)
        band_hi.append(hi)

    # 전체 hop 인덱스 계산 (chunk_size 길이 윈도우, hop_size 간격)
    window_fn = np.hanning(chunk_size).astype(np.float32)
    starts    = np.arange(0, len(samples) - chunk_size + 1, hop_size)
    n_hops    = len(starts)

    # 배치 FFT: (n_hops, chunk_size) → (n_hops, chunk_size//2+1)
    # 한 번에 계산해서 Python loop 최소화
    all_segs = np.stack([samples[s:s + chunk_size] for s in starts])  # (n_hops, chunk)
    all_mags = np.abs(np.fft.rfft(all_segs * window_fn, axis=1))      # (n_hops, freq)
    all_mags = np.sqrt(all_mags)                                        # sqrt 압축

    # 대역 에너지: (n_hops, n_bands)
    hop_energies = np.zeros((n_hops, n_bands), dtype=np.float32)
    for b in range(n_bands):
        hop_energies[:, b] = all_mags[:, band_lo[b]:band_hi[b]].mean(axis=1)

    # 비디오 프레임으로 집계: OVERSAMPLE hop들의 max → transient 포착
    n_frames   = n_hops // OVERSAMPLE
    raw_frames = np.zeros((n_frames, n_bands), dtype=np.float32)
    for i in range(n_frames):
        raw_frames[i] = hop_energies[i * OVERSAMPLE:(i + 1) * OVERSAMPLE].max(axis=0)

    # Peak-hold with exponential decay
    smoothed = np.zeros_like(raw_frames)
    peaks    = np.zeros(n_bands, dtype=np.float32)
    for i in range(n_frames):
        peaks       = np.maximum(raw_frames[i], peaks * DECAY)
        smoothed[i] = peaks

    # EMA 저역통과 (forward-only, causal)
    for i in range(1, n_frames):
        smoothed[i] = ALPHA * smoothed[i] + (1 - ALPHA) * smoothed[i - 1]

    # 0~1 정규화
    peak_val = smoothed.max()
    if peak_val > 0:
        smoothed /= peak_val

    return smoothed


def _encode_track_with_dots(
    static_png:  Path,
    slot:        dict,
    fft_frames:  np.ndarray,   # shape: (n_frames, n_bands), 0~1 정규화
    audio_path:  Path,
    seg_path:    Path,
) -> bool:
    """정적 배경 위에 FFT 스펙트럼 도트를 PIL로 그려 FFmpeg stdin 파이프로 인코딩.

    각 도트 = 하나의 주파수 대역.
    y 위치 = 슬롯 중앙 ± band_energy × MAX_AMP
    → 저음 도트, 중음 도트, 고음 도트가 각각 독립적으로 움직임
    → peak-hold decay는 _extract_fft_frames()에서 이미 처리됨

    렌더링 최적화:
      - 슬롯 영역(820×40)만 교체 — 전체 프레임(6.2MB) 복사 없음
      - slot_pil_base를 1회 RGBA 변환 후 재사용
    """
    bg     = Image.open(str(static_png)).convert("RGB")
    bg_arr = np.array(bg, dtype=np.uint8)

    sx = int(slot["x"])
    sy = int(slot["y"])
    sw = int(slot["width"])    # 820
    sh = int(slot["height"])   # 40

    DOT_RADIUS  = 1.8
    MAX_AMP     = sh / 2 - DOT_RADIUS   # 슬롯 절반 높이까지 최대 진폭
    MIN_AMP     = 1.5                   # 무음 최소 진폭 (수평에 가깝게)

    n_frames = fft_frames.shape[0]
    n_bands  = fft_frames.shape[1]

    # 슬롯 배경 (RGBA, 1회 변환 후 재사용)
    slot_orig     = bg_arr[sy:sy + sh, sx:sx + sw].copy()
    slot_pil_base = Image.fromarray(slot_orig).convert("RGBA")

    # 각 도트의 x 위치 (균등 분할)
    dot_xs = np.linspace(0, sw, n_bands, endpoint=False).astype(int)

    # FFmpeg 파이프 열기
    ffmpeg_cmd = [
        "ffmpeg", "-y",
        "-f", "rawvideo", "-pixel_format", "rgb24",
        "-video_size", f"{FRAME_W}x{FRAME_H}",
        "-framerate", str(VIDEO_FPS),
        "-i", "pipe:0",
        "-i", str(audio_path),
        "-map", "0:v", "-map", "1:a",
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        str(seg_path),
    ]
    proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)

    frame_arr = bg_arr.copy()
    cy        = sh / 2   # 슬롯 수직 중앙

    try:
        for f_idx in range(n_frames):
            band_energy = fft_frames[f_idx]   # shape: (n_bands,)

            # 슬롯 영역 리셋
            frame_arr[sy:sy + sh, sx:sx + sw] = slot_orig

            # 도트 그리기
            overlay = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
            draw    = ImageDraw.Draw(overlay)
            for b, x_off in enumerate(dot_xs):
                amp = MIN_AMP + (MAX_AMP - MIN_AMP) * float(band_energy[b])
                # 중앙에서 위로 올라감 (양방향 대칭 비주얼라이저는 아님 — 위쪽만)
                y   = cy - amp
                r   = DOT_RADIUS
                draw.ellipse(
                    [x_off - r, y - r, x_off + r, y + r],
                    fill=(255, 255, 255, 184),
                )

            composited = Image.alpha_composite(slot_pil_base, overlay).convert("RGB")
            frame_arr[sy:sy + sh, sx:sx + sw] = np.array(composited, dtype=np.uint8)

            proc.stdin.write(frame_arr.tobytes())

    except BrokenPipeError:
        pass
    finally:
        proc.stdin.close()

    proc.wait()
    if proc.returncode != 0:
        err = proc.stderr.read().decode(errors="replace")
        print(f"[오류] 세그먼트 인코딩:\n{err[-400:]}", file=sys.stderr)
        return False
    return True


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


def select_tracks(program: str, random_order: bool = False) -> list[dict]:
    conn = connect(DB_PATH)
    since = (date.today() - timedelta(days=DAYS_BACK)).isoformat()
    order = "RANDOM()" if random_order else "COALESCE(s.view_count, 0) DESC"
    rows = conn.execute(
        f"""
        SELECT s.title, s.artist, s.video_id, s.view_count, e.date
        FROM   songs s
        JOIN   episodes e ON s.episode_id = e.id
        WHERE  e.program_id = ?
          AND  e.date >= ?
          AND  s.video_id IS NOT NULL
        ORDER  BY {order}
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
# Step 3: 영상 합성
#
# 싱크 보장 원리:
#   곡별 _encode_track_with_dots() → FFmpeg stdin 파이프 → segment.mp4
#   rawvideo + audio → libx264, -shortest 로 오디오가 길이를 결정
#   세그먼트 concat → final.mp4
# ---------------------------------------------------------------------------

def compose_video(
    tracks:      list[dict],
    audio_files: list[Path],
    program:     str,
    output_path: Path,
) -> tuple[bool, list] | bool:
    meta    = PROGRAM_META[program]
    bg_path = meta["bg"]
    accent  = meta["accent"]
    tmp_dir = output_path.parent

    # ── 1. Playwright: 정적 배경 PNG + 슬롯 좌표 ──
    print(f"  [Playwright] 정적 프레임 {len(tracks)}장 생성 중...")
    frame_paths, slots = generate_static_frames_playwright(
        tracks, program, bg_path, accent, tmp_dir
    )

    # ── 2. 곡별 세그먼트 인코딩 ──
    print(f"  [PIL→FFmpeg] 오디오 반응 도트 렌더링 + 인코딩...")
    segment_paths: list[Path] = []
    durations:     list[float] = []

    for i, (track, fp, af, slot) in enumerate(
        zip(tracks, frame_paths, audio_files, slots)
    ):
        dur      = get_duration(af)
        durations.append(dur)
        n_frames = int(dur * VIDEO_FPS)
        sw_slot  = int(slot["width"])
        n_bands  = sw_slot // DOT_SPACING
        print(f"    {i+1:2d}/{len(tracks)}: {track['artist']} — {track['title']} "
              f"({dur:.0f}s, {n_frames}f, {n_bands}bands)")

        fft_data = _extract_fft_frames(af, n_bands)
        # FFT 프레임 수가 영상 프레임 수보다 부족하면 마지막 값으로 패딩
        if len(fft_data) < n_frames:
            fft_data = np.pad(fft_data, ((0, n_frames - len(fft_data)), (0, 0)), mode="edge")

        seg = tmp_dir / f"segment_{i:03d}.mp4"
        ok  = _encode_track_with_dots(fp, slot, fft_data, af, seg)
        if not ok:
            return False
        segment_paths.append(seg)

    # ── 3. 세그먼트 concat → 최종 MP4 ──
    total_dur = sum(durations)
    print(f"  [FFmpeg] 세그먼트 concat... ({total_dur / 60:.1f}분)")
    seg_list = tmp_dir / "segments.txt"
    seg_list.write_text(
        "\n".join(f"file '{p.resolve()}'" for p in segment_paths)
    )
    r = subprocess.run(
        [
            "ffmpeg", "-y",
            "-f", "concat", "-safe", "0", "-i", str(seg_list),
            "-c", "copy",
            "-movflags", "+faststart",
            str(output_path),
        ],
        capture_output=True, text=True,
    )

    # 임시 파일 정리
    seg_list.unlink(missing_ok=True)
    for fp in frame_paths:
        fp.unlink(missing_ok=True)
    for sp in segment_paths:
        sp.unlink(missing_ok=True)

    if r.returncode != 0:
        print(f"[오류] concat:\n{r.stderr[-400:]}", file=sys.stderr)
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
    parser.add_argument("--preview", action="store_true", help="1프레임 PNG만 렌더링 (빠른 디자인 확인용)")
    parser.add_argument("--limit", type=int, default=0, help="곡 수 제한 (테스트용)")
    parser.add_argument("--random", action="store_true", help="조회수 순 대신 랜덤 선곡")
    args = parser.parse_args()

    program = args.program
    meta    = PROGRAM_META[program]
    today   = date.today().isoformat()
    output_dir = ROOT / "output"
    output_dir.mkdir(exist_ok=True)
    output_path = (
        Path(args.output) if args.output
        else output_dir / f"{program}_weekly_{today}.mp4"
    )

    print(f"\n{'='*60}")
    print(f"  {meta['name']} 주간 영상 생성")
    print(f"  렌더러: Playwright + PIL (오디오 반응 도트) + FFmpeg")
    print(f"  기간: 지난 {DAYS_BACK}일 / 최대 {MAX_TRACKS}곡")
    print(f"{'='*60}\n")

    # Step 1: 선곡
    print("[1/4] 선곡 중...")
    tracks = select_tracks(program, random_order=args.random)
    if not tracks:
        print("[오류] 매핑된 곡 없음.", file=sys.stderr); sys.exit(1)
    if args.limit:
        tracks = tracks[:args.limit]
    for i, t in enumerate(tracks, 1):
        views = f"{t['view_count']:,}" if t["view_count"] else "-"
        print(f"  {i:2d}. [{t['date']}] {t['artist']} — {t['title']} ({views})")

    if args.dry_run:
        print("\n[dry-run] 종료."); return

    # --preview: Playwright 정적 PNG에 PIL로 도트를 얹어 저장 (수초 내 완료)
    if args.preview:
        preview_path = ROOT / "output" / f"{program}_preview.png"
        bg_data      = _bg_to_data_uri(meta["bg"])
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            page    = browser.new_page(
                viewport={"width": FRAME_W, "height": FRAME_H},
                device_scale_factor=1.0,
            )
            html    = _build_frame_html(tracks[0], 1, len(tracks), program, bg_data, meta["accent"])
            page.set_content(html, wait_until="networkidle")
            slot_bb = page.locator("#spectrum-slot").bounding_box()
            page.screenshot(path=str(preview_path), full_page=False)
            browser.close()

        # PIL로 도트 합성 (rms=0.7 — 적당히 볼륨 있는 상태 시뮬레이션)
        if slot_bb:
            bg      = Image.open(str(preview_path)).convert("RGB")
            bg_arr  = np.array(bg, dtype=np.uint8)
            sx, sy  = int(slot_bb["x"]), int(slot_bb["y"])
            sw, sh  = int(slot_bb["width"]), int(slot_bb["height"])
            amp     = 2.5 + (13.0 - 2.5) * 0.7   # rms=0.7
            overlay = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
            draw    = ImageDraw.Draw(overlay)
            for x_off in range(0, sw + 1, 12):
                t = x_off / sw
                y = sh / 2 + amp * math.sin(t * math.pi * 4)   # phase=0
                draw.ellipse([x_off - 1.8, y - 1.8, x_off + 1.8, y + 1.8],
                             fill=(255, 255, 255, 184))
            slot_pil   = Image.fromarray(bg_arr[sy:sy+sh, sx:sx+sw]).convert("RGBA")
            composited = Image.alpha_composite(slot_pil, overlay).convert("RGB")
            bg_arr[sy:sy+sh, sx:sx+sw] = np.array(composited, dtype=np.uint8)
            Image.fromarray(bg_arr).save(str(preview_path))

        print(f"\n[preview] {preview_path}")
        return

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
