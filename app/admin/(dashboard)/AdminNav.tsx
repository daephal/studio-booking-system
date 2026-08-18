"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface SubItem {
  href: string;
  label: string;
}

interface Tab {
  key: string;
  label: string;
  match: (path: string) => boolean;
  items: SubItem[];
}

const TABS: Tab[] = [
  {
    key: "reservations",
    label: "예약관리",
    match: (p) => p === "/admin" || p.startsWith("/admin/reservations") || p.startsWith("/admin/galleries"),
    items: [
      { href: "/admin", label: "예약 목록" },
      { href: "/admin/reservations/new", label: "수동 등록" },
    ],
  },
  {
    key: "site",
    label: "홈페이지",
    match: (p) => p.startsWith("/admin/site-photos"),
    items: [{ href: "/admin/site-photos", label: "홈페이지 사진" }],
  },
  {
    key: "settings",
    label: "설정",
    match: (p) =>
      p.startsWith("/admin/setup") ||
      p.startsWith("/admin/studio-profile") ||
      p.startsWith("/admin/terms") ||
      p.startsWith("/admin/reservation-fields") ||
      p.startsWith("/admin/theme"),
    items: [
      { href: "/admin/setup", label: "설정 가이드" },
      { href: "/admin/studio-profile", label: "스튜디오 프로필" },
      { href: "/admin/terms", label: "촬영 약관" },
      { href: "/admin/reservation-fields", label: "예약 항목 설정" },
      { href: "/admin/setup/google", label: "구글 캘린더 연동" },
      { href: "/admin/theme", label: "테마 설정" },
    ],
  },
];

export function AdminNav() {
  const pathname = usePathname();
  const activeTabIndex = Math.max(
    0,
    TABS.findIndex((t) => t.match(pathname))
  );
  const activeTab = TABS[activeTabIndex];

  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  useEffect(() => {
    const el = tabRefs.current[activeTabIndex];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeTabIndex]);

  return (
    <nav className="overflow-hidden rounded-2xl border border-adm-border-strong bg-adm-surface">
      <div className="relative flex gap-1 p-1.5">
        {indicator && (
          <span
            className="absolute top-1.5 h-[calc(100%-0.75rem)] rounded-full bg-adm-surface-2 transition-[left,width] duration-200 ease-out"
            style={{ left: indicator.left, width: indicator.width }}
          />
        )}
        {TABS.map((tab, i) => (
          <Link
            key={tab.key}
            href={tab.items[0].href}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            className={`adm-pill relative z-10 rounded-full px-4 py-1.5 text-sm font-medium ${
              i === activeTabIndex ? "text-adm-text" : "text-adm-text-muted hover:text-adm-text"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-adm-border bg-adm-surface-2/40 px-3 py-2">
        <span className="mr-0.5 flex-shrink-0 text-[10px] font-medium uppercase tracking-wide text-adm-text-faint">
          {activeTab.label}
        </span>
        {activeTab.items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`adm-pill rounded-full px-3 py-1 text-xs ${
                isActive
                  ? "bg-adm-accent text-white"
                  : "bg-adm-surface text-adm-text-muted hover:bg-adm-surface-hover hover:text-adm-text"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
