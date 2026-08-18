"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SitePhoto } from "@/lib/types";
import { generateThumbnail } from "@/lib/thumbnail";

interface SitePhotoWithThumb extends SitePhoto {
  thumbUrl: string | null;
}

interface UploadEntry {
  file: File;
  status: "working" | "done" | "error";
  message: string;
}

export function SitePhotosManager({ initialPhotos }: { initialPhotos: SitePhotoWithThumb[] }) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initialPhotos);
  const [heroUploads, setHeroUploads] = useState<UploadEntry[]>([]);
  const [feedUploads, setFeedUploads] = useState<UploadEntry[]>([]);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const feedInputRef = useRef<HTMLInputElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const HERO_MAX_COUNT = 4;
  const heroList = photos.filter((p) => p.kind === "hero");
  const feed = photos.filter((p) => p.kind === "feed");

  async function uploadOne(file: File, kind: "hero" | "feed") {
    const setUploads = kind === "hero" ? setHeroUploads : setFeedUploads;
    const entry: UploadEntry = { file, status: "working", message: "썸네일 생성 중" };
    setUploads((prev) => [...prev, entry]);
    const update = (patch: Partial<UploadEntry>) =>
      setUploads((prev) => prev.map((u) => (u.file === file ? { ...u, ...patch } : u)));

    if (!/\.jpe?g$/i.test(file.name)) {
      update({ status: "error", message: "JPG 파일만 업로드 가능합니다." });
      return;
    }

    try {
      const { thumbBlob, thumbContentType } = await generateThumbnail(file);

      update({ message: "업로드 URL 요청 중" });
      const urlRes = await fetch("/api/admin/site-photos/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type || "image/jpeg", kind }),
      });
      const urlBody = await urlRes.json();
      if (!urlRes.ok) throw new Error(urlBody.error);

      update({ message: "원본 업로드 중" });
      await fetch(urlBody.originalUploadUrl, { method: "PUT", headers: { "Content-Type": file.type || "image/jpeg" }, body: file });

      update({ message: "썸네일 업로드 중" });
      await fetch(urlBody.thumbUploadUrl, { method: "PUT", headers: { "Content-Type": thumbContentType }, body: thumbBlob });

      update({ message: "저장 중" });
      const photoRes = await fetch("/api/admin/site-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, filename: file.name, r2Key: urlBody.originalKey, thumbKey: urlBody.thumbKey }),
      });
      const photoBody = await photoRes.json();
      if (!photoRes.ok) throw new Error(photoBody.error);

      setPhotos((prev) => [...prev, { ...photoBody.photo, thumbUrl: null }]);
      update({ status: "done", message: "완료" });
      router.refresh();
    } catch (e) {
      update({ status: "error", message: e instanceof Error ? e.message : "실패" });
    }
  }

  function handleFiles(fileList: FileList | null, kind: "hero" | "feed") {
    if (!fileList || fileList.length === 0) return;
    Array.from(fileList).forEach((file) => uploadOne(file, kind));
  }

  async function handleDelete(id: string) {
    if (!confirm("이 사진을 삭제하시겠습니까?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/site-photos/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== id));
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-3xl space-y-8 text-adm-text">
      <div>
        <h1 className="adm-h1">홈페이지 사진 관리</h1>
        <p className="mt-1 text-sm text-adm-text-muted">
          여기서 올린 사진이 홈페이지 히어로/피드에 바로 반영됩니다. JPG만 업로드 가능합니다.
        </p>
      </div>

      <section className="adm-card space-y-3 rounded-lg p-4">
        <h2 className="font-medium">대표 사진 (히어로, 최대 {HERO_MAX_COUNT}장)</h2>
        <p className="text-xs text-adm-text-faint">
          홈페이지 상단에서 천천히 확대되며 순서대로 자동 전환됩니다. 1장만 올리면 그 사진이 계속 반복되고, 2장 이상이면 서로 페이드
          전환됩니다. ({heroList.length}/{HERO_MAX_COUNT}장)
        </p>

        {heroList.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {heroList.map((p) => (
              <div key={p.id} className="relative aspect-video overflow-hidden rounded-lg bg-adm-surface-2">
                {p.thumbUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.thumbUrl} alt={p.filename} className="h-full w-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  disabled={deletingId === p.id}
                  className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white disabled:opacity-50"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}

        {heroList.length < HERO_MAX_COUNT ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFiles(e.dataTransfer.files, "hero");
            }}
            onClick={() => heroInputRef.current?.click()}
            className="cursor-pointer rounded-lg border-2 border-dashed border-adm-border-strong p-6 text-center text-sm text-adm-text-faint"
          >
            클릭하거나 드래그해서 대표 사진 업로드 (여러 장 가능)
            <input
              ref={heroInputRef}
              type="file"
              multiple
              accept="image/jpeg"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files, "hero")}
            />
          </div>
        ) : (
          <p className="text-xs text-adm-text-faint">최대 장수에 도달했습니다. 새로 올리려면 기존 사진을 먼저 삭제해주세요.</p>
        )}

        {heroUploads.length > 0 && (
          <ul className="space-y-1 text-xs">
            {heroUploads.map((u, i) => (
              <li key={i} className="flex items-center justify-between rounded bg-adm-surface-2 px-2 py-1">
                <span className="truncate">{u.file.name}</span>
                <span className={u.status === "error" ? "text-[#e08a8a]" : "text-adm-text-muted"}>{u.message}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="adm-card space-y-3 rounded-lg p-4">
        <h2 className="font-medium">피드 사진 (인스타그램 그리드, 여러 장)</h2>
        <p className="text-xs text-adm-text-faint">올린 순서대로 그리드에 표시됩니다.</p>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files, "feed");
          }}
          onClick={() => feedInputRef.current?.click()}
          className="cursor-pointer rounded-lg border-2 border-dashed border-adm-border-strong p-6 text-center text-sm text-adm-text-faint"
        >
          클릭하거나 드래그해서 피드 사진 업로드 (여러 장 가능)
          <input
            ref={feedInputRef}
            type="file"
            multiple
            accept="image/jpeg"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files, "feed")}
          />
        </div>

        {feedUploads.length > 0 && (
          <ul className="space-y-1 text-xs">
            {feedUploads.map((u, i) => (
              <li key={i} className="flex items-center justify-between rounded bg-adm-surface-2 px-2 py-1">
                <span className="truncate">{u.file.name}</span>
                <span className={u.status === "error" ? "text-[#e08a8a]" : "text-adm-text-muted"}>{u.message}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {feed.map((p) => (
            <div key={p.id} className="relative aspect-square overflow-hidden rounded bg-adm-surface-2">
              {p.thumbUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.thumbUrl} alt={p.filename} className="h-full w-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => handleDelete(p.id)}
                disabled={deletingId === p.id}
                className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white disabled:opacity-50"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
