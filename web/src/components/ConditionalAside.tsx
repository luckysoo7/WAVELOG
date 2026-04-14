"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import type { DateEntry } from "@/lib/data";

interface Props {
  bcampDates: DateEntry[];
  byulbamDates: DateEntry[];
}

export default function ConditionalAside({ bcampDates, byulbamDates }: Props) {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <aside
      className="hidden md:flex flex-col w-72 shrink-0 sticky top-0 h-screen overflow-y-auto"
      style={{
        background: "rgba(255, 255, 255, 0.025)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(255, 255, 255, 0.07)",
      }}
    >
      <Sidebar bcampDates={bcampDates} byulbamDates={byulbamDates} />
    </aside>
  );
}
