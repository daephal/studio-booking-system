import { NextResponse } from "next/server";
import { saveSelectedCalendarId } from "@/lib/google-calendar";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const calendarId: string | undefined = body?.calendarId;
  if (!calendarId) return NextResponse.json({ error: "캘린더를 선택해주세요." }, { status: 400 });

  try {
    await saveSelectedCalendarId(calendarId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err && "message" in err
          ? String((err as { message: unknown }).message)
          : "저장 실패";
    console.error("[google-calendar/select]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
