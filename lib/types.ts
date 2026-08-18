export type ShootType = "dol" | "outdoor" | "wedding" | "home" | "etc";

export type ReservationStatus =
  | "received"
  | "confirmed"
  | "shot_done"
  | "originals_sent"
  | "selection_done"
  | "edits_sent"
  | "closed"
  | "cancelled";

export interface Reservation {
  id: string;
  shoot_type: ShootType;
  event_date: string;
  event_start_time: string;
  location: string;
  subject_name: string;
  guardian_name: string | null;
  phone_primary: string;
  phone_secondary: string | null;
  email: string;
  depositor_name: string;
  balance_due: number;
  custom_field_1: string | null;
  custom_field_2: string | null;
  custom_field_3: string | null;
  custom_field_4: string | null;
  custom_field_5: string | null;
  custom_field_6: string | null;
  terms_agreed_at: string;
  status: ReservationStatus;
  gcal_event_id: string | null;
  admin_memo: string | null;
  created_at: string;
}

export type GalleryStatus = "active" | "expired" | "deleted";

export interface Gallery {
  id: string;
  reservation_id: string;
  slug: string;
  password: string;
  expires_at: string;
  selection_deadline: string;
  reminder_7d_sent: boolean;
  reminder_3d_sent: boolean;
  status: GalleryStatus;
  failed_attempts: number;
  locked_until: string | null;
  created_at: string;
  zip_r2_key: string | null;
  zip_size: number | null;
  zip_built_at: string | null;
}

export type PhotoKind = "original" | "edited" | "sample";

export interface Photo {
  id: string;
  gallery_id: string;
  kind: PhotoKind;
  revision_round: number;
  r2_key: string;
  thumb_key: string;
  filename: string;
  file_size: number | null;
  width: number | null;
  height: number | null;
  sort_order: number | null;
  sns_public: boolean;
  created_at: string;
}

export interface SelectionRound {
  id: string;
  gallery_id: string;
  round: number;
  overall_memo: string | null;
  submitted_at: string | null;
}

export interface SelectionItem {
  id: string;
  round_id: string;
  photo_id: string;
  retouch: boolean;
  memo: string | null;
}

export interface AppConfig {
  id: number;
  gcal_refresh_token: string | null;
  notify_email: string | null;
}

export type SitePhotoKind = "hero" | "feed";

export interface SitePhoto {
  id: string;
  kind: SitePhotoKind;
  r2_key: string;
  thumb_key: string;
  filename: string;
  sort_order: number;
  created_at: string;
}
