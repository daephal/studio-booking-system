import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createCalendarEvent } from "@/lib/google-calendar";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });

  const { data: reservation } = await supabase.from("reservations").select("*").eq("id", id).maybeSingle();
  if (!reservation) return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });

  const gcalEventId = await createCalendarEvent(reservation);
  if (!gcalEventId) {
    return NextResponse.json({ error: "캘린더 동기화에 실패했습니다. 구글 캘린더 연동 상태를 확인해주세요." }, { status: 502 });
  }

  await supabase.from("reservations").update({ gcal_event_id: gcalEventId }).eq("id", id);
  return NextResponse.json({ ok: true, gcalEventId });
}
