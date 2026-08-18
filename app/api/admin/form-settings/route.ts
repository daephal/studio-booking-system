import { NextResponse } from "next/server";
import { saveFormSettings } from "@/lib/form-settings-server";
import { CUSTOM_FIELD_SLOT_COUNT, type ShootTypeSetting, type CustomFieldSetting } from "@/lib/form-settings";

function isValidShootTypes(value: unknown): value is ShootTypeSetting[] {
  return (
    Array.isArray(value) &&
    value.every(
      (v) =>
        v &&
        typeof v.key === "string" &&
        typeof v.label === "string" &&
        typeof v.enabled === "boolean" &&
        typeof v.requiresGuardianName === "boolean"
    )
  );
}

function isValidCustomFields(value: unknown): value is CustomFieldSetting[] {
  return (
    Array.isArray(value) &&
    value.length === CUSTOM_FIELD_SLOT_COUNT &&
    value.every(
      (v) =>
        v &&
        typeof v.slot === "number" &&
        typeof v.label === "string" &&
        typeof v.enabled === "boolean" &&
        typeof v.required === "boolean"
    )
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const shootTypes = body?.shootTypes;
  const customFields = body?.customFields;

  if (!isValidShootTypes(shootTypes) || !isValidCustomFields(customFields)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  try {
    await saveFormSettings({ shootTypes, customFields });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err && "message" in err
          ? String((err as { message: unknown }).message)
          : "저장 실패";
    console.error("[form-settings] 저장 실패:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
