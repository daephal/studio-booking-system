// 예약 폼의 "촬영형태" 옵션과 "자유 텍스트 항목"을 작가가 직접 설정할 수 있게 해주는 순수 유틸리티.
// 클라이언트 컴포넌트에서도 그대로 import하므로, DB 접근 코드는 여기 두지 말고 lib/form-settings-server.ts에 작성하세요.

export interface ShootTypeSetting {
  key: string;
  label: string;
  enabled: boolean;
  requiresGuardianName: boolean;
}

export interface CustomFieldSetting {
  slot: number;
  label: string;
  enabled: boolean;
  required: boolean;
}

export const CUSTOM_FIELD_SLOT_COUNT = 6;

export const DEFAULT_SHOOT_TYPE_SETTINGS: ShootTypeSetting[] = [
  { key: "dol", label: "돌스냅", enabled: true, requiresGuardianName: true },
  { key: "outdoor", label: "야외스냅", enabled: true, requiresGuardianName: true },
  { key: "wedding", label: "웨딩", enabled: true, requiresGuardianName: false },
  { key: "home", label: "홈스냅", enabled: true, requiresGuardianName: true },
  { key: "etc", label: "기타", enabled: true, requiresGuardianName: true },
];

export const DEFAULT_CUSTOM_FIELD_SETTINGS: CustomFieldSetting[] = [
  { slot: 1, label: "형제여부", enabled: true, required: false },
  { slot: 2, label: "예상참석인원", enabled: true, required: false },
  { slot: 3, label: "남기실 말씀", enabled: true, required: false },
  { slot: 4, label: "", enabled: false, required: false },
  { slot: 5, label: "", enabled: false, required: false },
  { slot: 6, label: "", enabled: false, required: false },
];

export interface FormSettings {
  shootTypes: ShootTypeSetting[];
  customFields: CustomFieldSetting[];
}

export const DEFAULT_FORM_SETTINGS: FormSettings = {
  shootTypes: DEFAULT_SHOOT_TYPE_SETTINGS,
  customFields: DEFAULT_CUSTOM_FIELD_SETTINGS,
};

export function shootTypeLabel(settings: FormSettings, key: string): string {
  return settings.shootTypes.find((s) => s.key === key)?.label ?? key;
}

export function requiresGuardianName(settings: FormSettings, key: string): boolean {
  return settings.shootTypes.find((s) => s.key === key)?.requiresGuardianName ?? true;
}

export function enabledShootTypes(settings: FormSettings): ShootTypeSetting[] {
  return settings.shootTypes.filter((s) => s.enabled);
}

export function enabledCustomFields(settings: FormSettings): CustomFieldSetting[] {
  return settings.customFields.filter((f) => f.enabled && f.label.trim());
}

export function customFieldColumn(slot: number): `custom_field_${1 | 2 | 3 | 4 | 5 | 6}` {
  return `custom_field_${slot as 1 | 2 | 3 | 4 | 5 | 6}`;
}
