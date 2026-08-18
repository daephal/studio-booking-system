import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getDownloadUrl } from "@/lib/r2";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: galleryId } = await params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });

  const { data: rounds } = await supabase
    .from("selection_rounds")
    .select("*")
    .eq("gallery_id", galleryId)
    .order("round", { ascending: true });

  const roundIds = (rounds ?? []).map((r) => r.id);
  const { data: items } =
    roundIds.length > 0
      ? await supabase.from("selection_items").select("*").in("round_id", roundIds)
      : { data: [] as never[] };

  const photoIds = (items ?? []).map((i) => i.photo_id);
  const { data: photos } =
    photoIds.length > 0
      ? await supabase.from("photos").select("*").in("id", photoIds)
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

  return NextResponse.json({ rounds: rounds ?? [], items: items ?? [], photos: photosWithThumb });
}
