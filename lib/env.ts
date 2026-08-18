export const env = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",

  // Vercel×Supabase 마켓플레이스 연동은 신규 키 체계(publishable/secret key)로 환경변수를 주입합니다.
  // 기존 방식(anon/service_role key)으로 직접 설정한 배포(예: JAYPAPA 실사이트)와 모두 호환되도록 둘 다 지원합니다.
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,

  r2AccountId: process.env.R2_ACCOUNT_ID,
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  r2Bucket: process.env.R2_BUCKET,

  gmailUser: process.env.GMAIL_USER,
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD,

  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM,

  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,

  gallerySessionSecret: process.env.GALLERY_SESSION_SECRET,
  cronSecret: process.env.CRON_SECRET,
};

export const isSupabaseConfigured = Boolean(
  env.supabaseUrl && env.supabaseAnonKey && env.supabaseServiceRoleKey
);

export const isR2Configured = Boolean(
  env.r2AccountId && env.r2AccessKeyId && env.r2SecretAccessKey && env.r2Bucket
);

export const isResendConfigured = Boolean(env.resendApiKey && env.emailFrom);
export const isGmailConfigured = Boolean(env.gmailUser && env.gmailAppPassword);
export const isEmailConfigured = isResendConfigured || isGmailConfigured;

export const isGoogleConfigured = Boolean(
  env.googleClientId && env.googleClientSecret && env.googleRedirectUri
);
