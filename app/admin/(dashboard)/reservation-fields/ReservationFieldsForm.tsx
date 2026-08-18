"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ShootTypeSetting, CustomFieldSetting } from "@/lib/form-settings";

export function ReservationFieldsForm({
  initialShootTypes,
  initialCustomFields,
}: {
  initialShootTypes: ShootTypeSetting[];
  initialCustomFields: CustomFieldSetting[];
}) {
  const router = useRouter();
  const [shootTypes, setShootTypes] = useState(initialShootTypes);
  const [customFields, setCustomFields] = useState(initialCustomFields);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function updateShootType(key: string, patch: Partial<ShootTypeSetting>) {
    setShootTypes((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }

  function updateCustomField(slot: number, patch: Partial<CustomFieldSetting>) {
    setCustomFields((prev) => prev.map((f) => (f.slot === slot ? { ...f, ...patch } : f)));
  }

  async function handleSave() {
    setMessage(null);
    const blankEnabled = customFields.some((f) => f.enabled && !f.label.trim());
    if (blankEnabled) {
      setMessage("사용함으로 켜진 텍스트 항목에는 이름을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/form-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shootTypes, customFields }),
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
      <div className="adm-card space-y-3 rounded-lg p-4">
        <h2 className="font-medium">촬영형태</h2>
        <p className="text-xs text-adm-text-faint">사용할 촬영형태만 켜고, 이름은 원하시는 대로 바꿀 수 있습니다.</p>
        <div className="space-y-2">
          {shootTypes.map((s) => (
            <div key={s.key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={s.enabled}
                onChange={(e) => updateShootType(s.key, { enabled: e.target.checked })}
                className="h-4 w-4 flex-shrink-0"
              />
              <input
                type="text"
                value={s.label}
                onChange={(e) => updateShootType(s.key, { label: e.target.value })}
                disabled={!s.enabled}
                className="adm-input w-full disabled:opacity-40"
              />
              <label className="flex flex-shrink-0 items-center gap-1 text-xs text-adm-text-muted">
                <input
                  type="checkbox"
                  checked={s.requiresGuardianName}
                  onChange={(e) => updateShootType(s.key, { requiresGuardianName: e.target.checked })}
                  disabled={!s.enabled}
                  className="h-4 w-4"
                />
                보호자 이름 필요
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="adm-card space-y-3 rounded-lg p-4">
        <h2 className="font-medium">텍스트 항목 (최대 {customFields.length}개)</h2>
        <p className="text-xs text-adm-text-faint">
          예: 형제여부, 예상참석인원, 남기실 말씀 등 자유롭게 이름을 정할 수 있습니다. 사용 안 하는 항목은 꺼주세요.
        </p>
        <div className="space-y-2">
          {customFields.map((f) => (
            <div key={f.slot} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={f.enabled}
                onChange={(e) => updateCustomField(f.slot, { enabled: e.target.checked })}
                className="h-4 w-4 flex-shrink-0"
              />
              <input
                type="text"
                value={f.label}
                onChange={(e) => updateCustomField(f.slot, { label: e.target.value })}
                placeholder={`항목 ${f.slot} 이름`}
                disabled={!f.enabled}
                className="adm-input w-full disabled:opacity-40"
              />
              <label className="flex flex-shrink-0 items-center gap-1 text-xs text-adm-text-muted">
                <input
                  type="checkbox"
                  checked={f.required}
                  onChange={(e) => updateCustomField(f.slot, { required: e.target.checked })}
                  disabled={!f.enabled}
                  className="h-4 w-4"
                />
                필수
              </label>
            </div>
          ))}
        </div>
      </div>

      {message && <p className="text-sm text-adm-text-muted">{message}</p>}

      <button type="button" onClick={handleSave} disabled={saving} className="adm-btn-primary rounded-md px-4 py-2 text-sm">
        {saving ? "저장 중..." : "저장"}
      </button>
    </div>
  );
}
