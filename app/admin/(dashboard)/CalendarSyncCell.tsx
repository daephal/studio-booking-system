"use client";

import { useState } from "react";

export function CalendarSyncCell({
  reservationId,
  hasEvent,
  cancelled,
}: {
  reservationId: string;
  hasEvent: boolean;
  cancelled: boolean;
}) {
  const [synced, setSynced] = useState(hasEvent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (cancelled) return <span className="text-xs text-adm-text-faint">-</span>;

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reservations/${reservationId}/retry-calendar`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (res.ok) {
        setSynced(true);
      } else {
        setError(body?.error || "동기화 실패");
      }
    } catch {
      setError("동기화 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className={synced ? "text-emerald-400" : "text-amber-400"}>{synced ? "✅" : "⚠️"}</span>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        title={
          synced
            ? "현재 설정된 캘린더에 일정을 다시 만듭니다 (예전 캘린더에 남은 중복 일정은 직접 삭제해주세요)"
            : "캘린더 동기화 재시도"
        }
        className="adm-btn-secondary whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] disabled:opacity-50"
      >
        {loading ? "처리 중..." : synced ? "다시 만들기" : "재시도"}
      </button>
      {error && <span className="text-[#e08a8a]">{error}</span>}
    </span>
  );
}
