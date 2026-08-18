"use client";

import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LogoutButton() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  async function handleLogout() {
    await supabase?.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={handleLogout} className="adm-btn-secondary rounded-full px-3 py-1.5 text-sm">
      로그아웃
    </button>
  );
}
