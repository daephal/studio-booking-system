"use client";

import { useState } from "react";

export function PhotoFeed({ images, instagramUrl }: { images: { id: string; url: string }[]; instagramUrl: string }) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <section id="jp-feed" style={{ background: "var(--bg)" }}>
      <div className="flex justify-center px-4 pb-[18px] pt-[22px]">
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ background: "var(--surface)", border: "1px solid var(--border-strong)", color: "var(--text)" }}
          className="inline-flex items-center gap-2 rounded-full px-[18px] py-2.5 text-[13px] font-semibold transition-colors"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5.5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
          </svg>
          Instagram에서 보기
        </a>
      </div>

      {images.length > 0 ? (
        <div className="grid gap-[3px]" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(clamp(110px,24vw,250px),1fr))" }}>
          {images.map((img) => (
            <div
              key={img.id}
              onClick={() => setLightbox(img.url)}
              style={{ background: "#16161b", cursor: "zoom-in" }}
              className="relative aspect-square overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" loading="lazy" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      ) : (
        <p className="pb-16 text-center text-sm" style={{ color: "var(--text-faint)" }}>
          사진 준비 중입니다
        </p>
      )}

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ background: "rgba(6,6,9,0.94)" }}
          className="fixed inset-0 z-[120] flex cursor-zoom-out items-center justify-center p-6 animate-[jpFade_200ms_ease-out]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt=""
            style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}
            className="max-h-full max-w-full rounded-[10px] object-contain animate-[jpPop_260ms_cubic-bezier(0.32,0.72,0,1)]"
          />
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="닫기"
            style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
            className="fixed right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border-none"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
