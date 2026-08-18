import { NextResponse } from "next/server";
import { requireGallerySession } from "@/lib/gallery-auth";
import { getDownloadUrl } from "@/lib/r2";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const auth = await requireGallerySession(slug);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, gallery } = auth;

  const body = await request.json().catch(() => null);
  const photoIds: string[] = Array.isArray(body?.photoIds) ? body.photoIds : [];
  if (photoIds.length === 0) {
    return NextResponse.json({ error: "선택된 사진이 없습니다." }, { status: 400 });
  }

  const CHUNK_SIZE = 100;
  const photos: { id: string; filename: string; r2_key: string }[] = [];
  for (let i = 0; i < photoIds.length; i += CHUNK_SIZE) {
    const chunk = photoIds.slice(i, i + CHUNK_SIZE);
    const { data, error } = await supabase
      .from("photos")
      .select("id, filename, r2_key")
      .eq("gallery_id", gallery.id)
      .in("id", chunk);
    if (error) {
      return NextResponse.json({ error: "사진 조회 중 오류가 발생했습니다." }, { status: 500 });
    }
    if (data) photos.push(...data);
  }

  if (photos.length === 0) {
    return NextResponse.json({ error: "사진을 찾을 수 없습니다." }, { status: 404 });
  }

  try {
    const files = await Promise.all(
      photos.map(async (p) => ({ name: p.filename, url: await getDownloadUrl(p.r2_key, 3600, p.filename) }))
    );
    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ error: "R2가 설정되지 않았습니다." }, { status: 503 });
  }
}
