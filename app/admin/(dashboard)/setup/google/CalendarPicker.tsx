"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CalendarOption } from "@/lib/google-calendar";

export function CalendarPicker({
  calendars,
  selectedId,
}: {
  calendars: CalendarOption[];
  selectedId: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(selectedId);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/google-calendar/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarId: value }),
      });
      const body = await res.json();
      if (!res.ok) {
        setMessage(body?.error || "저장 실패");
        return;
      }
      setMessage("저장되었습니다.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="adm-card space-y-3 rounded-lg p-4">
      <h2 className="font-medium">동기화할 캘린더</h2>
      <p className="text-xs text-adm-text-faint">
        예약이 들어오면 아래에서 선택한 캘린더에 일정이 자동으로 생성됩니다. 같은 이름의 캘린더가 여러 개면 순서로 구분해보세요.
      </p>
      <select value={value} onChange={(e) => setValue(e.target.value)} className="adm-input w-full">
        {calendars.map((c, i) => (
          <option key={c.id} value={c.id}>
            {c.summary}
            {c.primary ? " (기본 캘린더)" : ""} — #{i + 1}
          </option>
        ))}
      </select>
      <button type="button" onClick={handleSave} disabled={saving} className="adm-btn-primary rounded-md px-4 py-2 text-sm">
        {saving ? "저장 중..." : "이 캘린더로 저장"}
      </button>
      {message && <p className="text-sm text-adm-text-muted">{message}</p>}
    </div>
  );
}
