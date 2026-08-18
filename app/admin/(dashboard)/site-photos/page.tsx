import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getDownloadUrl } from "@/lib/r2";
import { SetupNotice } from "@/components/SetupNotice";
import { SitePhotosManager } from "./SitePhotosManager";
import type { SitePhoto } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SitePhotosPage() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return (
      <SetupNotice
        items={["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "R2_*"]}
      />
    );
  }

  const { data: photos } = await supabase
    .from("site_photos")
    .select("*")
    .order("kind", { ascending: true })
    .order("sort_order", { ascending: true });

  const photosWithThumb = await Promise.all(
    ((photos as SitePhoto[]) ?? []).map(async (p) => {
      let thumbUrl: string | null = null;
      try {
        thumbUrl = await getDownloadUrl(p.thumb_key, 3600);
      } catch {
        thumbUrl = null;
      }
      return { ...p, thumbUrl };
    })
  );

  return <SitePhotosManager initialPhotos={photosWithThumb} />;
}
