"use client";

import { useState } from "react";
import { TermsModal } from "@/components/TermsModal";
import { reservationFormSchema } from "@/lib/validation";
import { bankAccountText, hasBankAccount, type StudioProfile } from "@/lib/studio-profile";
import type { Terms } from "@/lib/terms-server";
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
  terms_agreed: boolean;
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
    terms_agreed: false,
  };
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-[18px] block">
      <span className="mb-2 block text-[13px] font-semibold" style={{ color: "var(--text-muted)" }}>
        {label}
        {required && <span style={{ color: "var(--accent-soft)" }}> *</span>}
      </span>
      {children}
      {hint && (
        <p className="mt-2 text-xs" style={{ color: "var(--text-faint)" }}>
          {hint}
        </p>
      )}
      {error && (
        <p className="mt-2 text-xs" style={{ color: "#e08a8a" }}>
          {error}
        </p>
      )}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl px-3.5 py-3.5 text-[15px] outline-none transition-colors focus:border-[var(--accent-soft)]";
const inputStyle = { background: "var(--surface-2)", border: "1px solid var(--border-strong)", color: "var(--text)", colorScheme: "dark" as const };

export function BookingForm({
  shootTypes,
  customFields,
  studioProfile,
  terms,
}: {
  shootTypes: ShootTypeSetting[];
  customFields: CustomFieldSetting[];
  studioProfile: StudioProfile;
  terms: Terms;
}) {
  const [form, setForm] = useState<FormState>(() => initialStateFor(shootTypes));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTerms, setShowTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const isWedding = form.shoot_type === "wedding";
  const needsGuardianName = shootTypes.find((t) => t.key === form.shoot_type)?.requiresGuardianName ?? true;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const parsed = reservationFormSchema.safeParse({
      ...form,
      balance_due: form.balance_due,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    const dynamicErrors: Record<string, string> = {};
    if (needsGuardianName && !form.guardian_name.trim()) {
      dynamicErrors.guardian_name = "보호자 이름을 입력해주세요";
    }
    for (const f of customFields) {
      const key = `custom_field_${f.slot}` as keyof FormState;
      if (f.required && !String(form[key]).trim()) {
        dynamicErrors[key] = `${f.label}을(를) 입력해주세요`;
      }
    }
    if (Object.keys(dynamicErrors).length > 0) {
      setErrors(dynamicErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setSubmitError("해당 시간대는 예약이 어렵습니다. 다른 시간을 선택하시거나 스튜디오로 문의해 주세요.");
        } else {
          setSubmitError(body?.error || "예약 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        }
        return;
      }

      setDone(true);
    } catch {
      setSubmitError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <section className="min-h-[70vh] px-0 py-[120px]">
        <div className="mx-auto max-w-[560px] px-5 text-center animate-[jpUp_400ms_cubic-bezier(0.32,0.72,0,1)]">
          <div
            style={{ background: "rgba(126,118,160,0.18)" }}
            className="mx-auto mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-full"
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--accent-soft)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1 className="mb-3.5 text-[clamp(24px,4vw,32px)] font-bold leading-tight tracking-tight" style={{ color: "var(--text)" }}>
            예약해주셔서 감사합니다.
          </h1>
          <p className="mb-8 text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
            촬영 있는 주중에 사전 연락드리겠습니다.
            <br />
            입금 계좌: <strong style={{ color: "var(--text)" }}>{bankAccountText(studioProfile)}</strong>
          </p>
          <a
            href="/"
            style={{ background: "var(--accent)" }}
            className="inline-block rounded-full px-[30px] py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            홈으로
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="px-0 pb-[72px] pt-24">
      <form onSubmit={handleSubmit} className="mx-auto max-w-[600px] px-5">
        <div className="mb-3.5 text-[11px] font-bold uppercase tracking-[.18em]" style={{ color: "var(--text-faint)" }}>
          BOOKING
        </div>
        <h1 className="mb-5 text-[clamp(30px,5vw,44px)] font-bold leading-[1.1] tracking-tight" style={{ color: "var(--text)" }}>
          예약하기
        </h1>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="mb-7 rounded-2xl px-5 py-[18px]">
          <p className="mb-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            📸 안내사항을 꼭 확인하신 후 &apos;동의합니다&apos;에 체크해 주세요. 예약이 완료되기 위해 필요한 단계입니다.
          </p>
          <button
            type="button"
            onClick={() => setShowTerms(true)}
            style={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)", color: "var(--text)" }}
            className="inline-flex items-center gap-1.5 rounded-[10px] px-4 py-2.5 text-sm font-semibold transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-soft)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
            촬영 약관 보기
          </button>
        </div>

        {hasBankAccount(studioProfile) && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="mb-7 rounded-2xl px-5 py-[18px]">
            <p className="mb-1.5 text-sm font-semibold" style={{ color: "var(--text)" }}>
              입금 계좌: {bankAccountText(studioProfile)}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              예약금 입금 후 입금자 성명이 확인되어야 예약이 확정됩니다.
            </p>
          </div>
        )}

        <Field label="촬영형태" required error={errors.shoot_type}>
          <select className={inputClass} style={inputStyle} value={form.shoot_type} onChange={(e) => update("shoot_type", e.target.value)}>
            {shootTypes.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="촬영 날짜" required error={errors.event_date}>
          <input type="date" className={inputClass} style={inputStyle} value={form.event_date} onChange={(e) => update("event_date", e.target.value)} />
        </Field>

        <Field label="행사시작시간" required error={errors.event_start_time} hint="촬영 시작시간이 아닌 행사 시작시간으로 적어주세요">
          <input type="time" step={1800} className={inputClass} style={inputStyle} value={form.event_start_time} onChange={(e) => update("event_start_time", e.target.value)} />
        </Field>

        <Field label="촬영장소" required error={errors.location}>
          <input
            type="text"
            placeholder="예: OO컨벤션 3층 그랜드홀"
            className={inputClass}
            style={inputStyle}
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
          />
        </Field>

        <Field label={isWedding ? "촬영자 이름 (신랑&신부)" : "촬영자 이름 (아기이름)"} required error={errors.subject_name}>
          <input type="text" className={inputClass} style={inputStyle} value={form.subject_name} onChange={(e) => update("subject_name", e.target.value)} />
        </Field>

        {needsGuardianName && (
          <Field label="보호자 이름" required error={errors.guardian_name}>
            <input type="text" className={inputClass} style={inputStyle} value={form.guardian_name} onChange={(e) => update("guardian_name", e.target.value)} />
          </Field>
        )}

        <Field label="연락처 (여)" required error={errors.phone_primary}>
          <input
            type="tel"
            placeholder="010-0000-0000"
            className={inputClass}
            style={inputStyle}
            value={form.phone_primary}
            onChange={(e) => update("phone_primary", e.target.value)}
          />
        </Field>

        <Field label="연락처 (남)" error={errors.phone_secondary}>
          <input
            type="tel"
            placeholder="선택"
            className={inputClass}
            style={inputStyle}
            value={form.phone_secondary}
            onChange={(e) => update("phone_secondary", e.target.value)}
          />
        </Field>

        <Field label="E-Mail" required error={errors.email}>
          <input
            type="email"
            placeholder="you@example.com"
            className={inputClass}
            style={inputStyle}
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </Field>

        {customFields.map((f) => {
          const key = `custom_field_${f.slot}` as keyof FormState;
          return (
            <Field key={f.slot} label={f.label} required={f.required} error={errors[key]}>
              <textarea
                rows={2}
                placeholder={f.required ? undefined : "선택 사항입니다."}
                className={inputClass + " resize-y leading-relaxed"}
                style={inputStyle}
                value={form[key] as string}
                onChange={(e) => update(key, e.target.value)}
              />
            </Field>
          );
        })}

        <Field label="입금자성명" required error={errors.depositor_name}>
          <input type="text" className={inputClass} style={inputStyle} value={form.depositor_name} onChange={(e) => update("depositor_name", e.target.value)} />
        </Field>

        <Field label="잔금 (만원)" required error={errors.balance_due}>
          <input
            type="number"
            placeholder="예: 20"
            className={inputClass}
            style={inputStyle}
            value={form.balance_due}
            onChange={(e) => update("balance_due", e.target.value)}
          />
        </Field>

        <label
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          className="mb-6 flex cursor-pointer items-start gap-3 rounded-2xl px-[18px] py-4"
        >
          <input
            type="checkbox"
            checked={form.terms_agreed}
            onChange={(e) => update("terms_agreed", e.target.checked)}
            style={{ accentColor: "var(--accent)" }}
            className="mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer"
          />
          <span className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            위{" "}
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              style={{ color: "var(--accent-soft)" }}
              className="border-none bg-transparent p-0 text-sm font-semibold"
            >
              촬영 약관
            </button>
            을 모두 읽고 <b style={{ color: "var(--text)" }}>동의합니다.</b>
          </span>
        </label>
        {errors.terms_agreed && (
          <p className="-mt-4 mb-6 text-xs" style={{ color: "#e08a8a" }}>
            {errors.terms_agreed}
          </p>
        )}

        {submitError && (
          <p style={{ background: "rgba(224,138,138,0.1)", color: "#e08a8a" }} className="mb-5 rounded-md p-3 text-sm">
            {submitError}
          </p>
        )}

        {form.terms_agreed ? (
          <button
            type="submit"
            disabled={submitting}
            style={{ background: "var(--accent)" }}
            className="w-full rounded-2xl py-4 text-base font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {submitting ? "제출 중..." : "예약 신청"}
          </button>
        ) : (
          <div>
            <div style={{ background: "var(--surface-2)", color: "var(--placeholder)" }} className="w-full cursor-not-allowed rounded-2xl py-4 text-center text-base font-semibold">
              예약 신청
            </div>
            <p className="mt-2.5 text-center text-[13px]" style={{ color: "var(--text-faint)" }}>
              약관에 동의하시면 신청할 수 있어요.
            </p>
          </div>
        )}
      </form>

      {showTerms && <TermsModal title={terms.title} sections={terms.sections} onClose={() => setShowTerms(false)} />}
    </section>
  );
}
