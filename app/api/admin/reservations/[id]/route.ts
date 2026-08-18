import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { updateCalendarEvent, deleteCalendarEvent } from "@/lib/google-calendar";

const EDITABLE_FIELDS = [
  "shoot_type",
  "event_date",
  "event_start_time",
  "location",
  "subject_name",
  "guardian_name",
  "phone_primary",
  "phone_secondary",
  "email",
  "depositor_name",
  "balance_due",
  "custom_field_1",
  "custom_field_2",
  "custom_field_3",
  "custom_field_4",
  "custom_field_5",
  "custom_field_6",
  "status",
  "admin_memo",
] as const;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });

  const { data } = await supabase.from("reservations").select("*").eq("id", id).maybeSingle();
  if (!data) return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json({ reservation: data });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { data: existing } = await supabase.from("reservations").select("*").eq("id", id).maybeSingle();
  if (!existing) return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });

  const updates: Partial<Record<(typeof EDITABLE_FIELDS)[number], unknown>> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  const { data: updated, error } = await supabase
    .from("reservations")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: "수정 중 오류가 발생했습니다." }, { status: 500 });
  }

  const scheduleChanged =
    updates.event_date || updates.event_start_time || updates.location || updates.subject_name;

  if (updated.status === "cancelled" && existing.gcal_event_id) {
    await deleteCalendarEvent(existing.gcal_event_id);
  } else if (scheduleChanged && updated.gcal_event_id) {
    await updateCalendarEvent(updated.gcal_event_id, updated);
  }

  return NextResponse.json({ ok: true, reservation: updated });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });

  const { data: existing } = await supabase.from("reservations").select("*").eq("id", id).maybeSingle();
  if (!existing) return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });

  if (existing.gcal_event_id) {
    await deleteCalendarEvent(existing.gcal_event_id);
  }

  const { error } = await supabase.from("reservations").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "삭제 중 오류가 발생했습니다." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
