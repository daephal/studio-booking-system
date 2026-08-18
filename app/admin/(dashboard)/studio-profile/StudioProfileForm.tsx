"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StudioProfile } from "@/lib/studio-profile";

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="adm-card space-y-3 rounded-lg p-4">
      <h2 className="font-medium">{title}</h2>
      {hint && <p className="text-xs text-adm-text-faint">{hint}</p>}
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm text-adm-text-muted">
      {label}
      <input
        type="text"
        className="adm-input w-full"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <label className="block text-sm text-adm-text-muted">
      {label}
      <textarea className="adm-input w-full" rows={4} value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <p className="mt-1 text-xs text-adm-text-faint">{hint}</p>}
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <label className="block text-sm text-adm-text-muted">
      {label}
      <input
        type="number"
        min={0}
        className="adm-input w-full"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
      {hint && <p className="mt-1 text-xs text-adm-text-faint">{hint}</p>}
    </label>
  );
}

export function StudioProfileForm({ initialProfile }: { initialProfile: StudioProfile }) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function update<K extends keyof StudioProfile>(key: K, value: StudioProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  async function handleSave() {
    setMessage(null);
    if (!profile.studioName.trim()) {
      setMessage("스튜디오명을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/studio-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
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
      <Section title="스튜디오 정보">
        <TextField label="스튜디오명" value={profile.studioName} onChange={(v) => update("studioName", v)} />
        <TextField
          label="한 줄 소개 (홈 하단에 표시)"
          value={profile.studioTagline}
          onChange={(v) => update("studioTagline", v)}
        />
        <TextField
          label="관리자 알림 이메일"
          value={profile.notifyEmail}
          onChange={(v) => update("notifyEmail", v)}
          placeholder="예: studio@example.com"
        />
      </Section>

      <Section title="연락 채널">
        <TextField
          label="카카오톡 채널 URL"
          value={profile.kakaoChannelUrl}
          onChange={(v) => update("kakaoChannelUrl", v)}
          placeholder="https://open.kakao.com/o/..."
        />
        <TextField
          label="인스타그램 URL"
          value={profile.instagramUrl}
          onChange={(v) => update("instagramUrl", v)}
          placeholder="https://instagram.com/..."
        />
        <TextField
          label="인스타그램 표시 이름"
          value={profile.instagramHandle}
          onChange={(v) => update("instagramHandle", v)}
          placeholder="@studio.name"
        />
      </Section>

      <Section title="계좌정보" hint="예약 폼과 예약 확정 이메일에 안내되는 입금 계좌입니다.">
        <TextField label="은행" value={profile.bankName} onChange={(v) => update("bankName", v)} />
        <TextField label="계좌번호" value={profile.bankAccountNumber} onChange={(v) => update("bankAccountNumber", v)} />
        <TextField label="예금주" value={profile.bankAccountHolder} onChange={(v) => update("bankAccountHolder", v)} />
      </Section>

      <Section
        title="통신판매업 법적 고지"
        hint="값을 입력한 항목만 홈페이지 하단에 표시됩니다. 비워두면 표시되지 않습니다."
      >
        <TextField label="대표자명" value={profile.businessOwnerName} onChange={(v) => update("businessOwnerName", v)} />
        <TextField
          label="사업자등록번호"
          value={profile.businessRegistrationNumber}
          onChange={(v) => update("businessRegistrationNumber", v)}
        />
        <TextField
          label="통신판매업신고번호"
          value={profile.mailOrderRegistrationNumber}
          onChange={(v) => update("mailOrderRegistrationNumber", v)}
        />
        <TextField label="주소" value={profile.businessAddress} onChange={(v) => update("businessAddress", v)} />
      </Section>

      <Section
        title="전송 메세지 문구"
        hint="갤러리 관리 화면에서 '원본전송'/'보정본전송' 버튼을 누르면 자동으로 만들어지는, 복사해서 손님께 보내는 안내 문자 내용입니다. {{중괄호}} 부분은 실제 값으로 자동 치환됩니다."
      >
        <TextAreaField
          label="원본 전달 메세지"
          value={profile.originalsSentMessageTemplate}
          onChange={(v) => update("originalsSentMessageTemplate", v)}
          hint="사용 가능: {{studioName}} {{subjectName}} {{link}} {{deadline}} {{expiryDays}}"
        />
        <TextAreaField
          label="보정본 전달 메세지"
          value={profile.editsSentMessageTemplate}
          onChange={(v) => update("editsSentMessageTemplate", v)}
          hint="사용 가능: {{studioName}} {{subjectName}} {{link}} {{remainingRounds}}"
        />
      </Section>

      <Section title="운영 규칙">
        <NumberField
          label="색상보정 선택 가능 매수"
          value={profile.selectionLimitColor}
          onChange={(v) => update("selectionLimitColor", v)}
        />
        <NumberField
          label="리터칭 선택 가능 매수"
          value={profile.selectionLimitRetouch}
          onChange={(v) => update("selectionLimitRetouch", v)}
        />
        <NumberField
          label="재수정 최대 횟수"
          value={profile.maxRetouchRounds}
          onChange={(v) => update("maxRetouchRounds", v)}
        />
        <NumberField
          label="원본 삭제 기간 (일)"
          value={profile.galleryExpiryDays}
          onChange={(v) => update("galleryExpiryDays", v)}
          hint="원본 전송일로부터 이 기간이 지나면 사진이 서버에서 영구 삭제됩니다."
        />
        <NumberField
          label="셀렉 가능 기간 (일)"
          value={profile.selectionPeriodDays}
          onChange={(v) => update("selectionPeriodDays", v)}
          hint="원본 전송일로부터 이 기간 내에 셀렉을 완료해야 합니다. 원본 삭제 기간보다 길게 설정하면 마감일 전에 사진이 먼저 삭제될 수 있으니 주의하세요."
        />
        <NumberField
          label="예약 중복방지 시간 (시간)"
          value={profile.bookingConflictWindowHours}
          onChange={(v) => update("bookingConflictWindowHours", v)}
        />
      </Section>

      {message && <p className="text-sm text-adm-text-muted">{message}</p>}

      <button type="button" onClick={handleSave} disabled={saving} className="adm-btn-primary rounded-md px-4 py-2 text-sm">
        {saving ? "저장 중..." : "저장"}
      </button>
    </div>
  );
}
