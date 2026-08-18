// 작가(스튜디오)마다 달라지는 브랜드/연락처/운영 규칙 값들의 순수 유틸리티.
// 클라이언트 컴포넌트에서도 그대로 import하므로, DB 접근 코드는 여기 두지 말고 lib/studio-profile-server.ts에 작성하세요.

export interface StudioProfile {
  studioName: string;
  studioTagline: string;
  notifyEmail: string;
  kakaoChannelUrl: string;
  instagramUrl: string;
  instagramHandle: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  businessOwnerName: string;
  businessRegistrationNumber: string;
  mailOrderRegistrationNumber: string;
  businessAddress: string;
  selectionLimitColor: number;
  selectionLimitRetouch: number;
  maxRetouchRounds: number;
  galleryExpiryDays: number;
  selectionPeriodDays: number;
  bookingConflictWindowHours: number;
  originalsSentMessageTemplate: string;
  editsSentMessageTemplate: string;
}

// 새로 배포하는 작가가 /admin/studio-profile에서 값을 입력하기 전까지 보이는 기본값.
// 특정 스튜디오의 실제 정보(계좌/카카오/인스타그램 등)를 담지 않는 범용 플레이스홀더로 유지하세요.
export const DEFAULT_STUDIO_PROFILE: StudioProfile = {
  studioName: "내 스튜디오",
  studioTagline: "",
  notifyEmail: "",
  kakaoChannelUrl: "",
  instagramUrl: "",
  instagramHandle: "",
  bankName: "",
  bankAccountNumber: "",
  bankAccountHolder: "",
  businessOwnerName: "",
  businessRegistrationNumber: "",
  mailOrderRegistrationNumber: "",
  businessAddress: "",
  selectionLimitColor: 50,
  selectionLimitRetouch: 15,
  maxRetouchRounds: 2,
  galleryExpiryDays: 30,
  selectionPeriodDays: 30,
  bookingConflictWindowHours: 3,
  originalsSentMessageTemplate:
    "[{{studioName}}] 안녕하세요, {{subjectName}}님 촬영 원본사진이 준비되었습니다.\n아래 링크에서 확인해 주세요. (비밀번호: 연락처 뒤 4자리)\n{{link}}\n셀렉 마감일: {{deadline}} (이 날짜까지 셀렉해주세요)\n원본 다운로드는 전송일로부터 {{expiryDays}}일 후 만료되어 더 이상 받으실 수 없습니다.",
  editsSentMessageTemplate: "[{{studioName}}] {{subjectName}}님, 보정본이 준비되었습니다.\n{{link}}\n남은 재수정 요청: {{remainingRounds}}회",
};

export function bankAccountText(profile: StudioProfile): string {
  return `${profile.bankName} ${profile.bankAccountNumber} (예금주: ${profile.bankAccountHolder})`;
}

export function hasBankAccount(profile: StudioProfile): boolean {
  return Boolean(profile.bankName && profile.bankAccountNumber);
}

/** "{{key}}" 형태의 자리표시자를 vars 값으로 치환 — 전송 메세지 문구를 작가가 자유 편집해도 실제 값은 항상 정확히 채워지도록 함 */
export function renderMessageTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => vars[key] ?? match);
}

export function hasLegalNotice(profile: StudioProfile): boolean {
  return Boolean(
    profile.businessOwnerName ||
      profile.businessRegistrationNumber ||
      profile.mailOrderRegistrationNumber ||
      profile.businessAddress
  );
}
