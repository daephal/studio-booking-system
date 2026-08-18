"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reservationFormSchema } from "@/lib/validation";
import type { ShootTypeSetting, CustomFieldSetting } from "@/lib/form-settings";

type FormState = {
  shoot_type: string;
  event_date: string;
  event_start_time: string;
  location: string;
  subject_name: string;
  guardian_name: string;
  phone_primary: string;
  phone_secondary: string;
  email: string;
  depositor_name: string;
  balance_due: string;
  custom_field_1: string;
  custom_field_2: string;
  custom_field_3: string;
  custom_field_4: string;
  custom_field_5: string;
  custom_field_6: string;
};

function initialStateFor(shootTypes: ShootTypeSetting[]): FormState {
  return {
    shoot_type: shootTypes[0]?.key ?? "dol",
    event_date: "",
    event_start_time: "",
    location: "",
    subject_name: "",
    guardian_name: "",
    phone_primary: "",
    phone_secondary: "",
    email: "",
    depositor_name: "",
    balance_due: "",
    custom_field_1: "",
    custom_field_2: "",
    custom_field_3: "",
    custom_field_4: "",
    custom_field_5: "",
    custom_field_6: "",
  };
}

const inputClass = "adm-input w-full";

export function AdminReservationForm({
  shootTypes,
  customFields,
}: {
  shootTypes: ShootTypeSetting[];
  customFields: CustomFieldSetting[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => initialStateFor(shootTypes));
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(force: boolean) {
    setError(null);
    const parsed = reservationFormSchema.safeParse({ ...form, terms_agreed: true });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "입력값을 확인해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, force }),
      });
      const body = await res.json();
      if (!res.ok) {
        if (body?.conflict) {
          setWarning(body.error);
          return;
        }
        setError(body?.error || "등록 중 오류가 발생했습니다.");
        return;
      }
      router.push(`/admin/reservations/${body.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  const needsGuardianName = shootTypes.find((t) => t.key === form.shoot_type)?.requiresGuardianName ?? true;

  return (
    <div className="max-w-lg space-y-4 text-adm-text">
      <h1 className="adm-h1">신규 예약 수동 등록</h1>

      <label className="block text-sm text-adm-text-muted">
        촬영형태
        <select
          className={inputClass}
          value={form.shoot_type}
          onChange={(e) => update("shoot_type", e.target.value)}
        >
          {shootTypes.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-sm text-adm-text-muted">
          촬영 날짜
          <input type="date" className={inputClass} value={form.event_date} onChange={(e) => update("event_date", e.target.value)} />
        </label>
        <label className="block text-sm text-adm-text-muted">
          행사시작시간
          <input type="time" step={1800} className={inputClass} value={form.event_start_time} onChange={(e) => update("event_start_time", e.target.value)} />
        </label>
      </div>

      <label className="block text-sm text-adm-text-muted">
        촬영장소
        <input className={inputClass} value={form.location} onChange={(e) => update("location", e.target.value)} />
      </label>

      <label className="block text-sm text-adm-text-muted">
        촬영자 이름
        <input className={inputClass} value={form.subject_name} onChange={(e) => update("subject_name", e.target.value)} />
      </label>

      {needsGuardianName && (
        <label className="block text-sm text-adm-text-muted">
          보호자 이름
          <input className={inputClass} value={form.guardian_name} onChange={(e) => update("guardian_name", e.target.value)} />
        </label>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-sm text-adm-text-muted">
          연락처(여)
          <input className={inputClass} value={form.phone_primary} onChange={(e) => update("phone_primary", e.target.value)} />
        </label>
        <label className="block text-sm text-adm-text-muted">
          연락처(남)
          <input className={inputClass} value={form.phone_secondary} onChange={(e) => update("phone_secondary", e.target.value)} />
        </label>
      </div>

      <label className="block text-sm text-adm-text-muted">
        이메일
        <input className={inputClass} value={form.email} onChange={(e) => update("email", e.target.value)} />
      </label>

      {customFields.map((f) => {
        const key = `custom_field_${f.slot}` as keyof FormState;
        return (
          <label key={f.slot} className="block text-sm text-adm-text-muted">
            {f.label}
            {f.required && <span className="text-adm-accent-soft"> *</span>}
            <textarea className={inputClass} rows={2} value={form[key]} onChange={(e) => update(key, e.target.value)} />
          </label>
        );
      })}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-sm text-adm-text-muted">
          입금자성명
          <input className={inputClass} value={form.depositor_name} onChange={(e) => update("depositor_name", e.target.value)} />
        </label>
        <label className="block text-sm text-adm-text-muted">
          잔금(만원)
          <input type="number" className={inputClass} value={form.balance_due} onChange={(e) => update("balance_due", e.target.value)} />
        </label>
      </div>

      {warning && (
        <div style={{ background: "rgba(217,158,66,0.1)", color: "#e8c891" }} className="rounded-md p-3 text-sm">
          <p>{warning}</p>
          <button type="button" onClick={() => submit(true)} className="mt-2 rounded-md bg-[#c98a3a] px-3 py-1.5 text-xs text-white">
            그래도 등록하기
          </button>
        </div>
      )}
      {error && <p className="text-sm text-[#e08a8a]">{error}</p>}

      <button type="button" disabled={submitting} onClick={() => submit(false)} className="adm-btn-primary w-full rounded-xl py-2.5 text-sm font-semibold">
        {submitting ? "등록 중..." : "등록하기"}
      </button>
    </div>
  );
}
