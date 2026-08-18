"use client";

import type { ReservationStatus } from "@/lib/types";
import { RESERVATION_FLOW_STATUSES, RESERVATION_STATUS_COLORS } from "@/lib/constants";

const STEPS = RESERVATION_FLOW_STATUSES as { key: ReservationStatus; label: string }[];

export function StatusStepper({
  status,
  onChange,
}: {
  status: ReservationStatus;
  onChange: (next: ReservationStatus) => void;
}) {
  const isCancelled = status === "cancelled";
  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="adm-card space-y-3 rounded-lg p-4">
      <div className="flex items-start overflow-x-auto" style={{ minWidth: 0 }}>
        <div className="flex flex-1 items-start" style={{ minWidth: 420 }}>
        {STEPS.map((step, i) => {
          const done = !isCancelled && i < currentIndex;
          const current = !isCancelled && i === currentIndex;
          const segmentDone = !isCancelled && i < currentIndex;
          const color = RESERVATION_STATUS_COLORS[step.key];
          return (
            <div key={step.key} className="flex flex-1 items-start">
              <button
                type="button"
                onClick={() => onChange(step.key)}
                className="adm-pill flex flex-shrink-0 flex-col items-center gap-1"
              >
                <span
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 text-[10px] transition-colors"
                  style={
                    done
                      ? { borderColor: color, background: color, color: "#fff" }
                      : current
                        ? { borderColor: color, background: "var(--adm-bg)", color }
                        : { borderColor: "var(--adm-border-strong)", background: "var(--adm-surface-2)", color: "var(--adm-text-faint)" }
                  }
                >
                  {done ? "✓" : i + 1}
                </span>
                <span
                  className={`w-12 text-center text-[10px] leading-tight ${
                    current ? "font-semibold text-adm-text" : "text-adm-text-faint"
                  }`}
                >
                  {step.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className="mt-3 h-0.5 flex-1"
                  style={{ background: segmentDone ? color : "var(--adm-border-strong)" }}
                />
              )}
            </div>
          );
        })}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-adm-border pt-2">
        {isCancelled ? (
          <span className="text-xs text-[#e08a8a]">이 예약은 취소되었습니다.</span>
        ) : (
          <span className="text-xs text-adm-text-faint">역을 클릭해서 진행 상태를 바꿀 수 있습니다.</span>
        )}
        <button
          type="button"
          onClick={() => onChange(isCancelled ? "received" : "cancelled")}
          className={`text-xs underline ${isCancelled ? "text-adm-accent-soft" : "text-[#e08a8a]"}`}
        >
          {isCancelled ? "취소 해제" : "예약 취소"}
        </button>
      </div>
    </div>
  );
}
