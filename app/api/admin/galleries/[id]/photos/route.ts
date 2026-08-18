import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: galleryId } = await params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });

  const body = await request.json().catch(() => null);
  const { kind, revisionRound, filename, r2Key, thumbKey, fileSize, width, height } = body ?? {};

  if (!filename || !r2Key || !thumbKey || (kind !== "original" && kind !== "edited" && kind !== "sample")) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("photos")
    .insert({
      gallery_id: galleryId,
      kind,
      revision_round: Number(revisionRound) || 0,
      r2_key: r2Key,
      thumb_key: thumbKey,
      filename,
      file_size: fileSize ?? null,
      width: width ?? null,
      height: height ?? null,
      sort_order: null,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "사진 정보 저장 중 오류가 발생했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, photo: data });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: galleryId } = await params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });

  const { data } = await supabase
    .from("photos")
    .select("*")
    .eq("gallery_id", galleryId)
    .order("filename", { ascending: true });

  return NextResponse.json({ photos: data ?? [] });
}
