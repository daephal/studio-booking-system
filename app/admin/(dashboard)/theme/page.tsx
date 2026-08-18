import { getThemeSettings } from "@/lib/theme-server";
import { ThemeSettingsForm } from "./ThemeSettingsForm";

export const dynamic = "force-dynamic";

export default async function ThemeSettingsPage() {
  const theme = await getThemeSettings();

  return (
    <div className="max-w-lg space-y-4 text-adm-text">
      <h1 className="adm-h1">테마 설정</h1>
      <p className="text-sm text-adm-text-muted">
        홈페이지·예약·갤러리·관리자 화면 전체에 적용되는 배경과 메인 컬러를 설정합니다.
      </p>
      <ThemeSettingsForm initialMode={theme.mode} initialAccent={theme.accent} />
    </div>
  );
}
