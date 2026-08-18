import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "@/lib/env";

let cached: SupabaseClient | null = null;

/** service_role 클라이언트. RLS를 우회하므로 서버 코드에서만 사용합니다. */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!cached) {
    cached = createClient(env.supabaseUrl!, env.supabaseServiceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return cached;
}
