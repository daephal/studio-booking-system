import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { deleteObjects } from "@/lib/r2";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: galleryId } = await params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });

  const body = await request.json().catch(() => null);
  const updates: Record<string, unknown> = {};
  if (typeof body?.expiresAt === "string") updates.expires_at = body.expiresAt;
  if (typeof body?.selectionDeadline === "string") updates.selection_deadline = body.selectionDeadline;
  if (typeof body?.status === "string") updates.status = body.status;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "변경할 값이 없습니다." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("galleries")
    .update(updates)
    .eq("id", galleryId)
    .select("*")
    .single();

  if (error || !data) return NextResponse.json({ error: "수정 중 오류가 발생했습니다." }, { status: 500 });
  return NextResponse.json({ ok: true, gallery: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: galleryId } = await params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });

  const { data: photos } = await supabase.from("photos").select("r2_key, thumb_key").eq("gallery_id", galleryId);
  const keys = (photos ?? []).flatMap((p) => [p.r2_key, p.thumb_key]);
  await deleteObjects(keys);

  await supabase.from("galleries").update({ status: "deleted" }).eq("id", galleryId);

  return NextResponse.json({ ok: true });
}
