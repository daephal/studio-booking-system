import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getStudioProfile } from "@/lib/studio-profile-server";

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });

  const body = await request.json().catch(() => null);
  const reservationId = body?.reservationId;
  if (typeof reservationId !== "string") {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { data: reservation } = await supabase
    .from("reservations")
    .select("id, phone_primary")
    .eq("id", reservationId)
    .maybeSingle();
  if (!reservation) return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });

  const { data: existingGallery } = await supabase
    .from("galleries")
    .select("id")
    .eq("reservation_id", reservationId)
    .maybeSingle();
  if (existingGallery) {
    return NextResponse.json(
      { error: "이미 갤러리가 생성되어 있습니다.", galleryId: existingGallery.id },
      { status: 409 }
    );
  }

  const digits = reservation.phone_primary.replace(/\D/g, "");
  const password = digits.slice(-4) || "0000";
  const slug = nanoid(8);
  const { galleryExpiryDays, selectionPeriodDays } = await getStudioProfile();
  const expiresAt = new Date(Date.now() + galleryExpiryDays * 24 * 60 * 60 * 1000);
  const selectionDeadline = new Date(Date.now() + selectionPeriodDays * 24 * 60 * 60 * 1000);

  const { data: gallery, error } = await supabase
    .from("galleries")
    .insert({
      reservation_id: reservationId,
      slug,
      password,
      expires_at: expiresAt.toISOString(),
      selection_deadline: selectionDeadline.toISOString().slice(0, 10),
    })
    .select("*")
    .single();

  if (error || !gallery) {
    return NextResponse.json({ error: "갤러리 생성 중 오류가 발생했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, gallery });
}
