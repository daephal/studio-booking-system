import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getStudioProfile } from "@/lib/studio-profile-server";

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

export interface BookingConflict {
  id: string;
  subject_name: string;
  event_start_time: string;
}

/**
 * 같은 날짜의 취소되지 않은 기존 예약과 행사시작시간이
 * bookingConflictWindowHours(작가 설정, 기본 3시간) 미만 차이나면 충돌로 판단.
 */
export async function findBookingConflict(
  eventDate: string,
  eventStartTime: string,
  excludeReservationId?: string
): Promise<BookingConflict | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("reservations")
    .select("id, subject_name, event_start_time")
    .eq("event_date", eventDate)
    .neq("status", "cancelled");

  if (error) throw error;

  const { bookingConflictWindowHours } = await getStudioProfile();
  const targetMinutes = timeToMinutes(eventStartTime);
  const windowMinutes = bookingConflictWindowHours * 60;

  const conflict = (data ?? []).find((r) => {
    if (excludeReservationId && r.id === excludeReservationId) return false;
    return Math.abs(timeToMinutes(r.event_start_time) - targetMinutes) < windowMinutes;
  });

  return conflict ?? null;
}
