import { NextResponse } from "next/server";
import { saveStudioProfile } from "@/lib/studio-profile-server";
import type { StudioProfile } from "@/lib/studio-profile";

const STRING_FIELDS: (keyof StudioProfile)[] = [
  "studioName",
  "studioTagline",
  "notifyEmail",
  "kakaoChannelUrl",
  "instagramUrl",
  "instagramHandle",
  "bankName",
  "bankAccountNumber",
  "bankAccountHolder",
  "businessOwnerName",
  "businessRegistrationNumber",
  "mailOrderRegistrationNumber",
  "businessAddress",
  "originalsSentMessageTemplate",
  "editsSentMessageTemplate",
];

const NUMBER_FIELDS: (keyof StudioProfile)[] = [
  "selectionLimitColor",
  "selectionLimitRetouch",
  "maxRetouchRounds",
  "galleryExpiryDays",
  "selectionPeriodDays",
  "bookingConflictWindowHours",
];

function isValidStudioProfile(value: unknown): value is StudioProfile {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    STRING_FIELDS.every((f) => typeof v[f] === "string") &&
    NUMBER_FIELDS.every((f) => typeof v[f] === "number" && Number.isFinite(v[f]) && (v[f] as number) >= 0)
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!isValidStudioProfile(body)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (!body.studioName.trim()) {
    return NextResponse.json({ error: "스튜디오명을 입력해주세요." }, { status: 400 });
  }

  try {
    await saveStudioProfile(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err && "message" in err
          ? String((err as { message: unknown }).message)
          : "저장 실패";
    console.error("[studio-profile] 저장 실패:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
