import crypto from "crypto";
import { env } from "@/lib/env";

export const GALLERY_COOKIE_NAME = "jp_gallery_session";

const FALLBACK_SECRET = "dev-only-insecure-secret-change-me";

function sign(data: string) {
  const secret = env.gallerySessionSecret || FALLBACK_SECRET;
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function createGallerySessionToken(galleryId: string, ttlSeconds = 60 * 60 * 24 * 30) {
  const payload = JSON.stringify({ galleryId, exp: Date.now() + ttlSeconds * 1000 });
  const b64 = Buffer.from(payload).toString("base64url");
  const sig = sign(b64);
  return `${b64}.${sig}`;
}

export function verifyGallerySessionToken(
  token: string | undefined | null
): { galleryId: string } | null {
  if (!token) return null;
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return null;
  if (!safeEqual(sign(b64), sig)) return null;
  try {
    const payload = JSON.parse(Buffer.from(b64, "base64url").toString());
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
    if (typeof payload.galleryId !== "string") return null;
    return { galleryId: payload.galleryId };
  } catch {
    return null;
  }
}
