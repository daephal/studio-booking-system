import { NextResponse } from "next/server";
import { isValidHexColor } from "@/lib/theme";
import { saveThemeSettings } from "@/lib/theme-server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const mode = body?.mode === "light" ? "light" : body?.mode === "dark" ? "dark" : null;
  const accent: string | undefined = body?.accent;

  if (!mode) return NextResponse.json({ error: "배경을 선택해주세요." }, { status: 400 });
  if (!accent || !isValidHexColor(accent)) {
    return NextResponse.json({ error: "메인 컬러 형식이 올바르지 않습니다." }, { status: 400 });
  }

  try {
    await saveThemeSettings({ mode, accent });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err && "message" in err
          ? String((err as { message: unknown }).message)
          : "저장 실패";
    console.error("[theme] 저장 실패:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
