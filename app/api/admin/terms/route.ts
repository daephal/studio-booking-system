import { NextResponse } from "next/server";
import { saveTerms } from "@/lib/terms-server";
import type { TermsSection } from "@/lib/terms";

function isValidSections(value: unknown): value is TermsSection[] {
  return (
    Array.isArray(value) &&
    value.every(
      (v) =>
        v &&
        typeof v.heading === "string" &&
        Array.isArray(v.items) &&
        v.items.every((i: unknown) => typeof i === "string")
    )
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const title = body?.title;
  const sections = body?.sections;

  if (typeof title !== "string" || !title.trim() || !isValidSections(sections)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  try {
    await saveTerms({ title, sections });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err && "message" in err
          ? String((err as { message: unknown }).message)
          : "저장 실패";
    console.error("[terms] 저장 실패:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
