import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { DEFAULT_STUDIO_PROFILE, type StudioProfile } from "@/lib/studio-profile";

const COLUMNS =
  "studio_name, studio_tagline, notify_email, kakao_channel_url, instagram_url, instagram_handle, bank_name, bank_account_number, bank_account_holder, business_owner_name, business_registration_number, mail_order_registration_number, business_address, selection_limit_color, selection_limit_retouch, max_retouch_rounds, gallery_expiry_days, selection_period_days, booking_conflict_window_hours, originals_sent_message_template, edits_sent_message_template";

export async function getStudioProfile(): Promise<StudioProfile> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return DEFAULT_STUDIO_PROFILE;
  const { data } = await supabase.from("app_config").select(COLUMNS).eq("id", 1).maybeSingle();
  if (!data) return DEFAULT_STUDIO_PROFILE;
  return {
    studioName: data.studio_name ?? DEFAULT_STUDIO_PROFILE.studioName,
    studioTagline: data.studio_tagline ?? DEFAULT_STUDIO_PROFILE.studioTagline,
    notifyEmail: data.notify_email ?? DEFAULT_STUDIO_PROFILE.notifyEmail,
    kakaoChannelUrl: data.kakao_channel_url ?? DEFAULT_STUDIO_PROFILE.kakaoChannelUrl,
    instagramUrl: data.instagram_url ?? DEFAULT_STUDIO_PROFILE.instagramUrl,
    instagramHandle: data.instagram_handle ?? DEFAULT_STUDIO_PROFILE.instagramHandle,
    bankName: data.bank_name ?? DEFAULT_STUDIO_PROFILE.bankName,
    bankAccountNumber: data.bank_account_number ?? DEFAULT_STUDIO_PROFILE.bankAccountNumber,
    bankAccountHolder: data.bank_account_holder ?? DEFAULT_STUDIO_PROFILE.bankAccountHolder,
    businessOwnerName: data.business_owner_name ?? DEFAULT_STUDIO_PROFILE.businessOwnerName,
    businessRegistrationNumber: data.business_registration_number ?? DEFAULT_STUDIO_PROFILE.businessRegistrationNumber,
    mailOrderRegistrationNumber:
      data.mail_order_registration_number ?? DEFAULT_STUDIO_PROFILE.mailOrderRegistrationNumber,
    businessAddress: data.business_address ?? DEFAULT_STUDIO_PROFILE.businessAddress,
    selectionLimitColor: data.selection_limit_color ?? DEFAULT_STUDIO_PROFILE.selectionLimitColor,
    selectionLimitRetouch: data.selection_limit_retouch ?? DEFAULT_STUDIO_PROFILE.selectionLimitRetouch,
    maxRetouchRounds: data.max_retouch_rounds ?? DEFAULT_STUDIO_PROFILE.maxRetouchRounds,
    galleryExpiryDays: data.gallery_expiry_days ?? DEFAULT_STUDIO_PROFILE.galleryExpiryDays,
    selectionPeriodDays: data.selection_period_days ?? DEFAULT_STUDIO_PROFILE.selectionPeriodDays,
    bookingConflictWindowHours: data.booking_conflict_window_hours ?? DEFAULT_STUDIO_PROFILE.bookingConflictWindowHours,
    originalsSentMessageTemplate: data.originals_sent_message_template ?? DEFAULT_STUDIO_PROFILE.originalsSentMessageTemplate,
    editsSentMessageTemplate: data.edits_sent_message_template ?? DEFAULT_STUDIO_PROFILE.editsSentMessageTemplate,
  };
}

export async function saveStudioProfile(profile: StudioProfile): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase가 설정되지 않았습니다");
  const { error } = await supabase
    .from("app_config")
    .update({
      studio_name: profile.studioName,
      studio_tagline: profile.studioTagline,
      notify_email: profile.notifyEmail,
      kakao_channel_url: profile.kakaoChannelUrl,
      instagram_url: profile.instagramUrl,
      instagram_handle: profile.instagramHandle,
      bank_name: profile.bankName,
      bank_account_number: profile.bankAccountNumber,
      bank_account_holder: profile.bankAccountHolder,
      business_owner_name: profile.businessOwnerName,
      business_registration_number: profile.businessRegistrationNumber,
      mail_order_registration_number: profile.mailOrderRegistrationNumber,
      business_address: profile.businessAddress,
      selection_limit_color: profile.selectionLimitColor,
      selection_limit_retouch: profile.selectionLimitRetouch,
      max_retouch_rounds: profile.maxRetouchRounds,
      gallery_expiry_days: profile.galleryExpiryDays,
      selection_period_days: profile.selectionPeriodDays,
      booking_conflict_window_hours: profile.bookingConflictWindowHours,
      originals_sent_message_template: profile.originalsSentMessageTemplate,
      edits_sent_message_template: profile.editsSentMessageTemplate,
    })
    .eq("id", 1);
  if (error) throw error;
}
