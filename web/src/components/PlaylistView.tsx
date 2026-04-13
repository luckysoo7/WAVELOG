import type { PlaylistData } from "@/lib/data";

interface Props {
  data: PlaylistData;
  label?: string;
}

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${+m}월 ${+d}일`;
}

// DSOTM: 트랙 번호 → 스펙트럼 색상 (red → violet)
function spectrumColor(order: number, total: number): string {
  const hue = Math.round(((order - 1) / Math.max(total - 1, 1)) * 220);
  return `hsl(${hue}, 75%, 62%)`;
}

export default function PlaylistView({ data, label = "지난 방송" }: Props) {
  const total = data.songs.length;
  const matchedCount = data.songs.filter((s) => s.videoId).length;

  return (
    <main className="px-8 max-w-[760px] mx-auto">
      {/* 에디토리얼 히어로 */}
      <header className="pt-12 pb-8">

        <div className="flex items-center justify-between mb-5">
          <p
            className="text-xs tracking-[0.25em] uppercase font-medium"
            style={{ color: "var(--sunset-orange)" }}
          >
            Radio Station · MBC FM4U 91.9
          </p>
          {data.seqID && (
            <p className="text-xs tracking-widest tabular-nums" style={{ color: "var(--text-muted)" }}>
              #{data.seqID}
            </p>
          )}
        </div>

        <p className="text-sm font-medium mb-3" style={{ color: "var(--text-muted)" }}>
          배철수의 음악캠프
        </p>

        <h1
          className="font-bold leading-none tracking-tight mb-6"
          data-testid="date-heading"
          style={{ fontSize: "clamp(3rem, 8vw, 5.5rem)", letterSpacing: "-0.02em" }}
        >
          {formatDate(data.date)}
        </h1>

        {/* DSOTM 스펙트럼 구분선 — 프리즘을 통과한 빛 */}
        <div
          style={{
            height: "1px",
            marginBottom: "1.25rem",
            background:
              "linear-gradient(to right, transparent, #ff4444 8%, #ff8800 22%, #ffee00 38%, #44cc00 52%, #00aaff 66%, #6644ff 82%, transparent)",
            opacity: 0.55,
          }}
        />

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {data.dayOfWeek} · {data.songs.length}곡 선곡
            </p>
            {/* Option B: YouTube 재생 가능 카운트 */}
            {matchedCount > 0 && (
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
                이 중{" "}
                <span style={{ color: "var(--sunset-orange)", opacity: 1 }}>
                  {matchedCount}곡
                </span>
                을 지금 들을 수 있어요
              </p>
            )}
          </div>
          {data.youtube && (
            <div className="flex gap-2">
              <a
                href={data.youtube.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 text-xs font-semibold transition-opacity hover:opacity-85"
                style={{ background: "var(--sunset-orange)", color: "#fff", borderRadius: "3px" }}
              >
                YouTube
              </a>
              <a
                href={data.youtube.musicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
                style={{
                  color: "var(--sunset-orange)",
                  border: "1px solid rgba(232,112,74,0.35)",
                  borderRadius: "3px",
                }}
              >
                Music
              </a>
            </div>
          )}
        </div>
      </header>

      {/* 선곡 목록 */}
      <ol data-testid="song-list" className="pb-16">
        {data.songs.map((song) => (
          <li
            key={song.order}
            className="track-row flex items-center gap-4 py-3.5 group"
            style={{
              borderBottom: "1px solid var(--track-border)",
              cursor: song.videoId ? "pointer" : "default",
            }}
          >
            {/* Option A: 스펙트럼 점 — videoId 있는 곡만 */}
            <div className="shrink-0 flex items-center justify-end gap-1.5 w-8">
              {song.videoId && (
                <span
                  className="spectrum-dot"
                  aria-hidden
                  style={{
                    display: "inline-block",
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: spectrumColor(song.order, total),
                    opacity: 0.65,
                    transition: "transform 0.15s, opacity 0.15s",
                    flexShrink: 0,
                  }}
                />
              )}
              <span
                className="text-right text-xs tabular-nums font-mono"
                style={{ color: spectrumColor(song.order, total), opacity: 0.85 }}
              >
                {song.order}
              </span>
            </div>

            {song.videoId ? (
              <a
                href={`https://www.youtube.com/watch?v=${song.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0"
              >
                <p className="font-medium text-sm leading-snug truncate group-hover:underline"
                   style={{ textUnderlineOffset: "3px", textDecorationColor: spectrumColor(song.order, total) }}>
                  {song.title}
                </p>
                <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                  {song.artist}
                </p>
              </a>
            ) : (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm leading-snug truncate">{song.title}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                  {song.artist}
                </p>
              </div>
            )}

            {song.videoId ? (
              <span
                className="shrink-0 w-5 h-5 flex items-center justify-center text-xs transition-all opacity-0 group-hover:opacity-100"
                aria-hidden
                style={{ color: spectrumColor(song.order, total) }}
              >
                ▶
              </span>
            ) : (
              <div className="w-5 shrink-0" />
            )}
          </li>
        ))}
      </ol>
    </main>
  );
}
