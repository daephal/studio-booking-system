import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { deleteObjects } from "@/lib/r2";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });

  const { data: photo } = await supabase.from("site_photos").select("r2_key, thumb_key").eq("id", id).maybeSingle();
  if (!photo) return NextResponse.json({ error: "사진을 찾을 수 없습니다." }, { status: 404 });

  await deleteObjects([photo.r2_key, photo.thumb_key]);
  await supabase.from("site_photos").delete().eq("id", id);

  return NextResponse.json({ ok: true });
}
