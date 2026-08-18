"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Terms } from "@/lib/terms-server";
import type { TermsSection } from "@/lib/terms";

function sectionsToDraft(sections: TermsSection[]) {
  return sections.map((s) => ({ heading: s.heading, itemsText: s.items.join("\n") }));
}

export function TermsEditorForm({ initialTerms }: { initialTerms: Terms }) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTerms.title);
  const [sections, setSections] = useState(sectionsToDraft(initialTerms.sections));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function updateSection(index: number, patch: Partial<{ heading: string; itemsText: string }>) {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addSection() {
    setSections((prev) => [...prev, { heading: `${prev.length + 1}. 새 항목`, itemsText: "" }]);
  }

  function removeSection(index: number) {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setMessage(null);
    if (!title.trim()) {
      setMessage("약관 제목을 입력해주세요.");
      return;
    }
    const payload = {
      title,
      sections: sections.map((s) => ({
        heading: s.heading,
        items: s.itemsText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      })),
    };
    setSaving(true);
    try {
      const res = await fetch("/api/admin/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => null);
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
    <div className="space-y-6">
      <label className="block text-sm text-adm-text-muted">
        약관 제목
        <input type="text" className="adm-input w-full" value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>

      <div className="space-y-4">
        {sections.map((s, i) => (
          <div key={i} className="adm-card space-y-2 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="adm-input w-full"
                value={s.heading}
                onChange={(e) => updateSection(i, { heading: e.target.value })}
              />
              <button
                type="button"
                onClick={() => removeSection(i)}
                className="adm-btn-secondary flex-shrink-0 rounded-md px-3 py-2 text-xs"
              >
                삭제
              </button>
            </div>
            <textarea
              className="adm-input w-full"
              rows={5}
              placeholder="한 줄에 하나씩 입력하세요"
              value={s.itemsText}
              onChange={(e) => updateSection(i, { itemsText: e.target.value })}
            />
          </div>
        ))}
      </div>

      <button type="button" onClick={addSection} className="adm-btn-secondary rounded-md px-4 py-2 text-sm">
        + 항목 추가
      </button>

      {message && <p className="text-sm text-adm-text-muted">{message}</p>}

      <div>
        <button type="button" onClick={handleSave} disabled={saving} className="adm-btn-primary rounded-md px-4 py-2 text-sm">
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}
