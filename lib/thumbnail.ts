"use client";

export interface ThumbnailResult {
  thumbBlob: Blob;
  thumbContentType: string;
  width: number;
  height: number;
  /** 디코딩이 끝까지 실패해서 원본 파일을 썸네일로 그대로 쓴 경우 */
  usedOriginalAsThumb: boolean;
}

async function blobToWebp(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  sourceWidth: number,
  sourceHeight: number,
  maxDimension: number
): Promise<Blob> {
  const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context를 사용할 수 없습니다");
  draw(ctx, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("썸네일 인코딩 실패"))), "image/webp", 0.85);
  });
}

/**
 * 브라우저 canvas로 긴 변 maxDimension(px) WebP 썸네일 생성 + 원본 해상도 반환.
 * 일부 카메라 JPEG(CMYK 색공간 등)는 createImageBitmap이 디코딩하지 못해
 * <img> 엘리먼트 디코딩으로 한 번 더 시도하고, 그래도 안 되면 원본 파일을 그대로 썸네일로 사용한다.
 */
export async function generateThumbnail(file: File, maxDimension = 1600): Promise<ThumbnailResult> {
  try {
    const bitmap = await createImageBitmap(file);
    try {
      const thumbBlob = await blobToWebp((ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h), bitmap.width, bitmap.height, maxDimension);
      return { thumbBlob, thumbContentType: "image/webp", width: bitmap.width, height: bitmap.height, usedOriginalAsThumb: false };
    } finally {
      bitmap.close();
    }
  } catch {
    // 1차 실패 — <img> 디코딩으로 재시도
  }

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const thumbBlob = await blobToWebp((ctx, w, h) => ctx.drawImage(img, 0, 0, w, h), img.naturalWidth, img.naturalHeight, maxDimension);
    return { thumbBlob, thumbContentType: "image/webp", width: img.naturalWidth, height: img.naturalHeight, usedOriginalAsThumb: false };
  } catch {
    // 2차도 실패 — 원본 파일을 그대로 썸네일로 사용 (업로드 자체는 막지 않음)
    return { thumbBlob: file, thumbContentType: file.type || "image/jpeg", width: 0, height: 0, usedOriginalAsThumb: true };
  } finally {
    URL.revokeObjectURL(url);
  }
}
