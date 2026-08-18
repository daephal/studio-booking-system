import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";
import { downloadZip } from "client-zip";
import { nanoid } from "nanoid";
import { env, isR2Configured } from "@/lib/env";

export const r2Configured = isR2Configured;

let client: S3Client | null = null;

function getClient(): S3Client | null {
  if (!isR2Configured) return null;
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${env.r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.r2AccessKeyId!,
        secretAccessKey: env.r2SecretAccessKey!,
      },
    });
  }
  return client;
}

export async function getUploadUrl(key: string, contentType: string) {
  const c = getClient();
  if (!c) throw new Error("R2가 설정되지 않았습니다 (.env의 R2_* 값을 확인하세요)");
  const cmd = new PutObjectCommand({ Bucket: env.r2Bucket!, Key: key, ContentType: contentType });
  return getSignedUrl(c, cmd, { expiresIn: 600 });
}

function contentDisposition(filename: string) {
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "'");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

/**
 * filename을 넘기면 실제 저장 시 그 이름 그대로 다운로드되도록 강제합니다
 * (R2 key에는 충돌 방지용 접두어가 붙어있어, 지정하지 않으면 브라우저가 key를 파일명으로 사용합니다).
 */
export async function getDownloadUrl(key: string, expiresInSeconds = 3600, filename?: string) {
  const c = getClient();
  if (!c) throw new Error("R2가 설정되지 않았습니다 (.env의 R2_* 값을 확인하세요)");
  const cmd = new GetObjectCommand({
    Bucket: env.r2Bucket!,
    Key: key,
    ...(filename ? { ResponseContentDisposition: contentDisposition(filename) } : {}),
  });
  return getSignedUrl(c, cmd, { expiresIn: expiresInSeconds });
}

export async function deleteObjects(keys: string[]) {
  const c = getClient();
  if (!c || keys.length === 0) return;
  await Promise.all(
    keys.map((key) => c.send(new DeleteObjectCommand({ Bucket: env.r2Bucket!, Key: key })))
  );
}

function safeFilename(filename: string) {
  return `${nanoid(8)}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
}

export function galleryOriginalKey(galleryId: string, filename: string) {
  return `galleries/${galleryId}/original/${safeFilename(filename)}`;
}

export function galleryThumbKey(galleryId: string, filename: string) {
  return `galleries/${galleryId}/thumb/${safeFilename(filename)}`;
}

export function galleryEditedKey(galleryId: string, round: number, filename: string) {
  return `galleries/${galleryId}/edited/r${round}/${safeFilename(filename)}`;
}

export function gallerySampleKey(galleryId: string, filename: string) {
  return `galleries/${galleryId}/sample/${safeFilename(filename)}`;
}

export function galleryPrefix(galleryId: string) {
  return `galleries/${galleryId}/`;
}

export function galleryZipKey(galleryId: string) {
  return `galleries/${galleryId}/zip/originals.zip`;
}

/**
 * 지정한 파일들(각각의 다운로드 URL)을 순서대로 하나씩 받아 압축하면서 R2에 스트리밍 업로드합니다.
 * 같은 key로 덮어쓰기 때문에, 업로드가 완전히 끝나야만 기존 zip이 새 zip으로 교체됩니다
 * (중간에 실패해도 기존 zip은 그대로 남아있어 안전합니다).
 */
export async function buildZipToR2(key: string, files: { filename: string; url: string }[]) {
  const c = getClient();
  if (!c) throw new Error("R2가 설정되지 않았습니다 (.env의 R2_* 값을 확인하세요)");

  // 요청을 하나씩 순차적으로 보내면 파일당 네트워크 왕복 지연이 그대로 누적되어(사진 수백~수천장이면
  // 서버리스 함수 제한 시간을 넘기기 쉽습니다), 최대 PREFETCH_WINDOW개를 동시에 미리 요청해두고
  // client-zip이 필요로 하는 순서대로 하나씩 소비합니다.
  async function* entries() {
    const PREFETCH_WINDOW = 8;
    const inFlight = new Map<number, Promise<Response>>();
    const start = (i: number) => inFlight.set(i, fetch(files[i].url));
    for (let i = 0; i < Math.min(PREFETCH_WINDOW, files.length); i++) start(i);

    for (let i = 0; i < files.length; i++) {
      const res = await inFlight.get(i)!;
      inFlight.delete(i);
      const next = i + PREFETCH_WINDOW;
      if (next < files.length) start(next);
      yield { name: files[i].filename, input: res };
    }
  }

  const zipResponse = downloadZip(entries());
  if (!zipResponse.body) throw new Error("ZIP 스트림 생성에 실패했습니다.");

  const upload = new Upload({
    client: c,
    params: {
      Bucket: env.r2Bucket!,
      Key: key,
      Body: zipResponse.body,
      ContentType: "application/zip",
    },
    partSize: 10 * 1024 * 1024,
  });
  await upload.done();

  const head = await c.send(new HeadObjectCommand({ Bucket: env.r2Bucket!, Key: key }));
  return { size: head.ContentLength ?? null };
}

export function siteOriginalKey(kind: "hero" | "feed", filename: string) {
  return `site/${kind}/original/${safeFilename(filename)}`;
}

export function siteThumbKey(kind: "hero" | "feed", filename: string) {
  return `site/${kind}/thumb/${safeFilename(filename)}`;
}
