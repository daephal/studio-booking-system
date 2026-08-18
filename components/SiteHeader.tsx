"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function SiteHeader({ studioName }: { studioName: string }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [solid, setSolid] = useState(!isHome);

  useEffect(() => {
    if (!isHome) {
      setSolid(true);
      return;
    }
    const onScroll = () => setSolid(window.scrollY > window.innerHeight - 90);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  return (
    <header
      style={{
        background: solid ? "rgba(15,15,19,0.72)" : "linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0))",
        backdropFilter: solid ? "saturate(160%) blur(20px)" : "none",
        WebkitBackdropFilter: solid ? "saturate(160%) blur(20px)" : "none",
        color: solid ? "var(--text)" : "#fff",
      }}
      className="fixed inset-x-0 top-0 z-50 transition-colors duration-300"
    >
      <div className="mx-auto flex h-[58px] max-w-[1180px] items-center justify-between gap-4 px-5">
        <Link href="/" className="flex items-center gap-1 text-base">
          <span className="font-bold tracking-[.04em]">{studioName}</span>
        </Link>
        <Link
          href="/booking"
          className="inline-flex items-center rounded-full border border-white bg-white px-[18px] py-[9px] text-sm font-semibold text-black transition-colors hover:bg-white/85"
        >
          예약하기
        </Link>
      </div>
    </header>
  );
}
