import { NextResponse } from "next/server";
import { requireGallerySession } from "@/lib/gallery-auth";
import { getDownloadUrl } from "@/lib/r2";
import { getStudioProfile } from "@/lib/studio-profile-server";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const auth = await requireGallerySession(slug);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, gallery } = auth;
  const studioProfile = await getStudioProfile();

  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("gallery_id", gallery.id)
    .order("sort_order", { ascending: true })
    .order("filename", { ascending: true });

  const { data: rounds } = await supabase
    .from("selection_rounds")
    .select("*")
    .eq("gallery_id", gallery.id);

  const roundIds = (rounds ?? []).map((r) => r.id);
  const { data: items } =
    roundIds.length > 0
      ? await supabase.from("selection_items").select("*").in("round_id", roundIds)
      : { data: [] as never[] };

  const photosWithThumb = await Promise.all(
    (photos ?? []).map(async (p) => {
      let thumbUrl: string | null = null;
      try {
        thumbUrl = await getDownloadUrl(p.thumb_key, 3600);
      } catch {
        thumbUrl = null;
      }
      return { ...p, thumbUrl };
    })
  );

  return NextResponse.json({
    gallery: {
      slug: gallery.slug,
      expiresAt: gallery.expires_at,
      selectionDeadline: gallery.selection_deadline,
      status: gallery.status,
      zipReady: gallery.zip_r2_key != null,
    },
    photos: photosWithThumb,
    rounds: rounds ?? [],
    items: items ?? [],
    limits: {
      color: studioProfile.selectionLimitColor,
      retouch: studioProfile.selectionLimitRetouch,
      maxRetouchRounds: studioProfile.maxRetouchRounds,
    },
  });
}
