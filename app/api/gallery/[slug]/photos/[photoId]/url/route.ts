import { NextResponse } from "next/server";
import { requireGallerySession } from "@/lib/gallery-auth";
import { getDownloadUrl } from "@/lib/r2";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; photoId: string }> }
) {
  const { slug, photoId } = await params;
  const auth = await requireGallerySession(slug);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, gallery } = auth;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") === "original" ? "original" : "thumb";

  const { data: photo } = await supabase
    .from("photos")
    .select("filename, r2_key, thumb_key")
    .eq("id", photoId)
    .eq("gallery_id", gallery.id)
    .maybeSingle();

  if (!photo) return NextResponse.json({ error: "사진을 찾을 수 없습니다." }, { status: 404 });

  const key = type === "original" ? photo.r2_key : photo.thumb_key;
  try {
    // 원본 다운로드는 업로드했던 파일명 그대로 저장되도록 강제 (R2 key의 중복방지 접두어가 노출되지 않게)
    const url = await getDownloadUrl(key, 3600, type === "original" ? photo.filename : undefined);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "R2가 설정되지 않았습니다." }, { status: 503 });
  }
}
