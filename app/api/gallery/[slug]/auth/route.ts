import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createGallerySessionToken, GALLERY_COOKIE_NAME } from "@/lib/session";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const password = body?.password;
  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json({ error: "비밀번호를 입력해주세요." }, { status: 400 });
  }

  const { data: gallery } = await supabase
    .from("galleries")
    .select("id, password, failed_attempts, locked_until")
    .eq("slug", slug)
    .maybeSingle();

  if (!gallery) {
    return NextResponse.json({ error: "갤러리를 찾을 수 없습니다." }, { status: 404 });
  }

  if (gallery.locked_until && new Date(gallery.locked_until).getTime() > Date.now()) {
    return NextResponse.json(
      { error: "비밀번호를 너무 많이 틀렸습니다. 15분 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  if (gallery.password !== password) {
    const attempts = (gallery.failed_attempts ?? 0) + 1;
    const shouldLock = attempts >= MAX_ATTEMPTS;
    await supabase
      .from("galleries")
      .update({
        failed_attempts: shouldLock ? 0 : attempts,
        locked_until: shouldLock ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString() : null,
      })
      .eq("id", gallery.id);

    if (shouldLock) {
      return NextResponse.json(
        { error: "비밀번호를 너무 많이 틀렸습니다. 15분 후 다시 시도해주세요." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  if (gallery.failed_attempts > 0 || gallery.locked_until) {
    await supabase.from("galleries").update({ failed_attempts: 0, locked_until: null }).eq("id", gallery.id);
  }

  const token = createGallerySessionToken(gallery.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(GALLERY_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(GALLERY_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
