"use client";

import { useEffect, useCallback, useRef } from "react";
import type { GridPhoto } from "./PhotoGrid";

export function PhotoLightbox({
  photos,
  index,
  mode,
  memo,
  onMemoChange,
  onClose,
  onNavigate,
  onToggleHeart,
  onToggleSparkle,
  onToggleFlag,
  onToggleSnsPublic,
  onDownload,
}: {
  photos: GridPhoto[];
  index: number;
  mode: "select" | "flag" | "view";
  memo: string;
  onMemoChange: (value: string) => void;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onToggleHeart?: (id: string) => void;
  onToggleSparkle?: (id: string) => void;
  onToggleFlag?: (id: string) => void;
  onToggleSnsPublic?: (id: string) => void;
  onDownload?: (id: string) => void;
}) {
  const photo = photos[index];

  const goNext = useCallback(() => {
    if (index < photos.length - 1) onNavigate(index + 1);
  }, [index, photos.length, onNavigate]);

  const goPrev = useCallback(() => {
    if (index > 0) onNavigate(index - 1);
  }, [index, onNavigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goNext, goPrev]);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    if (deltaX < 0) goNext();
    else goPrev();
  }

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
      <div className="flex items-center justify-between px-4 py-3 text-white/80">
        <span className="truncate text-sm">{photo.filename}</span>
        <button type="button" onClick={onClose} className="rounded p-1 hover:bg-white/10" aria-label="닫기">
          ✕
        </button>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden px-2"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {index > 0 && (
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
            aria-label="이전 사진"
          >
            ‹
          </button>
        )}
        {photo.thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.thumbUrl} alt={photo.filename} className="max-h-full max-w-full object-contain" />
        ) : (
          <div className="text-white/50">로드 실패</div>
        )}
        {index < photos.length - 1 && (
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
            aria-label="다음 사진"
          >
            ›
          </button>
        )}
      </div>

      <div className="space-y-3 border-t border-white/10 bg-black px-4 py-3">
        <div className="flex items-center gap-3">
          {mode === "select" && (
            <>
              <button
                type="button"
                onClick={() => onToggleHeart?.(photo.id)}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  photo.heart ? "bg-rose-500 text-white" : "bg-white/10 text-white/80"
                }`}
              >
                ♥ 색상보정
              </button>
              {photo.heart && (
                <button
                  type="button"
                  onClick={() => onToggleSparkle?.(photo.id)}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    photo.sparkle ? "bg-amber-400 text-white" : "bg-white/10 text-white/80"
                  }`}
                >
                  ✨ 리터칭
                </button>
              )}
            </>
          )}
          {mode === "flag" && (
            <button
              type="button"
              onClick={() => onToggleFlag?.(photo.id)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                photo.flagged ? "bg-rose-500 text-white" : "bg-white/10 text-white/80"
              }`}
            >
              ✎ 재수정 요청
            </button>
          )}
          {photo.snsPublic !== undefined && onToggleSnsPublic && (
            <button
              type="button"
              onClick={() => onToggleSnsPublic(photo.id)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                photo.snsPublic ? "bg-white/10 text-white/80" : "bg-amber-600 text-white"
              }`}
            >
              {photo.snsPublic ? "🌐 SNS 공개 가능" : "🚫 SNS 비공개"}
            </button>
          )}
          {onDownload && (
            <button
              type="button"
              onClick={() => onDownload(photo.id)}
              className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/80"
            >
              ⭳ 원본 다운로드
            </button>
          )}
        </div>
        {mode !== "view" && (
          <input
            type="text"
            value={memo}
            onChange={(e) => onMemoChange(e.target.value)}
            placeholder="이 사진에 대한 요청사항을 입력하세요"
            className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30"
          />
        )}
      </div>
    </div>
  );
}
