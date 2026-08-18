import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const HERO_MAX_COUNT = 4;

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });

  const { data } = await supabase
    .from("site_photos")
    .select("*")
    .order("kind", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return NextResponse.json({ photos: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });

  const body = await request.json().catch(() => null);
  const kind: "hero" | "feed" = body?.kind === "hero" ? "hero" : "feed";
  const { filename, r2Key, thumbKey } = body ?? {};

  if (!filename || !r2Key || !thumbKey) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  // 히어로 사진은 최대 HERO_MAX_COUNT장까지 — 이후엔 기존 사진을 먼저 삭제해야 새로 올릴 수 있습니다.
  if (kind === "hero") {
    const { count } = await supabase.from("site_photos").select("id", { count: "exact", head: true }).eq("kind", "hero");
    if ((count ?? 0) >= HERO_MAX_COUNT) {
      return NextResponse.json({ error: `대표 사진은 최대 ${HERO_MAX_COUNT}장까지 업로드할 수 있습니다.` }, { status: 400 });
    }
  }

  const { data: maxRow } = await supabase
    .from("site_photos")
    .select("sort_order")
    .eq("kind", kind)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSortOrder = (maxRow?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("site_photos")
    .insert({ kind, r2_key: r2Key, thumb_key: thumbKey, filename, sort_order: nextSortOrder })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "저장 중 오류가 발생했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, photo: data });
}
