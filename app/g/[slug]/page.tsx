import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyGallerySessionToken, GALLERY_COOKIE_NAME } from "@/lib/session";
import { SetupNotice } from "@/components/SetupNotice";
import { getStudioProfile } from "@/lib/studio-profile-server";
import { PasswordGate } from "./PasswordGate";
import { GalleryView } from "./GalleryView";

export default async function GalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();
  const { studioName } = await getStudioProfile();

  if (!supabase) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <SetupNotice
          items={["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]}
        />
      </div>
    );
  }

  const { data: gallery } = await supabase
    .from("galleries")
    .select("id, status, expires_at")
    .eq("slug", slug)
    .maybeSingle();

  if (!gallery) {
    return (
      <div className="mx-auto max-w-lg bg-bg px-4 py-24 text-center text-sm text-text-muted">갤러리를 찾을 수 없습니다.</div>
    );
  }

  const isExpired = gallery.status === "expired" || new Date(gallery.expires_at) < new Date();
  if (isExpired) {
    return (
      <div className="mx-auto max-w-lg bg-bg px-4 py-24 text-center text-sm text-text-muted">갤러리가 만료되었습니다</div>
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(GALLERY_COOKIE_NAME)?.value;
  const session = verifyGallerySessionToken(token);

  if (!session || session.galleryId !== gallery.id) {
    return <PasswordGate slug={slug} studioName={studioName} />;
  }

  return <GalleryView slug={slug} studioName={studioName} />;
}
