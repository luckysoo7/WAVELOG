"use client";

import { usePathname } from "next/navigation";

export default function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <footer
      className="md:hidden px-6 py-4 border-t text-xs leading-relaxed"
      style={{
        borderColor: "rgba(138,155,176,0.08)",
        color: "var(--text-muted)",
        opacity: 0.45,
      }}
    >
      ⓒ MBC — 방송 콘텐츠 저작권은 MBC에 있습니다
      <br />
      unofficial fan site · not affiliated with MBC
    </footer>
  );
}
