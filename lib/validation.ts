import { z } from "zod";

export const SHOOT_TYPES = ["dol", "outdoor", "wedding", "home", "etc"] as const;
export type ShootType = (typeof SHOOT_TYPES)[number];

// guardian_name의 필수 여부는 촬영형태마다 다르며(app_config.shoot_type_settings의
// requiresGuardianName), 스키마는 여기서 정적으로 고정하지 않고 custom_field_1~6과 동일하게
// 항상 optional로 둔 뒤 클라이언트 쪽(BookingForm/AdminReservationForm)에서 formSettings를
// 참조해 필수 체크를 한다 — 폼 빌더 복잡도를 피하기 위해 이미 채택한 패턴과 일관성 유지.
export const reservationFormSchema = z.object({
  shoot_type: z.enum(SHOOT_TYPES),
  event_date: z.string().min(1, "촬영 날짜를 선택해주세요"),
  event_start_time: z.string().min(1, "행사시작시간을 입력해주세요"),
  location: z.string().min(1, "촬영장소를 입력해주세요"),
  subject_name: z.string().min(1, "촬영자 이름을 입력해주세요"),
  guardian_name: z.string().optional().or(z.literal("")),
  phone_primary: z.string().min(9, "연락처(여)를 정확히 입력해주세요"),
  phone_secondary: z.string().optional().or(z.literal("")),
  email: z.string().email("이메일 형식이 올바르지 않습니다"),
  depositor_name: z.string().min(1, "입금자성명을 입력해주세요"),
  balance_due: z.coerce.number().int().nonnegative("잔금을 입력해주세요"),
  custom_field_1: z.string().optional().or(z.literal("")),
  custom_field_2: z.string().optional().or(z.literal("")),
  custom_field_3: z.string().optional().or(z.literal("")),
  custom_field_4: z.string().optional().or(z.literal("")),
  custom_field_5: z.string().optional().or(z.literal("")),
  custom_field_6: z.string().optional().or(z.literal("")),
  terms_agreed: z
    .boolean()
    .refine((v) => v === true, { message: "약관에 동의해야 예약이 가능합니다" }),
});

export type ReservationFormValues = z.infer<typeof reservationFormSchema>;
