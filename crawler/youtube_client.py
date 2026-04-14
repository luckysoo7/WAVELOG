import html
import time

from googleapiclient.discovery import Resource
from googleapiclient.errors import HttpError


class QuotaExceededError(Exception):
    pass


# 일시적 오류(409/500/503)에 대한 재시도 설정
_RETRYABLE_STATUSES = {409, 500, 503}
_MAX_RETRIES = 4
_BACKOFF_BASE = 2  # 2, 4, 8, 16초


def _retry(fn, *args, **kwargs):
    """일시적 YouTube API 오류 시 지수 백오프 재시도."""
    for attempt in range(_MAX_RETRIES + 1):
        try:
            return fn(*args, **kwargs)
        except HttpError as e:
            if e.resp.status == 403 and "quotaExceeded" in str(e):
                raise QuotaExceededError(
                    "YouTube API 일일 쿼터(10,000 units)가 초과되었습니다. "
                    "내일 다시 시도하세요."
                ) from e
            if e.resp.status in _RETRYABLE_STATUSES and attempt < _MAX_RETRIES:
                wait = _BACKOFF_BASE ** (attempt + 1)
                print(f"     [재시도 {attempt + 1}/{_MAX_RETRIES}] HTTP {e.resp.status} — {wait}초 후 재시도...")
                time.sleep(wait)
                continue
            raise


def search_videos(
    youtube: Resource, query: str, max_results: int = 5
) -> list[dict]:
    """YouTube에서 음악 영상 검색. videoCategoryId=10 (Music) 필터 적용."""
    response = _retry(
        youtube.search().list(
            part="snippet",
            q=query,
            type="video",
            videoCategoryId="10",
            order="relevance",
            maxResults=max_results,
        ).execute
    )

    return [
        {
            "video_id": item["id"]["videoId"],
            # YouTube API는 snippet.title을 HTML 인코딩해서 반환함
            "title": html.unescape(item["snippet"]["title"]),
            "channel": html.unescape(item["snippet"]["channelTitle"]),
        }
        for item in response.get("items", [])
    ]


def create_playlist(
    youtube: Resource, title: str, description: str = ""
) -> str:
    """공개 플레이리스트 생성. 플레이리스트 ID 반환."""
    response = _retry(
        youtube.playlists().insert(
            part="snippet,status",
            body={
                "snippet": {
                    "title": title,
                    "description": description,
                },
                "status": {"privacyStatus": "public"},
            },
        ).execute
    )
    return response["id"]


def get_video_stats(youtube: Resource, video_ids: list[str]) -> dict[str, int]:
    """video_id → view_count 매핑 반환. 최대 50개 배치, 1 unit 소모."""
    if not video_ids:
        return {}
    result: dict[str, int] = {}
    for i in range(0, len(video_ids), 50):
        chunk = video_ids[i:i + 50]
        response = _retry(
            youtube.videos().list(
                part="statistics",
                id=",".join(chunk),
            ).execute
        )
        for item in response.get("items", []):
            vc = item.get("statistics", {}).get("viewCount")
            if vc is not None:
                result[item["id"]] = int(vc)
    return result


def add_to_playlist(
    youtube: Resource, playlist_id: str, video_id: str
) -> None:
    """플레이리스트에 영상 추가. 일시적 오류 시 자동 재시도."""
    _retry(
        youtube.playlistItems().insert(
            part="snippet",
            body={
                "snippet": {
                    "playlistId": playlist_id,
                    "resourceId": {
                        "kind": "youtube#video",
                        "videoId": video_id,
                    },
                }
            },
        ).execute
    )
