import { bankAccountText, type StudioProfile } from "@/lib/studio-profile";

function wrap(studioName: string, title: string, bodyHtml: string) {
  return `
  <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 560px; margin: 0 auto; color: #222;">
    <h2 style="color:#111;">${title}</h2>
    ${bodyHtml}
    <p style="margin-top:32px; font-size:12px; color:#888;">${studioName}</p>
  </div>`;
}

function row(label: string, value?: string | number | null) {
  if (value === undefined || value === null || value === "") return "";
  return `<tr><td style="padding:4px 12px 4px 0; color:#666; white-space:nowrap;">${label}</td><td style="padding:4px 0;">${value}</td></tr>`;
}

export interface ReservationEmailData {
  shoot_type: string;
  event_date: string;
  event_start_time: string;
  location: string;
  subject_name: string;
  guardian_name?: string | null;
  phone_primary: string;
  phone_secondary?: string | null;
  email: string;
  depositor_name: string;
  balance_due: number;
}

export interface ReservationEmailExtra {
  shootTypeLabel: string;
  customFieldRows: { label: string; value: string | null }[];
}

function reservationSummaryTable(r: ReservationEmailData, extra: ReservationEmailExtra) {
  return `<table style="border-collapse:collapse; font-size:14px;">
    ${row("촬영형태", extra.shootTypeLabel)}
    ${row("촬영 날짜", r.event_date)}
    ${row("행사시작시간", r.event_start_time)}
    ${row("촬영장소", r.location)}
    ${row("촬영자 이름", r.subject_name)}
    ${row("보호자 이름", r.guardian_name)}
    ${row("연락처(여)", r.phone_primary)}
    ${row("연락처(남)", r.phone_secondary)}
    ${row("이메일", r.email)}
    ${extra.customFieldRows.map((f) => row(f.label, f.value)).join("")}
    ${row("입금자성명", r.depositor_name)}
    ${row("잔금", `${r.balance_due}만원`)}
  </table>`;
}

export function reservationConfirmedCustomerEmail(
  r: ReservationEmailData,
  extra: ReservationEmailExtra,
  studioProfile: StudioProfile
) {
  return {
    subject: `[${studioProfile.studioName}] 예약이 접수되었습니다`,
    html: wrap(
      studioProfile.studioName,
      "예약이 접수되었습니다",
      `<p>안녕하세요, ${studioProfile.studioName}입니다.<br/>예약해주셔서 감사합니다. 촬영 있는 주중에 사전 연락드리겠습니다.</p>
       ${reservationSummaryTable(r, extra)}
       <p style="margin-top:20px;">입금 계좌: <strong>${bankAccountText(studioProfile)}</strong></p>`
    ),
  };
}

export function reservationNotifyAdminEmail(
  r: ReservationEmailData,
  extra: ReservationEmailExtra,
  studioProfile: StudioProfile
) {
  return {
    subject: `[${studioProfile.studioName}] 신규 예약 접수 — ${r.subject_name}`,
    html: wrap(studioProfile.studioName, "신규 예약 알림", reservationSummaryTable(r, extra)),
  };
}

export function originalsSentCustomerEmail(params: {
  subjectName: string;
  link: string;
  deadline: string;
  studioProfile: StudioProfile;
}) {
  return {
    subject: `[${params.studioProfile.studioName}] 촬영 원본사진이 준비되었습니다`,
    html: wrap(
      params.studioProfile.studioName,
      "원본사진이 준비되었습니다",
      `<p>안녕하세요, ${params.subjectName}님 촬영 원본사진이 준비되었습니다.</p>
       <p><a href="${params.link}" style="color:#2563eb;">${params.link}</a></p>
       <p>비밀번호: 연락처(여) 뒤 4자리</p>
       <p>셀렉 마감일: ${params.deadline} (이 날짜까지 셀렉해주세요)<br/>
       원본 다운로드는 전송일로부터 ${params.studioProfile.galleryExpiryDays}일 후 만료되어 더 이상 받으실 수 없습니다.</p>`
    ),
  };
}

export function selectionSubmittedAdminEmail(params: {
  subjectName: string;
  colorCount: number;
  retouchCount: number;
  studioProfile: StudioProfile;
}) {
  return {
    subject: `[${params.studioProfile.studioName}] 셀렉 완료 — ${params.subjectName}`,
    html: wrap(
      params.studioProfile.studioName,
      "셀렉 완료 알림",
      `<p>${params.subjectName}님의 셀렉이 제출되었습니다.</p>
       <p>색상보정 ${params.colorCount}장 · 리터칭 ${params.retouchCount}장</p>`
    ),
  };
}

export function reeditRequestedAdminEmail(params: { subjectName: string; round: number; studioProfile: StudioProfile }) {
  return {
    subject: `[${params.studioProfile.studioName}] 재수정 요청 (${params.round}차) — ${params.subjectName}`,
    html: wrap(
      params.studioProfile.studioName,
      "재수정 요청 알림",
      `<p>${params.subjectName}님이 ${params.round}차 재수정을 요청했습니다.</p>`
    ),
  };
}

export function editsSentCustomerEmail(params: {
  subjectName: string;
  link: string;
  remainingRounds: number;
  studioProfile: StudioProfile;
}) {
  return {
    subject: `[${params.studioProfile.studioName}] 보정본을 확인해주세요`,
    html: wrap(
      params.studioProfile.studioName,
      "보정본이 준비되었습니다",
      `<p>${params.subjectName}님, 보정본 확인 부탁드립니다.</p>
       <p><a href="${params.link}" style="color:#2563eb;">${params.link}</a></p>
       <p>남은 재수정 요청: ${params.remainingRounds}회</p>`
    ),
  };
}

export function selectionReminderCustomerEmail(params: {
  subjectName: string;
  link: string;
  deadline: string;
  daysLeft: number;
  studioProfile: StudioProfile;
}) {
  return {
    subject: `[${params.studioProfile.studioName}] 셀렉 마감 D-${params.daysLeft} 안내`,
    html: wrap(
      params.studioProfile.studioName,
      `셀렉 마감이 ${params.daysLeft}일 남았습니다`,
      `<p>${params.subjectName}님, 셀렉 마감일(${params.deadline})이 얼마 남지 않았습니다.</p>
       <p><a href="${params.link}" style="color:#2563eb;">${params.link}</a></p>`
    ),
  };
}
