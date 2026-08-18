import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  DEFAULT_FORM_SETTINGS,
  type FormSettings,
  type ShootTypeSetting,
  type CustomFieldSetting,
} from "@/lib/form-settings";

export async function getFormSettings(): Promise<FormSettings> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return DEFAULT_FORM_SETTINGS;
  const { data } = await supabase
    .from("app_config")
    .select("shoot_type_settings, custom_field_settings")
    .eq("id", 1)
    .maybeSingle();
  if (!data) return DEFAULT_FORM_SETTINGS;
  return {
    shootTypes: (data.shoot_type_settings as ShootTypeSetting[] | null) ?? DEFAULT_FORM_SETTINGS.shootTypes,
    customFields: (data.custom_field_settings as CustomFieldSetting[] | null) ?? DEFAULT_FORM_SETTINGS.customFields,
  };
}

export async function saveFormSettings(settings: FormSettings): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase가 설정되지 않았습니다");
  const { error } = await supabase
    .from("app_config")
    .update({ shoot_type_settings: settings.shootTypes, custom_field_settings: settings.customFields })
    .eq("id", 1);
  if (error) throw error;
}
