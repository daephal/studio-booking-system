import { getSupabaseServerClient } from "@/lib/supabase/server";

/** API route에서 관리자 로그인 여부 확인. 로그인 안 되어 있으면 null. */
export async function requireAdminUser() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
