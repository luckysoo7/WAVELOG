import type { PlaylistData } from "@/lib/data";

interface Props {
  data: PlaylistData;
  label?: string;
}

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${+m}월 ${+d}일`;
}

export default function PlaylistView({ data, label = "지난 방송" }: Props) {
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

        <div style={{ borderTop: "1px solid rgba(232, 112, 74, 0.3)", marginBottom: "1.25rem" }} />

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {data.dayOfWeek} · {data.songs.length}곡 선곡
          </p>
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
            className="track-row flex items-center gap-4 py-3.5 group cursor-default"
            style={{ borderBottom: "1px solid var(--track-border)" }}
          >
            <span
              className="w-6 text-right text-xs tabular-nums shrink-0 font-mono"
              style={{ color: "var(--text-muted)", opacity: 0.5 }}
            >
              {song.order}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm leading-snug truncate">{song.title}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                {song.artist}
              </p>
            </div>
            {song.videoId ? (
              <a
                href={`https://www.youtube.com/watch?v=${song.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 w-6 h-6 flex items-center justify-center text-xs transition-all opacity-0 group-hover:opacity-100"
                style={{ color: "var(--sunset-orange)" }}
              >
                ▶
              </a>
            ) : (
              <div className="w-6 shrink-0" />
            )}
          </li>
        ))}
      </ol>
    </main>
  );
}
