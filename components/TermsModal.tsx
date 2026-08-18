"use client";

import { useEffect } from "react";
import type { TermsSection } from "@/lib/terms";

export function TermsModal({
  title,
  sections,
  onClose,
}: {
  title: string;
  sections: TermsSection[];
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{ background: "rgba(0,0,0,0.7)" }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-5 animate-[jpFade_220ms_ease-out]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
        className="flex max-h-[82vh] w-full max-w-lg flex-col overflow-hidden rounded-[22px] shadow-2xl animate-[jpUp_300ms_cubic-bezier(0.32,0.72,0,1)]"
      >
        <div
          style={{ borderBottom: "1px solid var(--border)" }}
          className="flex items-center justify-between px-6 py-5"
        >
          <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            style={{ background: "var(--surface-hover)" }}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-6 py-6 text-sm">
          {sections.map((section) => (
            <div key={section.heading}>
              <h3 className="mb-2.5 text-[15px] font-bold" style={{ color: "var(--text)" }}>
                {section.heading}
              </h3>
              <ul className="list-disc space-y-1.5 pl-[18px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {section.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="px-6 py-4" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "var(--accent)" }}
            className="w-full rounded-xl py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
