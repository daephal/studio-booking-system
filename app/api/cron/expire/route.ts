import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { deleteObjects } from "@/lib/r2";

const CLOSED_FLOW_STATUSES = ["originals_sent", "selection_done", "edits_sent"];

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "서버 설정이 완료되지 않았습니다." }, { status: 503 });

  const nowIso = new Date().toISOString();
  const { data: galleries } = await supabase
    .from("galleries")
    .select("*")
    .eq("status", "active")
    .lt("expires_at", nowIso);

  let expiredCount = 0;

  for (const gallery of galleries ?? []) {
    const { data: photos } = await supabase
      .from("photos")
      .select("r2_key, thumb_key")
      .eq("gallery_id", gallery.id);

    const keys = (photos ?? []).flatMap((p) => [p.r2_key, p.thumb_key]);
    await deleteObjects(keys);

    await supabase.from("galleries").update({ status: "expired" }).eq("id", gallery.id);

    const { data: reservation } = await supabase
      .from("reservations")
      .select("id, status")
      .eq("id", gallery.reservation_id)
      .maybeSingle();

    if (reservation && CLOSED_FLOW_STATUSES.includes(reservation.status)) {
      await supabase.from("reservations").update({ status: "closed" }).eq("id", reservation.id);
    }

    expiredCount++;
  }

  return NextResponse.json({ ok: true, expiredCount });
}
