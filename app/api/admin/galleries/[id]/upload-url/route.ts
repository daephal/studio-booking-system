import { NextResponse } from "next/server";
import { getUploadUrl, galleryOriginalKey, galleryThumbKey, galleryEditedKey, gallerySampleKey } from "@/lib/r2";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: galleryId } = await params;
  const body = await request.json().catch(() => null);
  const filename: string | undefined = body?.filename;
  const contentType: string = body?.contentType || "image/jpeg";
  const kind: "original" | "edited" | "sample" =
    body?.kind === "edited" ? "edited" : body?.kind === "sample" ? "sample" : "original";
  const revisionRound: number = Number(body?.revisionRound) || 0;

  if (!filename) return NextResponse.json({ error: "파일명이 필요합니다." }, { status: 400 });
  if (!/\.jpe?g$/i.test(filename)) {
    return NextResponse.json({ error: "JPG 파일만 업로드 가능합니다." }, { status: 400 });
  }

  const originalKey =
    kind === "original"
      ? galleryOriginalKey(galleryId, filename)
      : kind === "sample"
        ? gallerySampleKey(galleryId, filename)
        : galleryEditedKey(galleryId, revisionRound, filename);
  const thumbKey = galleryThumbKey(galleryId, filename);

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
