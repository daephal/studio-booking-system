import { NextResponse } from "next/server";
import { requireGallerySession } from "@/lib/gallery-auth";
import { getDownloadUrl } from "@/lib/r2";

function shootDateToYYMMDD(eventDate: string) {
  const [y, m, d] = eventDate.split("-");
  return `${y.slice(2)}${m}${d}`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const auth = await requireGallerySession(slug);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, gallery } = auth;

  if (!gallery.zip_r2_key) {
    return NextResponse.json({ error: "생성된 ZIP 파일이 없습니다." }, { status: 404 });
  }

  const { data: reservation } = await supabase
    .from("reservations")
    .select("event_date, subject_name")
    .eq("id", gallery.reservation_id)
    .maybeSingle();

  const filename = reservation
    ? `${shootDateToYYMMDD(reservation.event_date)}-${reservation.subject_name}(원본사진).zip`
    : `${gallery.slug}-originals.zip`;

  try {
    const url = await getDownloadUrl(gallery.zip_r2_key, 3600, filename);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "R2가 설정되지 않았습니다." }, { status: 503 });
  }
}
