"use client";

/** deadline("YYYY-MM-DD")까지 남은 일수 — 자정 기준으로 오늘과 비교 */
function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function DeadlineBadge({ deadline }: { deadline: string }) {
  const daysLeft = daysUntil(deadline);
  const isPast = daysLeft < 0;
  const isUrgent = daysLeft <= 7;
  const label = isPast ? "마감됨" : daysLeft === 0 ? "D-DAY" : `D-${daysLeft}`;

  return (
    <span className="flex items-center gap-2 text-text-faint">
      셀렉 마감: {deadline}
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
          isPast || isUrgent ? "bg-[#e08a8a]/15 text-[#e08a8a]" : "bg-accent/15 text-accent-soft"
        }`}
      >
        {label}
      </span>
    </span>
  );
}

export function OriginalSelectionPanel({
  colorCount,
  colorLimit,
  retouchCount,
  retouchLimit,
  deadline,
  overallMemo,
  onOverallMemoChange,
  onSubmit,
  submitting,
  submitLabel,
}: {
  colorCount: number;
  colorLimit: number;
  retouchCount: number;
  retouchLimit: number;
  deadline: string;
  overallMemo: string;
  onOverallMemoChange: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitLabel: string;
}) {
  return (
    <div className="sticky top-0 z-10 space-y-3 border-b border-border bg-bg/90 p-3 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium text-text">
          색상보정 {colorCount}/{colorLimit} · 리터칭 {retouchCount}/{retouchLimit}
        </span>
        <DeadlineBadge deadline={deadline} />
      </div>
      <p className="text-xs text-text-faint">피부보정과 색감은 자연스러운 선에서 기본으로 보정해 드립니다.</p>
      <textarea
        value={overallMemo}
        onChange={(e) => onOverallMemoChange(e.target.value)}
        placeholder="전체 공통 요청사항"
        rows={2}
        className="jp-input w-full"
      />
      <button type="button" onClick={onSubmit} disabled={submitting} className="jp-btn-primary w-full rounded-xl py-2.5 text-sm font-semibold">
        {submitting ? "제출 중..." : submitLabel}
      </button>
    </div>
  );
}

export function ReeditPanel({
  remaining,
  max,
  overallMemo,
  onOverallMemoChange,
  onSubmit,
  submitting,
}: {
  remaining: number;
  max: number;
  overallMemo: string;
  onOverallMemoChange: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  if (remaining <= 0) {
    return (
      <div className="sticky top-0 z-10 border-b border-border bg-bg/90 p-3 text-center text-sm text-text-muted backdrop-blur">
        재수정 요청이 모두 사용되었습니다.
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-10 space-y-3 border-b border-border bg-bg/90 p-3 backdrop-blur">
      <span className="text-sm font-medium text-text">
        재수정 요청 가능: {remaining}/{max}회
      </span>
      <textarea
        value={overallMemo}
        onChange={(e) => onOverallMemoChange(e.target.value)}
        placeholder="전체 공통 요청사항"
        rows={2}
        className="jp-input w-full"
      />
      <button type="button" onClick={onSubmit} disabled={submitting} className="jp-btn-primary w-full rounded-xl py-2.5 text-sm font-semibold">
        {submitting ? "제출 중..." : "재수정 요청 제출"}
      </button>
    </div>
  );
}
