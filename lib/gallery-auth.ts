import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyGallerySessionToken, GALLERY_COOKIE_NAME } from "@/lib/session";
import type { Gallery } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type GalleryAuthResult =
  | { error: string; status: 503 | 404 | 401 }
  | { supabase: SupabaseClient; gallery: Gallery };

export async function requireGallerySession(slug: string): Promise<GalleryAuthResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: "서버 설정이 완료되지 않았습니다.", status: 503 };

  const { data: gallery } = await supabase
    .from("galleries")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!gallery) return { error: "갤러리를 찾을 수 없습니다.", status: 404 };

  const cookieStore = await cookies();
  const token = cookieStore.get(GALLERY_COOKIE_NAME)?.value;
  const session = verifyGallerySessionToken(token);

  if (!session || session.galleryId !== gallery.id) {
    return { error: "인증이 필요합니다.", status: 401 };
  }

  return { supabase, gallery: gallery as Gallery };
}
