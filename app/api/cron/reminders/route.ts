import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { sendMail } from "@/lib/email/transport";
import { selectionReminderCustomerEmail } from "@/lib/email/templates";
import { env } from "@/lib/env";
import { getStudioProfile } from "@/lib/studio-profile-server";

function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });

  const studioProfile = await getStudioProfile();
  const today = new Date().toISOString().slice(0, 10);
  let sent7 = 0;
  let sent3 = 0;

  for (const [days, flagField] of [
    [7, "reminder_7d_sent"],
    [3, "reminder_3d_sent"],
  ] as const) {
    const { data: galleries } = await supabase
      .from("galleries")
      .select("*, reservations!inner(subject_name, email)")
      .eq("status", "active")
      .eq(flagField, false);

    for (const gallery of galleries ?? []) {
      const targetDate = addDays(gallery.selection_deadline, -days);
      if (targetDate !== today) continue;

      const reservation = (gallery as unknown as { reservations: { subject_name: string; email: string } })
        .reservations;
      const link = `${env.siteUrl}/g/${gallery.slug}`;
      const email = selectionReminderCustomerEmail({
        subjectName: reservation.subject_name,
        link,
        deadline: gallery.selection_deadline,
        daysLeft: days,
        studioProfile,
      });
      await sendMail(reservation.email, email.subject, email.html);
      await supabase.from("galleries").update({ [flagField]: true }).eq("id", gallery.id);
      if (days === 7) sent7++;
      else sent3++;
    }
  }

  return NextResponse.json({ ok: true, sent7, sent3 });
}
