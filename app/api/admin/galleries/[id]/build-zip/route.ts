import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getDownloadUrl, buildZipToR2, galleryZipKey } from "@/lib/r2";

export const maxDuration = 300;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: galleryId } = await params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });

  const { data: photos } = await supabase
    .from("photos")
    .select("filename, r2_key")
    .eq("gallery_id", galleryId)
    .eq("kind", "original");

  if (!photos || photos.length === 0) {
    return NextResponse.json({ error: "원본 사진이 없습니다." }, { status: 400 });
  }

  try {
    const files = await Promise.all(
      photos.map(async (p) => ({ filename: p.filename, url: await getDownloadUrl(p.r2_key, 3600) }))
    );

    const key = galleryZipKey(galleryId);
    const { size } = await buildZipToR2(key, files);
    const builtAt = new Date().toISOString();

    await supabase
      .from("galleries")
      .update({ zip_r2_key: key, zip_size: size, zip_built_at: builtAt })
      .eq("id", galleryId);

    return NextResponse.json({ ok: true, zipSize: size, zipBuiltAt: builtAt, photoCount: photos.length });
  } catch {
    return NextResponse.json({ error: "ZIP 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
