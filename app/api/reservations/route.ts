import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { reservationFormSchema } from "@/lib/validation";
import { findBookingConflict } from "@/lib/booking-conflict";
import { createCalendarEvent } from "@/lib/google-calendar";
import { sendMail } from "@/lib/email/transport";
import {
  reservationConfirmedCustomerEmail,
  reservationNotifyAdminEmail,
} from "@/lib/email/templates";
import { getFormSettings } from "@/lib/form-settings-server";
import { shootTypeLabel, requiresGuardianName } from "@/lib/form-settings";
import { getStudioProfile } from "@/lib/studio-profile-server";

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "서버 설정이 완료되지 않았습니다 (Supabase 환경변수 미설정). 관리자에게 문의해주세요." },
      { status: 503 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = reservationFormSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "입력값을 확인해주세요.", issues: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;

  const conflict = await findBookingConflict(data.event_date, data.event_start_time);
  if (conflict) {
    return NextResponse.json(
      { error: "해당 시간대는 예약이 어렵습니다. 다른 시간을 선택하시거나 스튜디오로 문의해 주세요." },
      { status: 409 }
    );
  }

  const formSettings = await getFormSettings();

  const insertPayload = {
    shoot_type: data.shoot_type,
    event_date: data.event_date,
    event_start_time: data.event_start_time,
    location: data.location,
    subject_name: data.subject_name,
    guardian_name: requiresGuardianName(formSettings, data.shoot_type) ? data.guardian_name || null : null,
    phone_primary: data.phone_primary,
    phone_secondary: data.phone_secondary || null,
    email: data.email,
    depositor_name: data.depositor_name,
    balance_due: data.balance_due,
    custom_field_1: data.custom_field_1 || null,
    custom_field_2: data.custom_field_2 || null,
    custom_field_3: data.custom_field_3 || null,
    custom_field_4: data.custom_field_4 || null,
    custom_field_5: data.custom_field_5 || null,
    custom_field_6: data.custom_field_6 || null,
    terms_agreed_at: new Date().toISOString(),
    status: "received" as const,
  };

  const { data: inserted, error } = await supabase
    .from("reservations")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error || !inserted) {
    console.error("[api/reservations] insert 실패:", error);
    return NextResponse.json({ error: "예약 저장 중 오류가 발생했습니다." }, { status: 500 });
  }

  const gcalEventId = await createCalendarEvent(insertPayload);
  if (gcalEventId) {
    await supabase.from("reservations").update({ gcal_event_id: gcalEventId }).eq("id", inserted.id);
  }

  const studioProfile = await getStudioProfile();
  const emailExtra = {
    shootTypeLabel: shootTypeLabel(formSettings, insertPayload.shoot_type),
    customFieldRows: formSettings.customFields
      .filter((f) => f.enabled && f.label.trim())
      .map((f) => ({
        label: f.label,
        value: (insertPayload as Record<string, unknown>)[`custom_field_${f.slot}`] as string | null,
      })),
  };
  const customerEmail = reservationConfirmedCustomerEmail(insertPayload, emailExtra, studioProfile);
  const adminEmail = reservationNotifyAdminEmail(insertPayload, emailExtra, studioProfile);
  await Promise.all([
    sendMail(data.email, customerEmail.subject, customerEmail.html),
    sendMail(studioProfile.notifyEmail, adminEmail.subject, adminEmail.html),
  ]);

  return NextResponse.json({ ok: true, id: inserted.id });
}
