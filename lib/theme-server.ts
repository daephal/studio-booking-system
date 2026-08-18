import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { DEFAULT_THEME, isValidHexColor, type ThemeSettings } from "@/lib/theme";

export async function getThemeSettings(): Promise<ThemeSettings> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return DEFAULT_THEME;
  const { data } = await supabase.from("app_config").select("theme_mode, theme_accent").eq("id", 1).maybeSingle();
  if (!data) return DEFAULT_THEME;
  return {
    mode: data.theme_mode === "light" ? "light" : "dark",
    accent: isValidHexColor(data.theme_accent) ? data.theme_accent : DEFAULT_THEME.accent,
  };
}

export async function saveThemeSettings(settings: ThemeSettings): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase가 설정되지 않았습니다");
  const { error } = await supabase
    .from("app_config")
    .update({ theme_mode: settings.mode, theme_accent: settings.accent })
    .eq("id", 1);
  if (error) throw error;
}
