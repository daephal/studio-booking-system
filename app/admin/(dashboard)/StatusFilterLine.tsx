import Link from "next/link";
import { RESERVATION_FLOW_STATUSES, RESERVATION_STATUS_COLORS } from "@/lib/constants";

/** 예약 상세의 노선도 스테퍼와 같은 시각 언어로 만든 상태별 필터 — 선택된 역(필터)만 강조합니다. */
export function StatusFilterLine({ current }: { current?: string }) {
  const isAll = !current || current === "all";
  const isCancelled = current === "cancelled";

  return (
    <div className="adm-card space-y-3 rounded-lg p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Link
          href="/admin"
          className={`adm-pill rounded-full px-3 py-1 ${isAll ? "bg-adm-accent text-white" : "bg-adm-surface-2 text-adm-text-muted"}`}
        >
          전체
        </Link>
        <Link
          href="/admin?status=cancelled"
          className="adm-pill rounded-full px-3 py-1"
          style={
            isCancelled
              ? { background: RESERVATION_STATUS_COLORS.cancelled, color: "#fff" }
              : { background: "var(--adm-surface-2)", color: RESERVATION_STATUS_COLORS.cancelled }
          }
        >
          취소
        </Link>
      </div>

      <div className="flex items-start overflow-x-auto">
        <div className="flex flex-1 items-start" style={{ minWidth: 420 }}>
          {RESERVATION_FLOW_STATUSES.map((step, i) => {
            const active = current === step.key;
            const color = RESERVATION_STATUS_COLORS[step.key];
            return (
              <div key={step.key} className="flex flex-1 items-start">
                <Link href={`/admin?status=${step.key}`} className="adm-pill flex flex-shrink-0 flex-col items-center gap-1">
                  <span
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 text-[10px] transition-colors"
                    style={
                      active
                        ? { borderColor: color, background: color, color: "#fff" }
                        : { borderColor: "var(--adm-border-strong)", background: "var(--adm-surface-2)", color: "var(--adm-text-faint)" }
                    }
                  >
                    {i + 1}
                  </span>
                  <span
                    className={`w-12 text-center text-[10px] leading-tight ${
                      active ? "font-semibold text-adm-text" : "text-adm-text-faint"
                    }`}
                  >
                    {step.label}
                  </span>
                </Link>
                {i < RESERVATION_FLOW_STATUSES.length - 1 && <div className="mt-3 h-0.5 flex-1 bg-adm-border-strong" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
