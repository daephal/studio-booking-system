import {
  getGoogleAuthUrl,
  isGoogleCalendarLinked,
  googleConfigured,
  listCalendars,
  getSelectedCalendarId,
} from "@/lib/google-calendar";
import { SetupNotice } from "@/components/SetupNotice";
import { CalendarPicker } from "./CalendarPicker";

export const dynamic = "force-dynamic";

export default async function GoogleSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { success, error } = await searchParams;

  if (!googleConfigured) {
    return (
      <div className="max-w-lg space-y-4 text-adm-text">
        <h1 className="adm-h1">구글 캘린더 연동</h1>
        <SetupNotice items={["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI"]} />
      </div>
    );
  }

  const linked = await isGoogleCalendarLinked();
  const authUrl = getGoogleAuthUrl();
  const calendars = linked ? await listCalendars().catch(() => []) : [];
  const selectedId = (linked ? await getSelectedCalendarId() : null) || "primary";

  return (
    <div className="max-w-lg space-y-4 text-adm-text">
      <h1 className="adm-h1">구글 캘린더 연동</h1>
      <p className="text-sm text-adm-text-muted">상태: {linked ? "연동됨 ✅" : "연동되지 않음"}</p>
      {success && <p className="text-sm text-[#8fd19e]">연동이 완료되었습니다.</p>}
      {error && <p className="text-sm text-[#e08a8a]">오류: {error}</p>}
      {authUrl && (
        <a href={authUrl} className="adm-btn-primary inline-block rounded-md px-4 py-2 text-sm">
          {linked ? "다시 연동하기" : "구글 계정으로 연동하기"}
        </a>
      )}

      {linked && calendars.length > 0 && <CalendarPicker calendars={calendars} selectedId={selectedId} />}
      {linked && calendars.length === 0 && (
        <p className="text-sm text-[#e08a8a]">
          캘린더 목록을 불러오지 못했습니다. Google Calendar API가 활성화되어 있는지 확인해주세요.
        </p>
      )}
    </div>
  );
}
