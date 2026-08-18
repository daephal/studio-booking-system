import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/email/transport";
import { originalsSentCustomerEmail, editsSentCustomerEmail } from "@/lib/email/templates";
import { env } from "@/lib/env";
import { getStudioProfile } from "@/lib/studio-profile-server";
import { renderMessageTemplate } from "@/lib/studio-profile";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: galleryId } = await params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });

  const body = await request.json().catch(() => null);
  const kind: "original" | "edited" = body?.kind === "edited" ? "edited" : "original";
  const selectionDeadlineInput: string | undefined = body?.selectionDeadline;

  const { data: gallery } = await supabase.from("galleries").select("*").eq("id", galleryId).maybeSingle();
  if (!gallery) return NextResponse.json({ error: "갤러리를 찾을 수 없습니다." }, { status: 404 });

  const { data: reservation } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", gallery.reservation_id)
    .maybeSingle();
  if (!reservation) return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });

  const studioProfile = await getStudioProfile();
  const link = `${env.siteUrl}/g/${gallery.slug}`;

  if (kind === "original") {
    const expiresAt = new Date(Date.now() + studioProfile.galleryExpiryDays * 24 * 60 * 60 * 1000);
    const defaultSelectionDeadline = new Date(Date.now() + studioProfile.selectionPeriodDays * 24 * 60 * 60 * 1000);
    const selectionDeadline = selectionDeadlineInput || defaultSelectionDeadline.toISOString().slice(0, 10);

    await supabase
      .from("galleries")
      .update({ expires_at: expiresAt.toISOString(), selection_deadline: selectionDeadline, status: "active" })
      .eq("id", galleryId);

    await supabase.from("reservations").update({ status: "originals_sent" }).eq("id", reservation.id);

    const email = originalsSentCustomerEmail({
      subjectName: reservation.subject_name,
      link,
      deadline: selectionDeadline,
      studioProfile,
    });
    await sendMail(reservation.email, email.subject, email.html);

    const copyText = renderMessageTemplate(studioProfile.originalsSentMessageTemplate, {
      studioName: studioProfile.studioName,
      subjectName: reservation.subject_name,
      link,
      deadline: selectionDeadline,
      expiryDays: String(studioProfile.galleryExpiryDays),
    });

    return NextResponse.json({ ok: true, link, selectionDeadline, copyText });
  }

  await supabase.from("reservations").update({ status: "edits_sent" }).eq("id", reservation.id);

  const { data: rounds } = await supabase
    .from("selection_rounds")
    .select("round, submitted_at")
    .eq("gallery_id", galleryId)
    .in("round", [1, 2]);
  const submittedCount = (rounds ?? []).filter((r) => r.submitted_at).length;
  const remainingRounds = Math.max(0, studioProfile.maxRetouchRounds - submittedCount);

  const email = editsSentCustomerEmail({ subjectName: reservation.subject_name, link, remainingRounds, studioProfile });
  await sendMail(reservation.email, email.subject, email.html);

  const copyText = renderMessageTemplate(studioProfile.editsSentMessageTemplate, {
    studioName: studioProfile.studioName,
    subjectName: reservation.subject_name,
    link,
    remainingRounds: String(remainingRounds),
  });

  return NextResponse.json({ ok: true, link, remainingRounds, copyText });
}
