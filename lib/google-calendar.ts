import { google } from "googleapis";
import { env, isGoogleConfigured } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getFormSettings } from "@/lib/form-settings-server";
import { shootTypeLabel } from "@/lib/form-settings";
import { getStudioProfile } from "@/lib/studio-profile-server";

export const googleConfigured = isGoogleConfigured;

function getOAuthClient() {
  if (!isGoogleConfigured) return null;
  return new google.auth.OAuth2(env.googleClientId, env.googleClientSecret, env.googleRedirectUri);
}

/** 관리자가 최초 1회 클릭할 구글 인증 URL. /admin/setup/google 에서 사용. */
export function getGoogleAuthUrl(): string | null {
  const client = getOAuthClient();
  if (!client) return null;
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar"],
  });
}

/** OAuth 콜백에서 code를 refresh_token으로 교환해 app_config에 저장 */
export async function saveRefreshTokenFromCode(code: string): Promise<string> {
  const client = getOAuthClient();
  if (!client) throw new Error("Google OAuth가 설정되지 않았습니다");
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    const { studioName } = await getStudioProfile();
    throw new Error(
      `Google이 refresh_token을 반환하지 않았습니다. Google 계정의 '내 앱 연결'에서 ${studioName} 접근권한을 제거한 뒤 다시 시도해주세요.`
    );
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase가 설정되지 않았습니다");
  const { error } = await supabase
    .from("app_config")
    .upsert({ id: 1, gcal_refresh_token: tokens.refresh_token });
  if (error) throw error;
  return tokens.refresh_token;
}

export async function isGoogleCalendarLinked(): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;
  const { data } = await supabase
    .from("app_config")
    .select("gcal_refresh_token")
    .eq("id", 1)
    .maybeSingle();
  return Boolean(data?.gcal_refresh_token);
}

export async function getSelectedCalendarId(): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data } = await supabase.from("app_config").select("gcal_calendar_id").eq("id", 1).maybeSingle();
  return data?.gcal_calendar_id ?? null;
}

export async function saveSelectedCalendarId(calendarId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase가 설정되지 않았습니다");
  const { error } = await supabase.from("app_config").update({ gcal_calendar_id: calendarId }).eq("id", 1);
  if (error) throw error;
}

async function getAuthorizedClient() {
  const client = getOAuthClient();
  if (!client) return null;
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data } = await supabase
    .from("app_config")
    .select("gcal_refresh_token")
    .eq("id", 1)
    .maybeSingle();
  if (!data?.gcal_refresh_token) return null;
  client.setCredentials({ refresh_token: data.gcal_refresh_token });
  return client;
}

export interface CalendarOption {
  id: string;
  summary: string;
  primary: boolean;
}

/** 인증된 구글 계정에 연결된 캘린더 목록 (관리자가 어느 캘린더에 동기화할지 고를 때 사용) */
export async function listCalendars(): Promise<CalendarOption[]> {
  const client = await getAuthorizedClient();
  if (!client) return [];
  const calendar = google.calendar({ version: "v3", auth: client });
  const res = await calendar.calendarList.list({ maxResults: 250 });
  return (res.data.items ?? [])
    .filter((c) => c.id)
    .map((c) => ({ id: c.id!, summary: c.summary ?? c.id!, primary: Boolean(c.primary) }));
}

async function resolveCalendarId(): Promise<string> {
  const configured = await getSelectedCalendarId();
  return configured || "primary";
}

export interface ReservationForCalendar {
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
  custom_field_1?: string | null;
  custom_field_2?: string | null;
  custom_field_3?: string | null;
  custom_field_4?: string | null;
  custom_field_5?: string | null;
  custom_field_6?: string | null;
}

async function buildEventBody(r: ReservationForCalendar) {
  const formSettings = await getFormSettings();
  // 서버(Vercel)는 UTC로 동작하므로, 시간대 표기 없이 Date를 만들면 "12:00"이 UTC 12:00으로
  // 해석되어 실제 한국 시간(KST, UTC+9)보다 9시간 늦게 표시되는 버그가 있었다.
  // 명시적으로 +09:00 오프셋을 붙여 절대 시각을 정확히 계산한다.
  // event_start_time은 DB(Postgres time 타입)에서 "HH:MM" 또는 "HH:MM:SS" 형태로 올 수 있어
  // 초를 임의로 덧붙이지 않고 시간대 오프셋만 그대로 이어 붙인다.
  const start = new Date(`${r.event_date}T${r.event_start_time}+09:00`);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const customFieldLines = formSettings.customFields
    .filter((f) => f.enabled && f.label.trim())
    .map((f) => {
      const value = (r as unknown as Record<string, unknown>)[`custom_field_${f.slot}`] as string | null | undefined;
      return value ? `${f.label}: ${value}` : null;
    });
  const description = [
    `촬영형태: ${shootTypeLabel(formSettings, r.shoot_type)}`,
    `예약일: ${r.event_date} ${r.event_start_time}`,
    `촬영장소: ${r.location}`,
    `촬영자 이름: ${r.subject_name}`,
    r.guardian_name ? `보호자 이름: ${r.guardian_name}` : null,
    `연락처(여): ${r.phone_primary}`,
    r.phone_secondary ? `연락처(남): ${r.phone_secondary}` : null,
    `이메일: ${r.email}`,
    ...customFieldLines,
    `입금자성명: ${r.depositor_name}`,
    `잔금: ${r.balance_due}만원`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    summary: r.subject_name,
    location: r.location,
    description,
    start: { dateTime: start.toISOString(), timeZone: "Asia/Seoul" },
    end: { dateTime: end.toISOString(), timeZone: "Asia/Seoul" },
  };
}

/** 실패해도 예외를 던지지 않고 null을 반환 — 호출부에서 예약 저장은 계속 성공 처리 */
export async function createCalendarEvent(r: ReservationForCalendar): Promise<string | null> {
  try {
    const client = await getAuthorizedClient();
    if (!client) return null;
    const calendar = google.calendar({ version: "v3", auth: client });
    const calendarId = await resolveCalendarId();
    const res = await calendar.events.insert({ calendarId, requestBody: await buildEventBody(r) });
    return res.data.id ?? null;
  } catch (err) {
    console.error("[google-calendar] createCalendarEvent 실패:", err);
    return null;
  }
}

export async function updateCalendarEvent(eventId: string, r: ReservationForCalendar): Promise<boolean> {
  try {
    const client = await getAuthorizedClient();
    if (!client) return false;
    const calendar = google.calendar({ version: "v3", auth: client });
    const calendarId = await resolveCalendarId();
    await calendar.events.update({ calendarId, eventId, requestBody: await buildEventBody(r) });
    return true;
  } catch (err) {
    console.error("[google-calendar] updateCalendarEvent 실패:", err);
    return false;
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  try {
    const client = await getAuthorizedClient();
    if (!client) return false;
    const calendar = google.calendar({ version: "v3", auth: client });
    const calendarId = await resolveCalendarId();
    await calendar.events.delete({ calendarId, eventId });
    return true;
  } catch (err) {
    console.error("[google-calendar] deleteCalendarEvent 실패:", err);
    return false;
  }
}
