"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Reservation, Gallery, ReservationStatus } from "@/lib/types";
import { shootTypeLabel, type FormSettings } from "@/lib/form-settings";
import { StatusStepper } from "./StatusStepper";

const inputClass = "adm-input w-full";

function formStateFrom(reservation: Reservation) {
  return {
    shoot_type: reservation.shoot_type,
    event_date: reservation.event_date,
    event_start_time: reservation.event_start_time,
    location: reservation.location,
    subject_name: reservation.subject_name,
    guardian_name: reservation.guardian_name ?? "",
    phone_primary: reservation.phone_primary,
    phone_secondary: reservation.phone_secondary ?? "",
    email: reservation.email,
    depositor_name: reservation.depositor_name,
    balance_due: String(reservation.balance_due),
    custom_field_1: reservation.custom_field_1 ?? "",
    custom_field_2: reservation.custom_field_2 ?? "",
    custom_field_3: reservation.custom_field_3 ?? "",
    custom_field_4: reservation.custom_field_4 ?? "",
    custom_field_5: reservation.custom_field_5 ?? "",
    custom_field_6: reservation.custom_field_6 ?? "",
  };
}

type FormValues = ReturnType<typeof formStateFrom>;

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <p className="text-sm leading-loose">
      <span className="text-adm-text-muted">{label}</span> : {value}
    </p>
  );
}

