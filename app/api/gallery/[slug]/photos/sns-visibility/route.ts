import { NextResponse } from "next/server";
import { requireGallerySession } from "@/lib/gallery-auth";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const auth = await requireGallerySession(slug);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, gallery } = auth;

  const body = await request.json().catch(() => null);
  const photoIds: string[] = Array.isArray(body?.photoIds) ? body.photoIds : [];
  const isPublic = Boolean(body?.public);

  if (photoIds.length === 0) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { error } = await supabase
    .from("photos")
    .update({ sns_public: isPublic })
    .eq("gallery_id", gallery.id)
    .in("id", photoIds);

  if (error) {
    return NextResponse.json({ error: "저장 중 오류가 발생했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
