import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { SetupNotice } from "@/components/SetupNotice";
import { RESERVATION_STATUS_LABELS, RESERVATION_STATUS_COLORS } from "@/lib/constants";
import type { Reservation } from "@/lib/types";
import { MiniCalendar } from "./MiniCalendar";
import { CalendarSyncCell } from "./CalendarSyncCell";
import { StatusFilterLine } from "./StatusFilterLine";
import { SearchBox } from "./SearchBox";
import { getFormSettings } from "@/lib/form-settings-server";
import { shootTypeLabel } from "@/lib/form-settings";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return (
      <SetupNotice
        items={["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]}
      />
    );
  }

  let query = supabase.from("reservations").select("*").order("event_date", { ascending: true });
  if (status && status !== "all") query = query.eq("status", status);
  if (q && q.trim()) {
    const term = q.trim().replace(/[%_,]/g, "");
    query = query.or(
      `subject_name.ilike.%${term}%,location.ilike.%${term}%,phone_primary.ilike.%${term}%,phone_secondary.ilike.%${term}%`
    );
  }
  const { data: reservations } = await query;
  const list = (reservations ?? []) as Reservation[];
  const formSettings = await getFormSettings();

  return (
    <div className="space-y-6">
      <MiniCalendar eventDates={list.map((r) => r.event_date)} />

      <SearchBox initialQuery={q} />

      <StatusFilterLine current={status} />

      <div className="space-y-2 sm:hidden">
        {list.map((r) => (
          <div key={r.id} className="adm-card rounded-lg p-3 text-sm">
            <Link href={`/admin/reservations/${r.id}`} className="block">
              <div className="flex items-center justify-between gap-2">
                <span className="text-adm-accent-soft">
                  {r.event_date} · {r.event_start_time}
                </span>
                <span
                  className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs"
                  style={{ background: "var(--adm-surface-2)", color: RESERVATION_STATUS_COLORS[r.status] }}
                >
                  {RESERVATION_STATUS_LABELS[r.status]}
                </span>
              </div>
              <div className="mt-1 text-adm-text-muted">
                {shootTypeLabel(formSettings, r.shoot_type)} · {r.subject_name} · {r.phone_primary}
              </div>
            </Link>
            <div className="mt-2 border-t border-adm-border pt-2">
              <CalendarSyncCell
                reservationId={r.id}
                hasEvent={Boolean(r.gcal_event_id)}
                cancelled={r.status === "cancelled"}
              />
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="adm-card rounded-lg p-6 text-center text-sm text-adm-text-faint">예약이 없습니다.</p>}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-adm-border sm:block">
        <table className="w-full text-sm" style={{ minWidth: 560 }}>
          <thead className="bg-adm-surface-2 text-adm-text-muted">
            <tr>
              <th className="whitespace-nowrap p-3 text-left">촬영일</th>
              <th className="whitespace-nowrap p-3 text-left">행사시작</th>
              <th className="whitespace-nowrap p-3 text-left">촬영형태</th>
              <th className="whitespace-nowrap p-3 text-left">촬영자</th>
              <th className="whitespace-nowrap p-3 text-left">연락처</th>
              <th className="whitespace-nowrap p-3 text-left">상태</th>
              <th className="whitespace-nowrap p-3 text-left">구글 캘린더</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} className="border-t border-adm-border">
                <td className="whitespace-nowrap p-3">
                  <Link href={`/admin/reservations/${r.id}`} className="text-adm-accent-soft hover:text-adm-accent-hover">
                    {r.event_date}
                  </Link>
                </td>
                <td className="whitespace-nowrap p-3">{r.event_start_time}</td>
                <td className="whitespace-nowrap p-3">{shootTypeLabel(formSettings, r.shoot_type)}</td>
                <td className="whitespace-nowrap p-3">{r.subject_name}</td>
                <td className="whitespace-nowrap p-3">{r.phone_primary}</td>
                <td className="whitespace-nowrap p-3">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{ background: "var(--adm-surface-2)", color: RESERVATION_STATUS_COLORS[r.status] }}
                  >
                    {RESERVATION_STATUS_LABELS[r.status]}
                  </span>
                </td>
                <td className="whitespace-nowrap p-3">
                  <CalendarSyncCell
                    reservationId={r.id}
                    hasEvent={Boolean(r.gcal_event_id)}
                    cancelled={r.status === "cancelled"}
                  />
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-adm-text-faint">
                  예약이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