export function ReservationDetail({
  reservation,
  gallery,
  formSettings,
}: {
  reservation: Reservation;
  gallery: Gallery | null;
  formSettings: FormSettings;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormValues>(formStateFrom(reservation));
  const [status, setStatus] = useState<ReservationStatus>(reservation.status);
  const [memo, setMemo] = useState(reservation.admin_memo ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [creatingGallery, setCreatingGallery] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const enabledCustomFields = formSettings.customFields.filter((f) => f.enabled && f.label.trim());

  async function patch(payload: Record<string, unknown>) {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/reservations/${reservation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) {
        setMessage(body?.error || "저장 실패");
        return false;
      }
      setMessage("저장되었습니다.");
      router.refresh();
      return true;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdit() {
    const needsGuardianName = formSettings.shootTypes.find((s) => s.key === form.shoot_type)?.requiresGuardianName ?? true;
    const ok = await patch({
      ...form,
      guardian_name: needsGuardianName ? form.guardian_name : null,
      balance_due: Number(form.balance_due) || 0,
    });
    if (ok) setEditing(false);
  }

  function handleCancelEdit() {
    setForm(formStateFrom(reservation));
    setEditing(false);
    setMessage(null);
  }

  async function handleCreateGallery() {
    setCreatingGallery(true);
    try {
      const res = await fetch("/api/admin/galleries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: reservation.id }),
      });
      const body = await res.json();
      if (!res.ok) {
        setMessage(body?.error || "갤러리 생성 실패");
        return;
      }
      router.push(`/admin/galleries/${body.gallery.id}`);
    } finally {
      setCreatingGallery(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`"${reservation.subject_name}" 예약을 삭제하시겠습니까?\n갤러리/사진 정보도 함께 삭제되며 되돌릴 수 없습니다.`)) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/reservations/${reservation.id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) {
        setMessage(body?.error || "삭제 실패");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  async function handleRetryCalendar() {
    setRetrying(true);
    try {
      const res = await fetch(`/api/admin/reservations/${reservation.id}/retry-calendar`, { method: "POST" });
      const body = await res.json();
      setMessage(res.ok ? "캘린더 동기화 성공" : body?.error || "캘린더 동기화 실패");
      router.refresh();
    } finally {
      setRetrying(false);
    }
  }

  const needsGuardianName = formSettings.shootTypes.find((s) => s.key === form.shoot_type)?.requiresGuardianName ?? true;
  const calendarSyncFailed = reservation.status !== "cancelled" && !reservation.gcal_event_id;
  const canResyncCalendar = reservation.status !== "cancelled" && Boolean(reservation.gcal_event_id);

  return (
    <div className="max-w-2xl space-y-6 text-adm-text">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-adm-text-muted hover:text-adm-text">
        ← 목록으로
      </Link>

      <h1 className="adm-h1">{reservation.subject_name}</h1>

      <StatusStepper
        status={status}
        onChange={(next) => {
          setStatus(next);
          patch({ status: next });
        }}
      />

      {calendarSyncFailed && (
        <div style={{ background: "rgba(217,158,66,0.1)", color: "#e8c891" }} className="rounded-md p-3 text-sm">
          캘린더 동기화 실패
          <button
            type="button"
            onClick={handleRetryCalendar}
            disabled={retrying}
            className="ml-3 rounded-md bg-[#c98a3a] px-2 py-1 text-xs text-white disabled:opacity-50"
          >
            재시도
          </button>
        </div>
      )}

      {canResyncCalendar && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-adm-surface-2 p-3 text-sm text-adm-text-muted">
          <span>캘린더에 일정이 안 보이나요?</span>
          <button
            type="button"
            onClick={handleRetryCalendar}
            disabled={retrying}
            className="adm-btn-secondary rounded-md px-2 py-1 text-xs disabled:opacity-50"
          >
            {retrying ? "만드는 중..." : "다시 만들기"}
          </button>
        </div>
      )}

      {message && <p className="text-sm text-adm-text-muted">{message}</p>}

      <div className="adm-card rounded-lg p-4">
        {gallery ? (
          <div className="flex items-center justify-between text-sm">
            <span>갤러리: /g/{gallery.slug}</span>
            <a href={`/admin/galleries/${gallery.id}`} className="adm-btn-primary rounded-md px-3 py-1.5">
              갤러리 관리
            </a>
          </div>
        ) : (
          <button type="button" onClick={handleCreateGallery} disabled={creatingGallery} className="adm-btn-primary rounded-md px-3 py-1.5 text-sm">
            {creatingGallery ? "생성 중..." : "갤러리 생성"}
          </button>
        )}
      </div>

      <div className="adm-card rounded-lg p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-medium">예약 정보</h2>
          {!editing && (
            <button type="button" onClick={() => setEditing(true)} className="adm-btn-secondary rounded-md px-3 py-1.5 text-xs">
              수정
            </button>
          )}
        </div>

        {!editing ? (
          <div>
            <InfoRow label="📸 촬영형태" value={shootTypeLabel(formSettings, reservation.shoot_type)} />
            <InfoRow label="📅 촬영 날짜" value={reservation.event_date} />
            <InfoRow label="🕐 행사시작시간" value={reservation.event_start_time} />
            <InfoRow label="📍 촬영장소" value={reservation.location} />
            <InfoRow label="🧑 촬영자 이름" value={reservation.subject_name} />
            <InfoRow label="👪 보호자 이름" value={reservation.guardian_name} />
            <InfoRow label="📞 연락처(여)" value={reservation.phone_primary} />
            <InfoRow label="📞 연락처(남)" value={reservation.phone_secondary} />
            <InfoRow label="✉️ 이메일" value={reservation.email} />
            {enabledCustomFields.map((f) => (
              <InfoRow
                key={f.slot}
                label={`📝 ${f.label}`}
                value={reservation[`custom_field_${f.slot}` as keyof Reservation] as string | null}
              />
            ))}
            <InfoRow label="🏦 입금자성명" value={reservation.depositor_name} />
            <InfoRow label="💰 잔금" value={`${reservation.balance_due}만원`} />
            <InfoRow
              label="🗓️ 예약 신청일"
              value={new Date(reservation.created_at).toLocaleString("ko-KR")}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm text-adm-text-muted">
              촬영형태
              <select
                className={inputClass}
                value={form.shoot_type}
                onChange={(e) => setForm((f) => ({ ...f, shoot_type: e.target.value as Reservation["shoot_type"] }))}
              >
                {formSettings.shootTypes.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-sm text-adm-text-muted">
                촬영 날짜
                <input type="date" className={inputClass} value={form.event_date} onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))} />
              </label>
              <label className="block text-sm text-adm-text-muted">
                행사시작시간
                <input
                  type="time"
                  step={1800}
                  className={inputClass}
                  value={form.event_start_time}
                  onChange={(e) => setForm((f) => ({ ...f, event_start_time: e.target.value }))}
                />
              </label>
            </div>

            <label className="block text-sm text-adm-text-muted">
              촬영장소
              <input className={inputClass} value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            </label>

            <label className="block text-sm text-adm-text-muted">
              촬영자 이름
              <input className={inputClass} value={form.subject_name} onChange={(e) => setForm((f) => ({ ...f, subject_name: e.target.value }))} />
            </label>

            {needsGuardianName && (
              <label className="block text-sm text-adm-text-muted">
                보호자 이름
                <input className={inputClass} value={form.guardian_name} onChange={(e) => setForm((f) => ({ ...f, guardian_name: e.target.value }))} />
              </label>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-sm text-adm-text-muted">
                연락처(여)
                <input className={inputClass} value={form.phone_primary} onChange={(e) => setForm((f) => ({ ...f, phone_primary: e.target.value }))} />
              </label>
              <label className="block text-sm text-adm-text-muted">
                연락처(남)
                <input className={inputClass} value={form.phone_secondary} onChange={(e) => setForm((f) => ({ ...f, phone_secondary: e.target.value }))} />
              </label>
            </div>

            <label className="block text-sm text-adm-text-muted">
              이메일
              <input className={inputClass} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </label>

            {enabledCustomFields.map((f) => {
              const key = `custom_field_${f.slot}` as keyof FormValues;
              return (
                <label key={f.slot} className="block text-sm text-adm-text-muted">
                  {f.label}
                  <textarea
                    className={inputClass}
                    rows={2}
                    value={form[key]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                </label>
              );
            })}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-sm text-adm-text-muted">
                입금자성명
                <input className={inputClass} value={form.depositor_name} onChange={(e) => setForm((f) => ({ ...f, depositor_name: e.target.value }))} />
              </label>
              <label className="block text-sm text-adm-text-muted">
                잔금(만원)
                <input type="number" className={inputClass} value={form.balance_due} onChange={(e) => setForm((f) => ({ ...f, balance_due: e.target.value }))} />
              </label>
            </div>

            <div className="flex gap-2">
              <button type="button" disabled={saving} onClick={handleSaveEdit} className="adm-btn-primary rounded-md px-4 py-2 text-sm">
                {saving ? "저장 중..." : "저장"}
              </button>
              <button type="button" disabled={saving} onClick={handleCancelEdit} className="adm-btn-secondary rounded-md px-4 py-2 text-sm">
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2 adm-card rounded-lg p-4">
        <h2 className="font-medium">관리자 메모</h2>
        <textarea className={inputClass} rows={3} value={memo} onChange={(e) => setMemo(e.target.value)} />
        <button type="button" disabled={saving} onClick={() => patch({ admin_memo: memo })} className="adm-btn-secondary rounded-md px-4 py-2 text-sm">
          메모 저장
        </button>
      </div>

      <div className="space-y-2 rounded-lg border border-[#e0708a]/30 p-4">
        <h2 className="text-sm font-medium text-[#e0708a]">예약 삭제</h2>
        <p className="text-sm text-adm-text-muted">
          이 예약과 연결된 갤러리·사진·셀렉 정보가 모두 삭제되며, 되돌릴 수 없습니다.
        </p>
        <button
          type="button"
          disabled={deleting}
          onClick={handleDelete}
          className="rounded-md border border-[#e0708a] px-4 py-2 text-sm text-[#e0708a] transition-colors hover:bg-[#e0708a]/10 disabled:opacity-50"
        >
          {deleting ? "삭제 중..." : "예약 삭제"}
        </button>
      </div>
    </div>
  );
}
