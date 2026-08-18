-- 스냅사진 스튜디오 예약/갤러리 시스템 — 데이터베이스 스키마
-- Vercel 배포 시 Supabase 마켓플레이스 연동을 사용하면 이 마이그레이션이 새 프로젝트에 자동 실행됩니다.
-- 수동으로 적용하려면 이 파일 전체 내용을 Supabase SQL Editor에 붙여넣고 실행하세요.
-- 모든 테이블은 RLS를 켜고 정책을 두지 않습니다(= deny-all).
-- 애플리케이션은 서버(API route)에서 service_role 키로만 접근합니다.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- reservations — 예약
-- ---------------------------------------------------------------------------
create table if not exists reservations (
  id                uuid primary key default gen_random_uuid(),
  shoot_type        text not null check (shoot_type in ('dol', 'outdoor', 'wedding', 'home', 'etc')),
  event_date        date not null,
  event_start_time  time not null,
  location          text not null,
  subject_name      text not null,
  guardian_name     text,
  phone_primary     text not null,
  phone_secondary   text,
  email             text not null,
  depositor_name    text not null,
  balance_due       int not null,
  -- 자유 텍스트 항목(형제여부/예상참석인원/남기실 말씀 등) — 이름/개수는 app_config.custom_field_settings에서 설정
  custom_field_1    text,
  custom_field_2    text,
  custom_field_3    text,
  custom_field_4    text,
  custom_field_5    text,
  custom_field_6    text,
  terms_agreed_at   timestamptz not null,
  status            text not null default 'received' check (
                      status in (
                        'received', 'confirmed', 'shot_done', 'originals_sent',
                        'selection_done', 'edits_sent', 'closed', 'cancelled'
                      )
                    ),
  gcal_event_id     text,
  admin_memo        text,
  created_at        timestamptz not null default now()
);

create index if not exists idx_reservations_event_date on reservations (event_date);
create index if not exists idx_reservations_status on reservations (status);

alter table reservations enable row level security;

-- ---------------------------------------------------------------------------
-- galleries — 고객 갤러리
-- ---------------------------------------------------------------------------
create table if not exists galleries (
  id                  uuid primary key default gen_random_uuid(),
  reservation_id      uuid not null references reservations (id) on delete cascade,
  slug                text not null unique,
  password            text not null,
  expires_at          timestamptz not null,
  selection_deadline  date not null,
  reminder_7d_sent    boolean not null default false,
  reminder_3d_sent    boolean not null default false,
  status              text not null default 'active' check (status in ('active', 'expired', 'deleted')),
  failed_attempts     int not null default 0,
  locked_until        timestamptz,
  created_at          timestamptz not null default now(),
  unique (reservation_id)
);

create index if not exists idx_galleries_slug on galleries (slug);
create index if not exists idx_galleries_status on galleries (status);

alter table galleries enable row level security;

-- ---------------------------------------------------------------------------
-- photos — 사진
-- ---------------------------------------------------------------------------
create table if not exists photos (
  id             uuid primary key default gen_random_uuid(),
  gallery_id     uuid not null references galleries (id) on delete cascade,
  kind           text not null check (kind in ('original', 'edited')),
  revision_round int not null default 0,
  r2_key         text not null,
  thumb_key      text not null,
  filename       text not null,
  file_size      bigint,
  width          int,
  height         int,
  sort_order     int,
  sns_public     boolean not null default true,
  created_at     timestamptz not null default now()
);

create index if not exists idx_photos_gallery on photos (gallery_id, kind, revision_round);

alter table photos enable row level security;

-- ---------------------------------------------------------------------------
-- selection_rounds — 셀렉 라운드
-- ---------------------------------------------------------------------------
create table if not exists selection_rounds (
  id            uuid primary key default gen_random_uuid(),
  gallery_id    uuid not null references galleries (id) on delete cascade,
  round         int not null,
  overall_memo  text,
  submitted_at  timestamptz,
  unique (gallery_id, round)
);

alter table selection_rounds enable row level security;

