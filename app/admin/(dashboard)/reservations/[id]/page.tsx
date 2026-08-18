import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { SetupNotice } from "@/components/SetupNotice";
import { ReservationDetail } from "./ReservationDetail";
import type { Reservation, Gallery } from "@/lib/types";
import { getFormSettings } from "@/lib/form-settings-server";

export default async function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return (
      <SetupNotice
        items={["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]}
      />
    );
  }

  const { data: reservation } = await supabase.from("reservations").select("*").eq("id", id).maybeSingle();
  if (!reservation) notFound();

  const { data: gallery } = await supabase
    .from("galleries")
    .select("*")
    .eq("reservation_id", id)
    .maybeSingle();

  const formSettings = await getFormSettings();

  return (
    <ReservationDetail
      reservation={reservation as Reservation}
      gallery={(gallery as Gallery) ?? null}
      formSettings={formSettings}
    />
  );
}
