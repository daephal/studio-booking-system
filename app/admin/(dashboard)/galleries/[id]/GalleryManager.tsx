"use client";

import { useEffect, useRef, useState } from "react";
import type { Gallery, Photo, Reservation, SelectionItem, SelectionRound } from "@/lib/types";
import { RESERVATION_STATUS_LABELS } from "@/lib/constants";
import { generateThumbnail } from "@/lib/thumbnail";
import { downloadPhotosAsZip } from "@/lib/zip-download";
import { CollapsiblePanel } from "@/components/CollapsiblePanel";

function sanitizeFilename(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "").trim().replace(/\s+/g, "_");
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
}

interface UploadEntry {
  file: File;
  status: "pending" | "working" | "done" | "error";
  message: string;
}

interface PendingUpload {
  files: File[];
  duplicateNames: string[];
}

interface SelectionResultPhoto extends Photo {
  thumbUrl: string | null;
}

interface PhotoWithThumb extends Photo {
  thumbUrl: string | null;
}

interface PreviewPhoto {
  id: string;
  filename: string;
  thumbUrl: string | null;
  note?: string;
}

const inputClass = "adm-input w-full";

export function GalleryManager({
  gallery,
  reservation,
  initialPhotos,
}: {
  gallery: Gallery;
  reservation: Reservation;
  initialPhotos: PhotoWithThumb[];
}) {
  const [photos, setPhotos] = useState<PhotoWithThumb[]>(initialPhotos);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [dupKeepStrategy, setDupKeepStrategy] = useState<"latest" | "first">("latest");
  const [cleaningDuplicates, setCleaningDuplicates] = useState(false);
  const [previewState, setPreviewState] = useState<{ list: PreviewPhoto[]; index: number } | null>(null);
  const previewPhoto = previewState ? previewState.list[previewState.index] : null;

  function openPreview(list: PreviewPhoto[], index: number) {
    setPreviewState({ list, index });
  }

  function closePreview() {
    setPreviewState(null);
  }

  function showNextPreview() {
    setPreviewState((prev) => (prev ? { ...prev, index: (prev.index + 1) % prev.list.length } : prev));
  }

  function showPrevPreview() {
    setPreviewState((prev) => (prev ? { ...prev, index: (prev.index - 1 + prev.list.length) % prev.list.length } : prev));
  }

  useEffect(() => {
    if (!previewState) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") showNextPreview();
      else if (e.key === "ArrowLeft") showPrevPreview();
      else if (e.key === "Escape") closePreview();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewState]);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [uploadKind, setUploadKind] = useState<"original" | "edited" | "sample">("original");
  const [revisionRound, setRevisionRound] = useState(0);
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [copyText, setCopyText] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [selectionDeadlineInput, setSelectionDeadlineInput] = useState(gallery.selection_deadline);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [zipBuilding, setZipBuilding] = useState(false);
  const [zipMessage, setZipMessage] = useState<string | null>(null);
  const [zipInfo, setZipInfo] = useState<{ size: number | null; builtAt: string | null }>({
    size: gallery.zip_size,
    builtAt: gallery.zip_built_at,
  });

  const [rounds, setRounds] = useState<SelectionRound[]>([]);
  const [items, setItems] = useState<SelectionItem[]>([]);
  const [resultPhotos, setResultPhotos] = useState<SelectionResultPhoto[]>([]);

  useEffect(() => {
    fetch(`/api/admin/galleries/${gallery.id}/selection-result`)
      .then((res) => res.json())
      .then((body) => {
        setRounds(body.rounds ?? []);
        setItems(body.items ?? []);
        setResultPhotos(body.photos ?? []);
      })
      .catch(() => {});
  }, [gallery.id]);

  const originalPhotos = photos.filter((p) => p.kind === "original");
  const editedPhotos = photos.filter((p) => p.kind === "edited");
  const samplePhotos = photos.filter((p) => p.kind === "sample");

  function updateUpload(index: number, patch: Partial<UploadEntry>) {
    setUploads((prev) => prev.map((u, i) => (i === index ? { ...u, ...patch } : u)));
  }

  async function uploadOne(file: File, index: number) {
    if (!/\.jpe?g$/i.test(file.name)) {
      updateUpload(index, { status: "error", message: "JPG 파일만 업로드 가능합니다." });
      return;
    }
    try {
      updateUpload(index, { status: "working", message: "썸네일 생성 중" });
      const { thumbBlob, thumbContentType, width, height, usedOriginalAsThumb } = await generateThumbnail(file);

      updateUpload(index, { message: "업로드 URL 요청 중" });
      const urlRes = await fetch(`/api/admin/galleries/${gallery.id}/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "image/jpeg",
          kind: uploadKind,
          revisionRound,
        }),
      });
      const urlBody = await urlRes.json();
      if (!urlRes.ok) throw new Error(urlBody.error);

      updateUpload(index, { message: "원본 업로드 중" });
      await fetch(urlBody.originalUploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
      });

      updateUpload(index, { message: usedOriginalAsThumb ? "미리보기 생성 실패 — 원본으로 대체 중" : "썸네일 업로드 중" });
      await fetch(urlBody.thumbUploadUrl, {
        method: "PUT",
        headers: { "Content-Type": thumbContentType },
        body: thumbBlob,
      });

      updateUpload(index, { message: "저장 중" });
      const photoRes = await fetch(`/api/admin/galleries/${gallery.id}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: uploadKind,
          revisionRound,
          filename: file.name,
          r2Key: urlBody.originalKey,
          thumbKey: urlBody.thumbKey,
          fileSize: file.size,
          width,
          height,
        }),
      });
      const photoBody = await photoRes.json();
      if (!photoRes.ok) throw new Error(photoBody.error);

      setPhotos((prev) => [...prev, { ...photoBody.photo, thumbUrl: URL.createObjectURL(thumbBlob) }]);
      updateUpload(index, { status: "done", message: usedOriginalAsThumb ? "완료 (미리보기는 원본으로 대체됨)" : "완료" });
    } catch (e) {
      updateUpload(index, { status: "error", message: e instanceof Error ? e.message : "실패" });
    }
  }

  // 한 번에 너무 많은 사진을 동시에 디코딩하면(특히 모바일 브라우저) 메모리 부족으로 탭이 죽을 수 있어
  // 동시 처리 개수를 제한해서 순서대로 처리한다.
  const UPLOAD_CONCURRENCY = 2;

  async function runQueue(queue: { file: File; index: number }[]) {
    let cursor = 0;
    async function worker() {
      while (cursor < queue.length) {
        const item = queue[cursor++];
        await uploadOne(item.file, item.index);
      }
    }
    await Promise.all(Array.from({ length: Math.min(UPLOAD_CONCURRENCY, queue.length) }, worker));
  }

  function enqueueFiles(files: File[]) {
    if (files.length === 0) return;
    const entries: UploadEntry[] = files.map((file) => ({
      file,
      status: "pending",
      message: "대기 중",
    }));
    const startIndex = uploads.length;
    setUploads((prev) => [...prev, ...entries]);
    runQueue(files.map((file, i) => ({ file, index: startIndex + i })));
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const existingNames = new Set(
      photos
        .filter((p) => p.kind === uploadKind && (uploadKind !== "edited" || p.revision_round === revisionRound))
        .map((p) => p.filename.toLowerCase())
    );
    const duplicateNames = files.filter((f) => existingNames.has(f.name.toLowerCase())).map((f) => f.name);
    if (duplicateNames.length > 0) {
      setPendingUpload({ files, duplicateNames });
      return;
    }
    enqueueFiles(files);
  }

  async function resolveOverwrite() {
    if (!pendingUpload) return;
    const dupSet = new Set(pendingUpload.duplicateNames.map((n) => n.toLowerCase()));
    const toDelete = photos.filter(
      (p) =>
        p.kind === uploadKind &&
        (uploadKind !== "edited" || p.revision_round === revisionRound) &&
        dupSet.has(p.filename.toLowerCase())
    );
    await Promise.all(
      toDelete.map((p) => fetch(`/api/admin/galleries/${gallery.id}/photos/${p.id}`, { method: "DELETE" }))
    );
    const deletedIds = new Set(toDelete.map((p) => p.id));
    setPhotos((prev) => prev.filter((p) => !deletedIds.has(p.id)));
    const files = pendingUpload.files;
    setPendingUpload(null);
    enqueueFiles(files);
  }

  function resolveSkipDuplicates() {
    if (!pendingUpload) return;
    const dupSet = new Set(pendingUpload.duplicateNames.map((n) => n.toLowerCase()));
    const filtered = pendingUpload.files.filter((f) => !dupSet.has(f.name.toLowerCase()));
    setPendingUpload(null);
    enqueueFiles(filtered);
  }

  function cancelPendingUpload() {
    setPendingUpload(null);
  }

  function retryUpload(index: number) {
    const entry = uploads[index];
    if (entry) uploadOne(entry.file, index);
  }

  function retryAllFailed() {
    const failed = uploads
      .map((entry, i) => ({ file: entry.file, index: i, status: entry.status }))
      .filter((e) => e.status === "error");
    runQueue(failed);
  }

  function clearFinishedUploads() {
    setUploads((prev) => prev.filter((u) => u.status !== "done"));
  }

  const failedCount = uploads.filter((u) => u.status === "error").length;
  const doneCount = uploads.filter((u) => u.status === "done").length;

  async function handleSend(kind: "original" | "edited") {
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/galleries/${gallery.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, selectionDeadline: kind === "original" ? selectionDeadlineInput : undefined }),
      });
      const body = await res.json();
      if (!res.ok) {
        setMessage(body?.error || "전송 실패");
        return;
      }
      setCopyText(body.copyText);
      setMessage("전송되었습니다.");
    } finally {
      setSending(false);
    }
  }

  async function handleBuildZip() {
    setZipBuilding(true);
    setZipMessage(null);
    try {
      const res = await fetch(`/api/admin/galleries/${gallery.id}/build-zip`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setZipMessage(body?.error || "ZIP 생성 실패");
        return;
      }
      setZipInfo({ size: body.zipSize, builtAt: body.zipBuiltAt });
      setZipMessage("ZIP 생성 완료");
    } catch {
      setZipMessage("ZIP 생성 중 오류가 발생했습니다.");
    } finally {
      setZipBuilding(false);
    }
  }

  async function copyToClipboard() {
    if (!copyText) return;
    await navigator.clipboard.writeText(copyText);
    setMessage("클립보드에 복사되었습니다.");
  }

  async function handleExtend() {
    const days = prompt("연장할 일수를 입력하세요 (예: 7)");
    if (!days) return;
    const newExpiry = new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000);
    const res = await fetch(`/api/admin/galleries/${gallery.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresAt: newExpiry.toISOString() }),
    });
    setMessage(res.ok ? "만료일이 연장되었습니다." : "연장 실패");
  }

  async function handleDeletePhoto(photoId: string) {
    if (!confirm("이 사진을 삭제하시겠습니까? 원본 파일도 함께 삭제됩니다.")) return;
    setDeletingPhotoId(photoId);
    try {
      const res = await fetch(`/api/admin/galleries/${gallery.id}/photos/${photoId}`, { method: "DELETE" });
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        setSelectedPhotoIds((prev) => {
          const next = new Set(prev);
          next.delete(photoId);
          return next;
        });
      } else {
        const body = await res.json().catch(() => null);
        setMessage(body?.error || "삭제 실패");
      }
    } finally {
      setDeletingPhotoId(null);
    }
  }

  function togglePhotoSelect(photoId: string) {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  }

  function toggleSelectGroup(groupPhotos: PhotoWithThumb[]) {
    const groupIds = groupPhotos.map((p) => p.id);
    const allSelected = groupIds.length > 0 && groupIds.every((id) => selectedPhotoIds.has(id));
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      groupIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  }

  function selectAllPhotos() {
    setSelectedPhotoIds(new Set(photos.map((p) => p.id)));
  }

  function clearPhotoSelection() {
    setSelectedPhotoIds(new Set());
  }

  async function handleBulkDeleteSelected() {
    if (selectedPhotoIds.size === 0) return;
    if (!confirm(`선택한 ${selectedPhotoIds.size}장을 삭제하시겠습니까? 원본 파일도 함께 삭제됩니다.`)) return;
    setBulkDeleting(true);
    try {
      const ids = Array.from(selectedPhotoIds);
      await Promise.all(ids.map((id) => fetch(`/api/admin/galleries/${gallery.id}/photos/${id}`, { method: "DELETE" })));
      const deletedIds = new Set(ids);
      setPhotos((prev) => prev.filter((p) => !deletedIds.has(p.id)));
      setSelectedPhotoIds(new Set());
      setMessage(`${ids.length}장을 삭제했습니다.`);
    } finally {
      setBulkDeleting(false);
    }
  }

  // 같은 종류(원본/보정본) + 같은 차수 안에서 파일명이 같은 것들을 한 그룹으로 묶는다.
  function getDuplicateGroups(): PhotoWithThumb[][] {
    const map = new Map<string, PhotoWithThumb[]>();
    for (const p of photos) {
      const key = `${p.kind}:${p.revision_round}:${p.filename.toLowerCase()}`;
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
    return Array.from(map.values()).filter((list) => list.length > 1);
  }

  const duplicateGroups = getDuplicateGroups();
  const duplicateExtraCount = duplicateGroups.reduce((sum, g) => sum + g.length - 1, 0);

  async function handleCleanupDuplicates() {
    if (duplicateGroups.length === 0) return;
    const label = dupKeepStrategy === "latest" ? "가장 최근에 올린 사진만" : "가장 처음 올린 사진만";
    if (
      !confirm(
        `중복된 파일명 ${duplicateGroups.length}건에서 ${label} 남기고 나머지 ${duplicateExtraCount}장을 삭제하시겠습니까?`
      )
    )
      return;
    setCleaningDuplicates(true);
    try {
      const toDeleteIds: string[] = [];
      for (const group of duplicateGroups) {
        const sorted = [...group].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const keepId = dupKeepStrategy === "latest" ? sorted[sorted.length - 1].id : sorted[0].id;
        for (const p of sorted) {
          if (p.id !== keepId) toDeleteIds.push(p.id);
        }
      }
      await Promise.all(
        toDeleteIds.map((id) => fetch(`/api/admin/galleries/${gallery.id}/photos/${id}`, { method: "DELETE" }))
      );
      const deletedIds = new Set(toDeleteIds);
      setPhotos((prev) => prev.filter((p) => !deletedIds.has(p.id)));
      setSelectedPhotoIds((prev) => {
        const next = new Set(prev);
        toDeleteIds.forEach((id) => next.delete(id));
        return next;
      });
      setMessage(`중복 사진 ${toDeleteIds.length}장을 정리했습니다.`);
    } finally {
      setCleaningDuplicates(false);
    }
  }

  async function handleDeleteGallery() {
    if (!confirm("갤러리를 삭제하시겠습니까? R2의 사진 파일도 함께 삭제됩니다.")) return;
    const res = await fetch(`/api/admin/galleries/${gallery.id}`, { method: "DELETE" });
    setMessage(res.ok ? "갤러리가 삭제되었습니다." : "삭제 실패");
  }

  const round0 = rounds.find((r) => r.round === 0);
  const round0Items = round0 ? items.filter((i) => i.round_id === round0.id) : [];
  const colorSelected = round0Items;
  const retouchSelected = round0Items.filter((i) => i.retouch);

  function photoFor(photoId: string) {
    return resultPhotos.find((p) => p.id === photoId);
  }

  function toPreviewList(itemList: SelectionItem[]): PreviewPhoto[] {
    return itemList.map((item) => {
      const photo = photoFor(item.photo_id);
      const noteParts = [item.retouch ? "✨ 리터칭 요청" : null, item.memo || null].filter(
        (v): v is string => Boolean(v)
      );
      return {
        id: item.photo_id,
        filename: photo?.filename ?? "",
        thumbUrl: photo?.thumbUrl ?? null,
        note: noteParts.length > 0 ? noteParts.join(" · ") : undefined,
      };
    });
  }

  async function downloadSubset(selItems: SelectionItem[], filename: string, kindLabel: string) {
    if (selItems.length === 0) {
      setMessage("다운로드할 사진이 없습니다.");
      return;
    }
    const photoIds = selItems.map((i) => i.photo_id);
    const res = await fetch(`/api/admin/galleries/${gallery.id}/download-urls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoIds }),
    });
    const body = await res.json();
    if (!res.ok) {
      setMessage(body?.error || "다운로드 실패");
      return;
    }
    const noteLines = [
      `[${kindLabel} 선택 안내]`,
      `촬영 날짜: ${reservation.event_date}`,
      `촬영시간: ${reservation.event_start_time}`,
      `고객이름: ${reservation.subject_name}`,
      `전화번호: ${reservation.phone_primary}${reservation.phone_secondary ? " / " + reservation.phone_secondary : ""}`,
      "",
      "--- 파일별 수정요청사항 ---",
      ...selItems.map((item) => {
        const photo = photoFor(item.photo_id);
        const parts = [item.retouch ? "리터칭 요청" : null, item.memo || null].filter(
          (v): v is string => Boolean(v)
        );
        return `${photo?.filename ?? item.photo_id} : ${parts.length > 0 ? parts.join(" · ") : "(요청사항 없음)"}`;
      }),
    ];
    await downloadPhotosAsZip(body.files, filename, [{ name: "수정요청사항.txt", content: noteLines.join("\n") }]);
  }

  return (
    <div className="max-w-4xl space-y-8 text-adm-text">
      <a href={`/admin/reservations/${reservation.id}`} className="inline-flex items-center gap-1 text-sm text-adm-text-muted hover:text-adm-text">
        ← 예약 상세로
      </a>

      <div>
        <h1 className="adm-h1">{reservation.subject_name} — 갤러리 관리</h1>
        <p className="mt-1 text-sm text-adm-text-muted">
          /g/{gallery.slug} · 비밀번호(연락처 뒤 4자리) · 만료: {new Date(gallery.expires_at).toLocaleString("ko-KR")} · 상태:{" "}
          {RESERVATION_STATUS_LABELS[reservation.status]}
        </p>
      </div>

      {message && <p className="rounded-md bg-adm-surface-2 p-3 text-sm text-adm-text-muted">{message}</p>}

      <CollapsiblePanel title="사진 업로드 (JPG만 허용)" defaultOpen={false}>
        <div className="flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-1">
            <input type="radio" checked={uploadKind === "original"} onChange={() => setUploadKind("original")} />
            원본
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" checked={uploadKind === "edited"} onChange={() => setUploadKind("edited")} />
            보정본
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" checked={uploadKind === "sample"} onChange={() => setUploadKind("sample")} />
            샘플 (참고/SNS용)
          </label>
          {uploadKind === "edited" && (
            <label className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap">
              차수:
              <select
                className={inputClass + " w-auto"}
                value={revisionRound}
                onChange={(e) => setRevisionRound(Number(e.target.value))}
              >
                <option value={0}>1차 보정본</option>
                <option value={1}>재수정1 결과</option>
                <option value={2}>재수정2 결과</option>
              </select>
            </label>
          )}
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-lg border-2 border-dashed border-adm-border-strong p-8 text-center text-sm text-adm-text-faint"
        >
          클릭하거나 파일을 드래그해서 업로드하세요
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {pendingUpload && (
          <div className="rounded-md border border-adm-border-strong bg-adm-surface-2 p-3 text-sm">
            <p className="mb-2">
              선택한 파일 중 <strong>{pendingUpload.duplicateNames.length}개</strong>가 이미 업로드된 파일명과 같습니다. 어떻게 처리할까요?
            </p>
            <ul className="mb-2 max-h-24 space-y-0.5 overflow-y-auto text-xs text-adm-text-muted">
              {pendingUpload.duplicateNames.map((n) => (
                <li key={n} className="truncate">
                  {n}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={resolveOverwrite} className="adm-btn-primary rounded-md px-3 py-1.5 text-xs">
                기존 사진 덮어쓰기
              </button>
              <button type="button" onClick={resolveSkipDuplicates} className="adm-btn-secondary rounded-md px-3 py-1.5 text-xs">
                중복 건너뛰고 나머지만 업로드
              </button>
              <button
                type="button"
                onClick={cancelPendingUpload}
                className="rounded-md border border-adm-border-strong px-3 py-1.5 text-xs text-adm-text-muted"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {uploads.length > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-adm-text-muted">
              <span>
                전체 {uploads.length}개 · 완료 {doneCount}개{failedCount > 0 && <span className="text-[#e08a8a]"> · 실패 {failedCount}개</span>}
              </span>
              <div className="flex gap-2">
                {failedCount > 0 && (
                  <button type="button" onClick={retryAllFailed} className="adm-btn-secondary rounded-md px-2 py-1">
                    실패 {failedCount}개 전체 재시도
                  </button>
                )}
                {doneCount > 0 && (
                  <button type="button" onClick={clearFinishedUploads} className="adm-btn-secondary rounded-md px-2 py-1">
                    완료 항목 목록에서 지우기
                  </button>
                )}
              </div>
            </div>
            <ul className="max-h-80 space-y-1 overflow-y-auto text-xs">
              {uploads.map((u, i) => (
                <li key={i} className="flex items-center justify-between rounded bg-adm-surface-2 px-2 py-1">
                  <span className="truncate">{u.file.name}</span>
                  <span className="flex flex-shrink-0 items-center gap-2">
                    <span className={u.status === "error" ? "text-[#e08a8a]" : "text-adm-text-muted"}>{u.message}</span>
                    {u.status === "error" && (
                      <button type="button" onClick={() => retryUpload(i)} className="text-adm-accent-soft underline">
                        재시도
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="text-xs text-adm-text-faint">
          원본 {originalPhotos.length}장 · 보정본 {editedPhotos.length}장 · 샘플 {samplePhotos.length}장
        </p>
      </CollapsiblePanel>

      <CollapsiblePanel title="업로드된 사진 확인/관리" defaultOpen={false}>
        <p className="text-xs text-adm-text-faint">
          실제로 저장된 사진만 여기 표시됩니다. 업로드 중 화면이 꺼지거나 창이 닫혀도, 여기에 보이는 사진은 이미 안전하게 저장된 것입니다. 아래 영역은 오른쪽 하단을 드래그해서 크기를 조절할 수 있습니다.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-adm-text-muted">
            선택됨 {selectedPhotoIds.size}장 / 전체 {photos.length}장
          </span>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={selectAllPhotos} className="adm-btn-secondary rounded-md px-2 py-1">
              전체 선택
            </button>
            <button type="button" onClick={clearPhotoSelection} className="adm-btn-secondary rounded-md px-2 py-1">
              선택 해제
            </button>
            <button
              type="button"
              onClick={handleBulkDeleteSelected}
              disabled={selectedPhotoIds.size === 0 || bulkDeleting}
              style={{ borderColor: "rgba(224,138,138,0.4)", color: "#e08a8a" }}
              className="rounded-md border px-2 py-1 disabled:opacity-50"
            >
              선택 삭제 ({selectedPhotoIds.size})
            </button>
          </div>
        </div>

        {duplicateGroups.length > 0 && (
          <div className="rounded-md border border-adm-border-strong bg-adm-surface-2 p-3 text-sm">
            <p className="mb-2">
              같은 파일명이 중복 업로드된 항목이 <strong>{duplicateGroups.length}건</strong> 있습니다 (정리하면 {duplicateExtraCount}장 삭제됩니다).
            </p>
            <div className="mb-2 flex flex-wrap items-center gap-3 text-xs">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={dupKeepStrategy === "latest"}
                  onChange={() => setDupKeepStrategy("latest")}
                />
                가장 최근에 올린 사진 남기기
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={dupKeepStrategy === "first"}
                  onChange={() => setDupKeepStrategy("first")}
                />
                가장 처음 올린 사진 남기기
              </label>
            </div>
            <button
              type="button"
              onClick={handleCleanupDuplicates}
              disabled={cleaningDuplicates}
              className="adm-btn-primary rounded-md px-3 py-1.5 text-xs disabled:opacity-50"
            >
              중복 정리 실행
            </button>
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-adm-text-muted">원본 ({originalPhotos.length}장)</p>
            {originalPhotos.length > 0 && (
              <button
                type="button"
                onClick={() => toggleSelectGroup(originalPhotos)}
                className="text-xs text-adm-accent-soft underline"
              >
                {originalPhotos.every((p) => selectedPhotoIds.has(p.id)) ? "그룹 선택 해제" : "그룹 전체 선택"}
              </button>
            )}
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleBuildZip}
              disabled={zipBuilding || originalPhotos.length === 0}
              className="adm-btn-secondary rounded-md px-3 py-1.5 text-xs disabled:opacity-50"
            >
              {zipBuilding ? "ZIP 생성 중..." : zipInfo.builtAt ? "ZIP 다시 생성" : "ZIP 생성 (고객 다운로드용)"}
            </button>
            {zipInfo.builtAt && (
              <span className="text-xs text-adm-text-faint">
                마지막 생성: {new Date(zipInfo.builtAt).toLocaleString("ko-KR")}
                {zipInfo.size != null && ` · ${formatBytes(zipInfo.size)}`}
              </span>
            )}
            {zipMessage && <span className="text-xs text-adm-accent-soft">{zipMessage}</span>}
          </div>
          {originalPhotos.length === 0 ? (
            <p className="text-xs text-adm-text-faint">아직 업로드된 원본이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {originalPhotos.map((p, idx) => (
                <div key={p.id} className="relative aspect-square overflow-hidden rounded bg-adm-surface-2">
                  {p.thumbUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.thumbUrl}
                      alt={p.filename}
                      onClick={() => openPreview(originalPhotos, idx)}
                      className="h-full w-full cursor-pointer object-cover"
                    />
                  )}
                  <label className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded bg-black/60">
                    <input
                      type="checkbox"
                      checked={selectedPhotoIds.has(p.id)}
                      onChange={() => togglePhotoSelect(p.id)}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(p.id)}
                    disabled={deletingPhotoId === p.id}
                    className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white disabled:opacity-50"
                  >
                    삭제
                  </button>
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 text-[10px] text-white">
                    {p.filename}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-adm-text-muted">샘플 — 참고/SNS용 ({samplePhotos.length}장)</p>
            {samplePhotos.length > 0 && (
              <button
                type="button"
                onClick={() => toggleSelectGroup(samplePhotos)}
                className="text-xs text-adm-accent-soft underline"
              >
                {samplePhotos.every((p) => selectedPhotoIds.has(p.id)) ? "그룹 선택 해제" : "그룹 전체 선택"}
              </button>
            )}
          </div>
          {samplePhotos.length === 0 ? (
            <p className="text-xs text-adm-text-faint">아직 업로드된 샘플사진이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {samplePhotos.map((p, idx) => (
                <div key={p.id} className="relative aspect-square overflow-hidden rounded bg-adm-surface-2">
                  {p.thumbUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.thumbUrl}
                      alt={p.filename}
                      onClick={() => openPreview(samplePhotos, idx)}
                      className="h-full w-full cursor-pointer object-cover"
                    />
                  )}
                  <label className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded bg-black/60">
                    <input
                      type="checkbox"
                      checked={selectedPhotoIds.has(p.id)}
                      onChange={() => togglePhotoSelect(p.id)}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(p.id)}
                    disabled={deletingPhotoId === p.id}
                    className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white disabled:opacity-50"
                  >
                    삭제
                  </button>
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 text-[10px] text-white">
                    {p.filename}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {[0, 1, 2].map((round) => {
          const roundPhotos = editedPhotos.filter((p) => p.revision_round === round);
          if (roundPhotos.length === 0) return null;
          const label = round === 0 ? "1차 보정본" : `재수정${round} 결과`;
          return (
            <div key={round}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-adm-text-muted">
                  {label} ({roundPhotos.length}장)
                </p>
                <button
                  type="button"
                  onClick={() => toggleSelectGroup(roundPhotos)}
                  className="text-xs text-adm-accent-soft underline"
                >
                  {roundPhotos.every((p) => selectedPhotoIds.has(p.id)) ? "그룹 선택 해제" : "그룹 전체 선택"}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {roundPhotos.map((p, idx) => (
                  <div key={p.id} className="relative aspect-square overflow-hidden rounded bg-adm-surface-2">
                    {p.thumbUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.thumbUrl}
                        alt={p.filename}
                        onClick={() => openPreview(roundPhotos, idx)}
                        className="h-full w-full cursor-pointer object-cover"
                      />
                    )}
                    <label className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded bg-black/60">
                      <input
                        type="checkbox"
                        checked={selectedPhotoIds.has(p.id)}
                        onChange={() => togglePhotoSelect(p.id)}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(p.id)}
                      disabled={deletingPhotoId === p.id}
                      className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white disabled:opacity-50"
                    >
                      삭제
                    </button>
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 text-[10px] text-white">
                      {p.filename}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CollapsiblePanel>

      <CollapsiblePanel title="셀렉 결과">
        <p className="text-sm text-adm-text-muted">
          색상보정 {colorSelected.length}장 · 리터칭 {retouchSelected.length}장
          {round0?.overall_memo && <> · 전체 요청사항: {round0.overall_memo}</>}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              downloadSubset(colorSelected, `${sanitizeFilename(reservation.subject_name)}_색상보정.zip`, "색상보정")
            }
            className="adm-btn-secondary rounded-md px-3 py-1.5 text-xs"
          >
            색상보정 선택본 ZIP
          </button>
          <button
            type="button"
            onClick={() =>
              downloadSubset(retouchSelected, `${sanitizeFilename(reservation.subject_name)}_리터칭.zip`, "리터칭")
            }
            className="adm-btn-secondary rounded-md px-3 py-1.5 text-xs"
          >
            리터칭 선택본 ZIP
          </button>
        </div>
        <p className="text-xs text-adm-text-faint">
          미리보기(저용량) 파일로 빠르게 받습니다. 파일명은 업로드했던 원본 파일명 그대로이며, 실제 보정은 갖고 계신 RAW 파일로 진행하시면 됩니다.
        </p>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {colorSelected.map((item, idx) => {
            const photo = photoFor(item.photo_id);
            return (
              <div key={item.id} className="space-y-1">
                <div className="relative aspect-square overflow-hidden rounded bg-adm-surface-2">
                  {photo?.thumbUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo.thumbUrl}
                      alt={photo.filename ?? ""}
                      onClick={() => openPreview(toPreviewList(colorSelected), idx)}
                      className="h-full w-full cursor-pointer object-cover"
                    />
                  )}
                  {item.retouch && (
                    <span className="absolute right-1 top-1 rounded-full bg-amber-400 px-1.5 text-xs text-white">✨</span>
                  )}
                </div>
                <p className="truncate text-[10px] text-adm-text-muted">{photo?.filename}</p>
                {item.memo && <p className="truncate text-[10px] text-adm-accent-soft">{item.memo}</p>}
              </div>
            );
          })}
        </div>

        {rounds
          .filter((r) => r.round >= 1)
          .map((r) => {
            const roundItems = items.filter((i) => i.round_id === r.id);
            return (
              <div key={r.id} className="space-y-2 border-t border-adm-border pt-3">
                <p className="text-sm font-medium">재수정{r.round} 요청 ({roundItems.length}장)</p>
                {r.overall_memo && <p className="text-xs text-adm-text-muted">전체 요청사항: {r.overall_memo}</p>}
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {roundItems.map((item, idx) => {
                    const photo = photoFor(item.photo_id);
                    return (
                      <div key={item.id} className="space-y-1">
                        <div className="relative aspect-square overflow-hidden rounded bg-adm-surface-2">
                          {photo?.thumbUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photo.thumbUrl}
                              alt={photo.filename ?? ""}
                              onClick={() => openPreview(toPreviewList(roundItems), idx)}
                              className="h-full w-full cursor-pointer object-cover"
                            />
                          )}
                        </div>
                        <p className="truncate text-[10px] text-adm-text-muted">{photo?.filename}</p>
                        {item.memo && <p className="truncate text-[10px] text-adm-accent-soft">{item.memo}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </CollapsiblePanel>

      <CollapsiblePanel title="고객에게 전송" defaultOpen={false}>
        <label className="block text-sm text-adm-text-muted">
          셀렉 마감일
          <input
            type="date"
            className={inputClass}
            value={selectionDeadlineInput}
            onChange={(e) => setSelectionDeadlineInput(e.target.value)}
          />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={sending || originalPhotos.length === 0}
            onClick={() => handleSend("original")}
            className="adm-btn-primary rounded-md px-3 py-2 text-sm"
          >
            원본 전송
          </button>
          <button
            type="button"
            disabled={sending || editedPhotos.length === 0}
            onClick={() => handleSend("edited")}
            className="adm-btn-secondary rounded-md px-3 py-2 text-sm disabled:opacity-50"
          >
            보정본 전송
          </button>
        </div>
        {copyText && (
          <div className="rounded-md bg-adm-surface-2 p-3 text-xs text-adm-text-muted">
            <pre className="whitespace-pre-wrap">{copyText}</pre>
            <button type="button" onClick={copyToClipboard} className="adm-btn-primary mt-2 rounded-md px-2 py-1">
              안내문+링크 복사
            </button>
          </div>
        )}
      </CollapsiblePanel>

      <section className="flex gap-2">
        <button type="button" onClick={handleExtend} className="adm-btn-secondary rounded-md px-3 py-1.5 text-sm">
          만료일 연장
        </button>
        <button
          type="button"
          onClick={handleDeleteGallery}
          style={{ borderColor: "rgba(224,138,138,0.4)", color: "#e08a8a" }}
          className="rounded-md border px-3 py-1.5 text-sm"
        >
          갤러리 삭제
        </button>
      </section>

      {previewState && previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/90 p-4"
          onClick={closePreview}
        >
          <p className="max-w-full truncate text-sm text-white">
            {previewPhoto.filename}
            {previewState.list.length > 1 && ` (${previewState.index + 1} / ${previewState.list.length})`}
          </p>
          <div className="relative flex max-h-[85vh] max-w-full items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {previewState.list.length > 1 && (
              <button
                type="button"
                onClick={showPrevPreview}
                aria-label="이전 사진"
                className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-xl text-white"
              >
                ‹
              </button>
            )}
            {previewPhoto.thumbUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewPhoto.thumbUrl}
                alt={previewPhoto.filename}
                className="max-h-[85vh] max-w-full object-contain"
              />
            )}
            {previewState.list.length > 1 && (
              <button
                type="button"
                onClick={showNextPreview}
                aria-label="다음 사진"
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-xl text-white"
              >
                ›
              </button>
            )}
          </div>
          {previewPhoto.note && (
            <p
              className="max-w-lg rounded-md bg-adm-surface-2 px-3 py-2 text-center text-sm text-adm-text"
              onClick={(e) => e.stopPropagation()}
            >
              {previewPhoto.note}
            </p>
          )}
          <button type="button" onClick={closePreview} className="adm-btn-secondary rounded-md px-4 py-2 text-sm">
            닫기
          </button>
        </div>
      )}
    </div>
  );
}
