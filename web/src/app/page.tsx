import { loadLatest } from "@/lib/data";

export default function Home() {
  const latest = loadLatest();

  if (!latest) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center" style={{ color: "var(--text-muted)" }}>
          <p className="text-2xl mb-2">아직 선곡표가 없습니다</p>
          <p className="text-sm">크롤러를 먼저 실행해주세요</p>
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-12 max-w-xl mx-auto">
      {/* 헤더 */}
      <header className="mb-8">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--text-muted)" }}>
          최신 방송
        </p>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="date-heading">
          {latest.date}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--sunset-gold)" }}>
          {latest.dayOfWeek} · {latest.songs.length}곡
        </p>
      </header>

      {/* CTA 버튼 */}
      {latest.youtube && (
        <div className="flex gap-3 mb-10">
          <a
            href={latest.youtube.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-80"
            style={{
              background: "linear-gradient(135deg, var(--sunset-orange), var(--sunset-gold))",
              color: "#fff",
            }}
          >
            YouTube에서 듣기
          </a>
          <a
            href={latest.youtube.musicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-80"
            style={{
              background: "var(--card-bg)",
              color: "var(--sunset-gold)",
              border: "1px solid var(--sunset-gold)",
            }}
          >
            YouTube Music
          </a>
        </div>
      )}

      {/* 선곡 목록 */}
      <ol className="space-y-3" data-testid="song-list">
        {latest.songs.map((song) => (
          <li
            key={song.order}
            className="flex items-start gap-4 p-4 rounded-xl"
            style={{ background: "var(--card-bg)" }}
          >
            <span
              className="text-xs font-mono w-5 shrink-0 mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              {song.order}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-snug truncate">{song.title}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                {song.artist}
              </p>
            </div>
            {song.videoId && (
              <a
                href={`https://www.youtube.com/watch?v=${song.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-xs px-2 py-1 rounded-md transition-opacity hover:opacity-70"
                style={{ background: "rgba(232,112,74,0.15)", color: "var(--sunset-orange)" }}
              >
                ▶
              </a>
            )}
          </li>
        ))}
      </ol>
    </main>
  );
}
