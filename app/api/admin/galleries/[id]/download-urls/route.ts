import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getDownloadUrl } from "@/lib/r2";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: galleryId } = await params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });

  const body = await request.json().catch(() => null);
  const photoIds: string[] = Array.isArray(body?.photoIds) ? body.photoIds : [];
  if (photoIds.length === 0) return NextResponse.json({ error: "선택된 사진이 없습니다." }, { status: 400 });

  const { data: photos } = await supabase
    .from("photos")
    .select("id, filename, thumb_key")
    .eq("gallery_id", galleryId)
    .in("id", photoIds);

  if (!photos || photos.length === 0) return NextResponse.json({ error: "사진을 찾을 수 없습니다." }, { status: 404 });

  try {
    // 고객이 셀렉한 사진은 RAW로 재작업하므로, 관리자 다운로드는 원본이 아닌 저용량 미리보기(썸네일)를 받되
    // 파일명은 업로드했던 원본 파일명 그대로 유지 (RAW 파일과 대조할 수 있도록).
    const files = await Promise.all(
      photos.map(async (p) => ({ name: p.filename, url: await getDownloadUrl(p.thumb_key, 3600, p.filename) }))
    );
    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ error: "R2가 설정되지 않았습니다." }, { status: 503 });
  }
}
