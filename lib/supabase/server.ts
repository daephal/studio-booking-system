import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env, isSupabaseConfigured } from "@/lib/env";

/** 관리자 로그인 세션 확인용 (Supabase Auth, anon key + 쿠키). 서버 컴포넌트/라우트에서 사용. */
export async function getSupabaseServerClient() {
  if (!isSupabaseConfigured) return null;
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // 서버 컴포넌트에서 호출된 경우 — 세션 갱신은 middleware가 담당
        }
      },
    },
  });
}