-- ---------------------------------------------------------------------------
-- selection_items — 선택된 사진
-- ---------------------------------------------------------------------------
create table if not exists selection_items (
  id           uuid primary key default gen_random_uuid(),
  round_id     uuid not null references selection_rounds (id) on delete cascade,
  photo_id     uuid not null references photos (id) on delete cascade,
  retouch      boolean not null default false,
  memo         text,
  unique (round_id, photo_id)
);

alter table selection_items enable row level security;

-- ---------------------------------------------------------------------------
-- app_config — 설정 (1행)
-- ---------------------------------------------------------------------------
create table if not exists app_config (
  id                  int primary key default 1 check (id = 1),
  gcal_refresh_token  text,
  gcal_calendar_id    text,  -- 예약 이벤트를 등록할 구글 캘린더 ID (미설정 시 'primary' 사용)
  notify_email        text,
  theme_mode          text not null default 'dark' check (theme_mode in ('light', 'dark')),
  theme_accent        text not null default '#7E76A0',  -- 메인 컬러 (hex), 작가가 관리자 화면에서 직접 선택
  -- 촬영형태 옵션 이름/사용여부/보호자이름 필요여부 (작가마다 촬영 종류가 달라서 직접 바꿀 수 있게 함)
  shoot_type_settings jsonb not null default '[
    {"key":"dol","label":"돌스냅","enabled":true,"requiresGuardianName":true},
    {"key":"outdoor","label":"야외스냅","enabled":true,"requiresGuardianName":true},
    {"key":"wedding","label":"웨딩","enabled":true,"requiresGuardianName":false},
    {"key":"home","label":"홈스냅","enabled":true,"requiresGuardianName":true},
    {"key":"etc","label":"기타","enabled":true,"requiresGuardianName":true}
  ]'::jsonb,
  -- 자유 텍스트 항목 이름/사용여부/필수여부 (최대 6개, custom_field_1~6과 순서대로 매칭)
  custom_field_settings jsonb not null default '[
    {"slot":1,"label":"형제여부","enabled":true,"required":false},
    {"slot":2,"label":"예상참석인원","enabled":true,"required":false},
    {"slot":3,"label":"남기실 말씀","enabled":true,"required":false},
    {"slot":4,"label":"","enabled":false,"required":false},
    {"slot":5,"label":"","enabled":false,"required":false},
    {"slot":6,"label":"","enabled":false,"required":false}
  ]'::jsonb,
  -- 작가(스튜디오)마다 달라지는 브랜드/연락처 값 — 비어있으면 lib/studio-profile.ts의 기본값으로 표시됨
  -- (재판매 시 코드 수정 없이 관리자 화면(/admin/studio-profile)에서 설정)
  studio_name                     text,
  studio_tagline                  text,
  kakao_channel_url               text,
  instagram_url                   text,
  instagram_handle                text,
  bank_name                       text,
  bank_account_number             text,
  bank_account_holder             text,
  -- 통신판매업 법적 고지 (값이 있는 항목만 홈페이지 하단에 표시)
  business_owner_name             text,
  business_registration_number    text,
  mail_order_registration_number  text,
  business_address                text,
  -- 운영 규칙 (기본값은 기존 JAYPAPA 운영 기준)
  selection_limit_color           int not null default 50,
  selection_limit_retouch         int not null default 15,
  max_retouch_rounds              int not null default 2,
  gallery_expiry_days             int not null default 30,
  booking_conflict_window_hours   int not null default 3,
  -- 촬영 약관 (비어있으면 lib/terms.ts의 기본 문구로 표시)
  terms_title                     text,
  terms_sections                  jsonb
);

insert into app_config (id)
values (1)
on conflict (id) do nothing;

alter table app_config enable row level security;

-- ---------------------------------------------------------------------------
-- site_photos — 홈페이지 히어로/피드용 사진 (관리자가 직접 업로드)
-- ---------------------------------------------------------------------------
create table if not exists site_photos (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('hero', 'feed')),
  r2_key      text not null,
  thumb_key   text not null,
  filename    text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_site_photos_kind on site_photos (kind, sort_order);

alter table site_photos enable row level security;
