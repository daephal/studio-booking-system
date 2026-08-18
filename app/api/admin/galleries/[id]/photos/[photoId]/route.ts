import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { deleteObjects } from "@/lib/r2";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { id: galleryId, photoId } = await params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });

  const { data: photo } = await supabase
    .from("photos")
    .select("r2_key, thumb_key")
    .eq("id", photoId)
    .eq("gallery_id", galleryId)
    .maybeSingle();

  if (!photo) return NextResponse.json({ error: "사진을 찾을 수 없습니다." }, { status: 404 });

  await deleteObjects([photo.r2_key, photo.thumb_key]);
  await supabase.from("photos").delete().eq("id", photoId);

  return NextResponse.json({ ok: true });
}
