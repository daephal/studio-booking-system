import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getDownloadUrl } from "@/lib/r2";
import { SetupNotice } from "@/components/SetupNotice";
import { GalleryManager } from "./GalleryManager";
import type { Gallery, Photo, Reservation } from "@/lib/types";

export default async function AdminGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return (
      <SetupNotice
        items={["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "R2_*"]}
      />
    );
  }

  const { data: gallery } = await supabase.from("galleries").select("*").eq("id", id).maybeSingle();
  if (!gallery) notFound();

  const { data: reservation } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", gallery.reservation_id)
    .maybeSingle();

  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("gallery_id", id)
    .order("filename", { ascending: true });

  const photosWithThumb = await Promise.all(
    ((photos as Photo[]) ?? []).map(async (p) => {
      let thumbUrl: string | null = null;
      try {
        thumbUrl = await getDownloadUrl(p.thumb_key, 3600);
      } catch {
        thumbUrl = null;
      }
      return { ...p, thumbUrl };
    })
  );

  return (
    <GalleryManager
      gallery={gallery as Gallery}
      reservation={reservation as Reservation}
      initialPhotos={photosWithThumb}
    />
  );
}
