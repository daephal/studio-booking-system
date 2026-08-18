import { env } from "@/lib/env";

/** Vercel Cron 요청 검증. CRON_SECRET이 설정된 경우에만 강제. */
export function isAuthorizedCronRequest(request: Request): boolean {
  if (!env.cronSecret) return true;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${env.cronSecret}`;
}
