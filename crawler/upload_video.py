"""YouTube 주간 영상 업로드 스크립트.

사용법:
  python crawler/upload_video.py --program bcamp
  python crawler/upload_video.py --program bcamp --mp4 /path/to/video.mp4

업로드 순서:
  1. videos.insert  — 영상 업로드 (public)
  2. thumbnails.set — 프리뷰 PNG를 썸네일로 설정
  3. playlistItems.insert — 채널 플레이리스트에 추가
  4. Discord 알림

쿼터 비용: 1,600 + 50 + 50 = 1,700 units
"""

import argparse
import os
import sys
from pathlib import Path

import requests
from googleapiclient.http import MediaFileUpload

ROOT = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------------------
# Discord 알림
# ---------------------------------------------------------------------------

def _strip_chapters(full_txt: str) -> str:
    """YouTube 설명란용 — 챕터/트랙 목록 제거."""
    lines = full_txt.splitlines()
    result = []
    skip = False
    for line in lines:
        if line.startswith("▶ 챕터"):
            skip = True
            continue
        if skip:
            # 챕터 줄 (타임스탬프로 시작)은 건너뜀
            if line and line[0].isdigit():
                continue
            else:
                skip = False  # 챕터 끝
        result.append(line)
    return "\n".join(result).strip()


def notify_discord(webhook_url: str, title: str, video_url: str, txt_path: Path) -> None:
    """업로드 완료 알림 + 챕터 목록 txt 파일 첨부."""
    import json as _json
    payload = {
        "embeds": [{
            "title": f"📺 {title}",
            "url": video_url,
            "description": f"업로드 완료",
            "color": 0xE8704A,
        }]
    }
    try:
        with open(txt_path, "rb") as f:
            requests.post(
                webhook_url,
                data={"payload_json": _json.dumps(payload)},
                files={"file": (txt_path.name, f, "text/plain")},
                timeout=30,
            )
    except Exception as e:
        print(f"[Discord] 알림 실패: {e}")


# ---------------------------------------------------------------------------
# 메인 업로드 로직
# ---------------------------------------------------------------------------

def upload(program: str, mp4_path: Path, txt_path: Path, thumbnail_path: Path | None) -> None:
    # 로컬 vs CI 인증 분기
    ci_mode = bool(os.environ.get("GOOGLE_CLIENT_SECRET"))
    if ci_mode:
        from auth_ci import get_youtube_client_ci
        youtube = get_youtube_client_ci()
    else:
        from auth import get_youtube_client
        youtube = get_youtube_client(
            client_secret_path=str(ROOT / "crawler" / "client_secret.json"),
            token_path=str(ROOT / "crawler" / "token.pickle"),
        )

    full_txt = txt_path.read_text(encoding="utf-8")
    title = full_txt.splitlines()[0].strip()
    description = _strip_chapters(full_txt)  # 챕터 제거된 YouTube 설명란용

    print(f"[upload] 제목: {title}")
    print(f"[upload] 파일: {mp4_path} ({mp4_path.stat().st_size / 1024 / 1024:.1f} MB)")

    # 1. videos.insert
    print("[upload] 1/3 영상 업로드 중... (시간 걸릴 수 있음)")
    media = MediaFileUpload(str(mp4_path), mimetype="video/mp4", resumable=True, chunksize=5 * 1024 * 1024)
    request = youtube.videos().insert(
        part="snippet,status",
        body={
            "snippet": {
                "title": title,
                "description": description,
                "categoryId": "10",  # Music
                "tags": ["배철수의음악캠프", "라디오플리", "플리", "음악추천", "라디오", "Wavelog"],
                "defaultLanguage": "ko",
            },
            "status": {
                "privacyStatus": "public",
                "selfDeclaredMadeForKids": False,
            },
        },
        media_body=media,
    )

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            pct = int(status.progress() * 100)
            print(f"\r  업로드 {pct}%...", end="", flush=True)
    print()

    video_id = response["id"]
    video_url = f"https://www.youtube.com/watch?v={video_id}"
    print(f"[upload] ✓ 업로드 완료: {video_url}")

    # 2. thumbnails.set (JPEG 압축 후 2MB 이내로)
    if thumbnail_path and thumbnail_path.exists():
        print("[upload] 2/3 썸네일 설정 중...")
        import tempfile
        from PIL import Image as _Image
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            tmp_path = tmp.name
        _Image.open(thumbnail_path).convert("RGB").save(tmp_path, "JPEG", quality=85, optimize=True)
        try:
            youtube.thumbnails().set(
                videoId=video_id,
                media_body=MediaFileUpload(tmp_path, mimetype="image/jpeg"),
            ).execute()
            print("[upload] ✓ 썸네일 설정 완료")
        except Exception as e:
            print(f"[upload] 썸네일 설정 실패 (채널 인증 필요할 수 있음): {e}")
        finally:
            os.unlink(tmp_path)
    else:
        print("[upload] 2/3 썸네일 파일 없음 — 스킵")

    # 3. playlistItems.insert
    playlist_id = os.environ.get(f"YOUTUBE_PLAYLIST_{program.upper()}")
    if playlist_id:
        print(f"[upload] 3/3 플레이리스트 추가 중... ({playlist_id})")
        youtube.playlistItems().insert(
            part="snippet",
            body={
                "snippet": {
                    "playlistId": playlist_id,
                    "resourceId": {"kind": "youtube#video", "videoId": video_id},
                }
            },
        ).execute()
        print("[upload] ✓ 플레이리스트 추가 완료")
    else:
        print(f"[upload] 3/3 YOUTUBE_PLAYLIST_{program.upper()} 환경변수 없음 — 스킵")
        print(f"         플레이리스트에 추가하려면: export YOUTUBE_PLAYLIST_{program.upper()}=PLxxxxxx")

    # 4. Discord 알림
    webhook_url = os.environ.get("DISCORD_WEBHOOK_URL")
    if webhook_url:
        notify_discord(webhook_url, title, video_url, txt_path)
        print("[upload] ✓ Discord 알림 전송")
    else:
        print("[upload] DISCORD_WEBHOOK_URL 없음 — Discord 알림 스킵")

    print(f"\n✅ 완료: {video_url}")


# ---------------------------------------------------------------------------
# 진입점
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--program", choices=["bcamp", "byulbam"], required=True)
    parser.add_argument("--mp4", help="업로드할 MP4 경로 (기본: output/{program}_weekly_최신.mp4)")
    args = parser.parse_args()

    output_dir = ROOT / "output"
    program = args.program

    if args.mp4:
        mp4_path = Path(args.mp4)
    else:
        # output/ 에서 가장 최신 파일 자동 선택
        candidates = sorted(output_dir.glob(f"{program}_weekly_*.mp4"))
        if not candidates:
            print(f"[오류] output/{program}_weekly_*.mp4 파일 없음.", file=sys.stderr)
            sys.exit(1)
        mp4_path = candidates[-1]

    txt_path = mp4_path.with_suffix(".txt")
    if not txt_path.exists():
        print(f"[오류] 설명 파일 없음: {txt_path}", file=sys.stderr)
        sys.exit(1)

    # 썸네일: output/{program}_preview.png
    thumbnail_path = output_dir / f"{program}_preview.png"

    upload(program, mp4_path, txt_path, thumbnail_path)


if __name__ == "__main__":
    main()
