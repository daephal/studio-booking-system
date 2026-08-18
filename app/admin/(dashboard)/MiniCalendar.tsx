"use client";

import { useMemo, useState } from "react";

interface DayCount {
  date: string;
  count: number;
}

const MONTH_LABELS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

export function MiniCalendar({ eventDates }: { eventDates: string[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of eventDates) map.set(d, (map.get(d) ?? 0) + 1);
    return map;
  }, [eventDates]);

  const yearOptions = useMemo(() => {
    const years = new Set(eventDates.map((d) => Number(d.slice(0, 4))));
    years.add(now.getFullYear());
    years.add(year);
    return Array.from(years).sort((a, b) => a - b);
  }, [eventDates, year, now]);

  const cells: (DayCount | null)[] = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startWeekday = firstDay.getDay();
    const result: (DayCount | null)[] = [];
    for (let i = 0; i < startWeekday; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      result.push({ date, count: counts.get(date) ?? 0 });
    }
    return result;
  }, [year, month, counts]);

  function shiftMonth(delta: number) {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setYear(newYear);
    setMonth(newMonth);
  }

  return (
    <div className="adm-card rounded-lg p-4 text-sm text-adm-text">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="이전 달"
            className="adm-btn-secondary flex h-7 w-7 items-center justify-center rounded-full text-sm"
          >
            ‹
          </button>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="adm-input w-auto py-1.5 text-sm"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="adm-input w-auto py-1.5 text-sm"
          >
            {MONTH_LABELS.map((label, i) => (
              <option key={label} value={i}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="다음 달"
            className="adm-btn-secondary flex h-7 w-7 items-center justify-center rounded-full text-sm"
          >
            ›
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setYear(now.getFullYear());
            setMonth(now.getMonth());
          }}
          className="text-xs text-adm-accent-soft"
        >
          오늘
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-adm-text-faint">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell, i) =>
          cell ? (
            <div
              key={cell.date}
              className={`flex h-11 flex-col items-center justify-start rounded-md p-1 text-xs sm:h-14 ${
                cell.count > 0 ? "bg-adm-surface-hover" : "bg-transparent"
              }`}
            >
              <span>{Number(cell.date.slice(-2))}</span>
              {cell.count > 0 && (
                <span className="mt-1 rounded-full bg-adm-accent px-1.5 text-[10px] text-white">{cell.count}</span>
              )}
            </div>
          ) : (
            <div key={`empty-${i}`} />
          )
        )}
      </div>
    </div>
  );
}
