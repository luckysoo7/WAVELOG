"""플레이리스트 유효성 검증.

data/*.json에서 playlistId를 수집해 YouTube API로 존재 여부 확인.
깨진 플레이리스트 발견 시 Discord 웹훅으로 알림.

Usage:
    python -m crawler.validate
"""

import json
import os
import sys
from pathlib import Path

import requests

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "bcamp"


def _load_playlist_ids() -> list[tuple[str, str]]:
    """(date, playlistId) 목록 반환. youtube가 없는 날짜는 제외."""
    result = []
    for f in sorted(DATA_DIR.glob("????-??-??.json"), reverse=True):
        with open(f, encoding="utf-8") as fp:
            data = json.load(fp)
        yt = data.get("youtube")
        if yt and yt.get("playlistId"):
            result.append((data["date"], yt["playlistId"]))
    return result


def _check_playlists(playlist_ids: list[str], api_key: str) -> set[str]:
    """YouTube API로 존재하지 않는 playlistId 집합 반환.

    playlists.list는 ID 50개까지 한 번에 확인 가능 (50 units/call).
    """
    missing = set()
    chunk_size = 50
    for i in range(0, len(playlist_ids), chunk_size):
        chunk = playlist_ids[i : i + chunk_size]
        resp = requests.get(
            "https://www.googleapis.com/youtube/v3/playlists",
            params={
                "part": "id",
                "id": ",".join(chunk),
                "maxResults": chunk_size,
                "key": api_key,
            },
            timeout=10,
        )
        resp.raise_for_status()
        found = {item["id"] for item in resp.json().get("items", [])}
        missing.update(set(chunk) - found)
    return missing


def _send_discord(webhook_url: str, broken: list[tuple[str, str]]) -> None:
    lines = "\n".join(f"• `{date}` — `{pid}`" for date, pid in broken)
    payload = {
        "embeds": [
            {
                "title": "⚠️ 깨진 플레이리스트 감지",
                "description": (
                    f"{len(broken)}개 플레이리스트가 YouTube에 존재하지 않습니다.\n\n"
                    f"{lines}\n\n"
                    "복구: Actions → Run workflow → 해당 날짜 입력"
                ),
                "color": 16776960,  # 노란색
            }
        ]
    }
    requests.post(webhook_url, json=payload, timeout=10)


def main() -> None:
    api_key = os.environ.get("YOUTUBE_API_KEY")
    webhook_url = os.environ.get("DISCORD_WEBHOOK_URL")

    if not api_key:
        print("[validate] YOUTUBE_API_KEY 없음 — 스킵")
        sys.exit(0)

    entries = _load_playlist_ids()
    if not entries:
        print("[validate] 확인할 플레이리스트 없음")
        sys.exit(0)

    print(f"[validate] {len(entries)}개 플레이리스트 확인 중...")
    playlist_ids = [pid for _, pid in entries]
    missing_ids = _check_playlists(playlist_ids, api_key)

    if not missing_ids:
        print("[validate] 모두 정상")
        sys.exit(0)

    broken = [(date, pid) for date, pid in entries if pid in missing_ids]
    print(f"[validate] 깨진 플레이리스트 {len(broken)}개:")
    for date, pid in broken:
        print(f"  • {date} — {pid}")

    if webhook_url:
        _send_discord(webhook_url, broken)
        print("[validate] Discord 알림 전송 완료")


if __name__ == "__main__":
    main()
