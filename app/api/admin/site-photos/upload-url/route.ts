import { NextResponse } from "next/server";
import { getUploadUrl, siteOriginalKey, siteThumbKey } from "@/lib/r2";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const filename: string | undefined = body?.filename;
  const contentType: string = body?.contentType || "image/jpeg";
  const kind: "hero" | "feed" = body?.kind === "hero" ? "hero" : "feed";

  if (!filename) return NextResponse.json({ error: "파일명이 필요합니다." }, { status: 400 });
  if (!/\.jpe?g$/i.test(filename)) {
    return NextResponse.json({ error: "JPG 파일만 업로드 가능합니다." }, { status: 400 });
  }

  const originalKey = siteOriginalKey(kind, filename);
  const thumbKey = siteThumbKey(kind, filename);

  try {
    const [originalUploadUrl, thumbUploadUrl] = await Promise.all([
      getUploadUrl(originalKey, contentType),
      getUploadUrl(thumbKey, "image/webp"),
    ]);
    return NextResponse.json({ originalKey, originalUploadUrl, thumbKey, thumbUploadUrl });
  } catch {
    return NextResponse.json({ error: "R2가 설정되지 않았습니다." }, { status: 503 });
  }
}
