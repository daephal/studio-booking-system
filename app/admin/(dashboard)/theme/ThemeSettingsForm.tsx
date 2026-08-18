"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buildThemeCssVars, type ThemeMode } from "@/lib/theme";

const ACCENT_PRESETS = ["#7E76A0", "#4F7CFF", "#E0607E", "#2FA36B", "#D98E32", "#5AA9C9"];

export function ThemeSettingsForm({
  initialMode,
  initialAccent,
}: {
  initialMode: ThemeMode;
  initialAccent: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const [accent, setAccent] = useState(initialAccent);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const previewVars = buildThemeCssVars({ mode, accent });

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, accent }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(body?.error || "저장 실패");
        return;
      }
      setMessage("저장되었습니다. 새로고침하면 사이트 전체에 적용됩니다.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="adm-card space-y-3 rounded-lg p-4">
        <h2 className="font-medium">배경</h2>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setMode("dark")}
            className={`flex-1 rounded-lg border p-3 text-sm ${
              mode === "dark" ? "border-adm-accent" : "border-adm-border-strong"
            }`}
            style={{ background: "#0F0F13", color: "#ECECEF" }}
          >
            🌙 어두운 배경
          </button>
          <button
            type="button"
            onClick={() => setMode("light")}
            className={`flex-1 rounded-lg border p-3 text-sm ${
              mode === "light" ? "border-adm-accent" : "border-adm-border-strong"
            }`}
            style={{ background: "#FFFFFF", color: "#17171C" }}
          >
            ☀️ 밝은 배경
          </button>
        </div>
      </div>

      <div className="adm-card space-y-3 rounded-lg p-4">
        <h2 className="font-medium">메인 컬러</h2>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded border border-adm-border-strong bg-transparent p-0"
          />
          <input
            type="text"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className="adm-input w-32 font-mono text-sm"
            maxLength={7}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {ACCENT_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setAccent(c)}
              className="h-7 w-7 rounded-full border border-adm-border-strong"
              style={{ background: c }}
              aria-label={c}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-adm-border-strong p-4" style={previewVars as React.CSSProperties}>
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
          미리보기
        </p>
        <div className="rounded-lg p-4" style={{ background: "var(--bg)" }}>
          <div className="rounded-lg p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p style={{ color: "var(--text)" }}>예약이 접수되었습니다</p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              촬영 날짜와 시간을 확인해주세요.
            </p>
            <a className="mt-2 inline-block text-sm" style={{ color: "var(--accent-soft)" }}>
              자세히 보기 →
            </a>
            <button
              type="button"
              className="mt-3 block rounded-md px-4 py-2 text-sm text-white"
              style={{ background: "var(--accent)" }}
            >
              예약하기
            </button>
          </div>
        </div>
      </div>

      {message && <p className="text-sm text-adm-text-muted">{message}</p>}

      <button type="button" onClick={handleSave} disabled={saving} className="adm-btn-primary rounded-md px-4 py-2 text-sm">
        {saving ? "저장 중..." : "저장"}
      </button>
    </div>
  );
}
