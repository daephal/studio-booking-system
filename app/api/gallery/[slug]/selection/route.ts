import { NextResponse } from "next/server";
import { requireGallerySession } from "@/lib/gallery-auth";
import { getStudioProfile } from "@/lib/studio-profile-server";
import { sendMail } from "@/lib/email/transport";
import { selectionSubmittedAdminEmail, reeditRequestedAdminEmail } from "@/lib/email/templates";

interface SelectionItemInput {
  photoId: string;
  retouch: boolean;
  memo?: string;
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const auth = await requireGallerySession(slug);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, gallery } = auth;
  const studioProfile = await getStudioProfile();

  const body = await request.json().catch(() => null);
  const round = Number(body?.round);
  const overallMemo: string | null = typeof body?.overallMemo === "string" ? body.overallMemo : null;
  const items: SelectionItemInput[] = Array.isArray(body?.items) ? body.items : [];

  if (![0, 1, 2].includes(round)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (round === 0) {
    const today = new Date().toISOString().slice(0, 10);
    if (gallery.selection_deadline < today) {
      return NextResponse.json({ error: "셀렉 마감일이 지났습니다." }, { status: 400 });
    }
    if (items.length > studioProfile.selectionLimitColor) {
      return NextResponse.json(
        { error: `색상보정은 최대 ${studioProfile.selectionLimitColor}장까지 선택 가능합니다.` },
        { status: 400 }
      );
    }
    const retouchCount = items.filter((i) => i.retouch).length;
    if (retouchCount > studioProfile.selectionLimitRetouch) {
      return NextResponse.json(
        { error: `리터칭은 최대 ${studioProfile.selectionLimitRetouch}장까지 선택 가능합니다.` },
        { status: 400 }
      );
    }
  } else {
    const { data: existingRounds } = await supabase
      .from("selection_rounds")
      .select("round, submitted_at")
      .eq("gallery_id", gallery.id)
      .in("round", [1, 2]);
    const submittedOtherRounds = (existingRounds ?? []).filter(
      (r) => r.submitted_at && r.round !== round
    ).length;
    if (submittedOtherRounds >= studioProfile.maxRetouchRounds) {
      return NextResponse.json({ error: "재수정 요청이 모두 사용되었습니다." }, { status: 400 });
    }
  }

  const { data: existingRound } = await supabase
    .from("selection_rounds")
    .select("id")
    .eq("gallery_id", gallery.id)
    .eq("round", round)
    .maybeSingle();

  let roundId: string;
  if (existingRound) {
    roundId = existingRound.id;
    await supabase
      .from("selection_rounds")
      .update({ overall_memo: overallMemo, submitted_at: new Date().toISOString() })
      .eq("id", roundId);
    await supabase.from("selection_items").delete().eq("round_id", roundId);
  } else {
    const { data: created, error } = await supabase
      .from("selection_rounds")
      .insert({
        gallery_id: gallery.id,
        round,
        overall_memo: overallMemo,
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error || !created) {
      return NextResponse.json({ error: "저장 중 오류가 발생했습니다." }, { status: 500 });
    }
    roundId = created.id;
  }

  if (items.length > 0) {
    const { error: itemsError } = await supabase.from("selection_items").insert(
      items.map((i) => ({
        round_id: roundId,
        photo_id: i.photoId,
        retouch: i.retouch,
        memo: i.memo || null,
      }))
    );
    if (itemsError) {
      return NextResponse.json({ error: "저장 중 오류가 발생했습니다." }, { status: 500 });
    }
  }

  const { data: reservation } = await supabase
    .from("reservations")
    .select("id, subject_name")
    .eq("id", gallery.reservation_id)
    .maybeSingle();

  if (round === 0) {
    if (reservation) {
      await supabase.from("reservations").update({ status: "selection_done" }).eq("id", reservation.id);
    }
    const email = selectionSubmittedAdminEmail({
      subjectName: reservation?.subject_name ?? "고객",
      colorCount: items.length,
      retouchCount: items.filter((i) => i.retouch).length,
      studioProfile,
    });
    await sendMail(studioProfile.notifyEmail, email.subject, email.html);
  } else {
    const email = reeditRequestedAdminEmail({
      subjectName: reservation?.subject_name ?? "고객",
      round,
      studioProfile,
    });
    await sendMail(studioProfile.notifyEmail, email.subject, email.html);
  }

  return NextResponse.json({ ok: true });
}
