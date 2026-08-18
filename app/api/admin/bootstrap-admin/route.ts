import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/** 아직 관리자 계정이 하나도 없는지 확인 — 로그인 화면에서 "계정 만들기" 폼을 보여줄지 결정하는 데 사용 */
export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ hasAdmin: true });

  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1 });
  if (error) return NextResponse.json({ hasAdmin: true });

  return NextResponse.json({ hasAdmin: data.users.length > 0 });
}

/** 최초 1명의 관리자 계정만 생성 — 이미 계정이 있으면 항상 거부 (그 이후엔 반드시 로그인만 가능) */
export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });
  }

  const { data: existing, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1 });
  if (listError) {
    return NextResponse.json({ error: "확인 중 오류가 발생했습니다." }, { status: 500 });
  }
  if (existing.users.length > 0) {
    return NextResponse.json({ error: "이미 관리자 계정이 있습니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || password.length < 8) {
    return NextResponse.json({ error: "이메일과 8자 이상의 비밀번호를 입력해주세요." }, { status: 400 });
  }

  const { error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
