"use client";

import { useEffect, useState } from "react";
import { KakaoInquiryModal } from "@/components/KakaoInquiryModal";

// 대표 사진은 관리자 페이지(/admin/site-photos)에서 여러 장(최대 4장) 업로드할 수 있습니다.
// 사진이 여러 장이면 천천히 확대/축소되다가 다음 사진으로 서서히 페이드 전환되고,
// 1장뿐이면 그 사진이 계속 확대/축소를 반복합니다.
const DISPLAY_SECONDS = 8;

export function Hero({ imageUrls, kakaoChannelUrl }: { imageUrls: string[]; kakaoChannelUrl: string }) {
  const [index, setIndex] = useState(0);
  const [kakaoOpen, setKakaoOpen] = useState(false);
  const count = imageUrls.length;

  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, DISPLAY_SECONDS * 1000);
    return () => clearInterval(timer);
  }, [count]);

  function scrollToFeed() {
    document.getElementById("jp-feed")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <section className="relative h-[100dvh] min-h-[560px] w-full overflow-hidden" style={{ background: "#0a0a0d" }}>
        <div className="absolute inset-0">
          {count > 0 ? (
            imageUrls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-opacity"
                style={{
                  opacity: i === index ? 1 : 0,
                  transitionDuration: "1500ms",
                  animation: i === index ? `jpKenBurns ${DISPLAY_SECONDS}s ease-in-out infinite` : "none",
                }}
              />
            ))
          ) : (
            <div className="flex h-full w-full items-center justify-center" style={{ background: "var(--surface)" }}>
              <span className="text-sm" style={{ color: "var(--text-faint)" }}>
                대표 사진을 준비 중입니다
              </span>
            </div>
          )}
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%]"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0) 100%)" }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 px-5 sm:px-16"
          style={{ paddingBottom: "clamp(52px,9vh,88px)" }}
        >
          <button
            type="button"
            onClick={() => setKakaoOpen(true)}
            className="pointer-events-auto inline-block cursor-pointer border-none bg-transparent p-0 text-left"
          >
            <div className="flex items-center gap-3 text-white">
              <span
                style={{ fontSize: "clamp(26px,5vw,44px)", textShadow: "0 2px 24px rgba(0,0,0,0.5)" }}
                className="font-bold leading-[1.05] tracking-tight"
              >
                가격 및 예약문의
              </span>
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0, filter: "drop-shadow(0 1px 8px rgba(0,0,0,0.5))" }}
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </div>
            <div
              style={{ fontSize: "clamp(13px,2vw,15px)", color: "rgba(255,255,255,0.78)", textShadow: "0 1px 10px rgba(0,0,0,0.6)" }}
              className="mt-2"
            >
              카카오톡으로 편하게 문의하세요
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={scrollToFeed}
          aria-label="갤러리로 스크롤"
          className="absolute bottom-5 left-1/2 flex -translate-x-1/2 cursor-pointer items-center border-none bg-transparent text-white/85 animate-[jpFloat_2.4s_ease-in-out_infinite]"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 1px 6px rgba(0,0,0,0.5))" }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </section>

      {kakaoOpen && <KakaoInquiryModal kakaoChannelUrl={kakaoChannelUrl} onClose={() => setKakaoOpen(false)} />}
    </>
  );
}
