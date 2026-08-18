"use client";

import { useEffect, useMemo, useState } from "react";
import { PhotoGrid, type GridPhoto } from "./PhotoGrid";
import { PhotoLightbox } from "./PhotoLightbox";
import { OriginalSelectionPanel, ReeditPanel } from "./SelectionPanel";
import { downloadPhotosAsZip } from "@/lib/zip-download";

interface ApiPhoto {
  id: string;
  kind: "original" | "edited" | "sample";
  revision_round: number;
  filename: string;
  thumbUrl: string | null;
  sns_public: boolean;
}

interface ApiRound {
  id: string;
  round: number;
  overall_memo: string | null;
  submitted_at: string | null;
}

interface ApiItem {
  id: string;
  round_id: string;
  photo_id: string;
  retouch: boolean;
  memo: string | null;
}

interface ApiData {
  gallery: { slug: string; expiresAt: string; selectionDeadline: string; status: string; zipReady: boolean };
  photos: ApiPhoto[];
  rounds: ApiRound[];
  items: ApiItem[];
  limits: { color: number; retouch: number; maxRetouchRounds: number };
}

interface SelectionState {
  heart: boolean;
  sparkle: boolean;
  memo: string;
}

export function GalleryView({ slug, studioName }: { slug: string; studioName: string }) {
  const [data, setData] = useState<ApiData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"original" | "edited" | "sample">("original");
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [selections, setSelections] = useState<Record<string, SelectionState>>({});
  const [overallMemo, setOverallMemo] = useState("");
  const [reeditSelections, setReeditSelections] = useState<Record<string, SelectionState>>({});
  const [reeditMemo, setReeditMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [snsPrivateIds, setSnsPrivateIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/gallery/${slug}/data`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || "갤러리를 불러오지 못했습니다.");
        }
        return res.json();
      })
      .then((json: ApiData) => {
        setData(json);
        const hasOriginals = json.photos.some((p) => p.kind === "original");
        const hasEdited = json.photos.some((p) => p.kind === "edited");
        if (!hasOriginals && hasEdited) setTab("edited");
        const round0 = json.rounds.find((r) => r.round === 0);
        const round0Items = round0 ? json.items.filter((i) => i.round_id === round0.id) : [];
        const initial: Record<string, SelectionState> = {};
        for (const item of round0Items) {
          initial[item.photo_id] = { heart: true, sparkle: item.retouch, memo: item.memo ?? "" };
        }
        setSelections(initial);
        setOverallMemo(round0?.overall_memo ?? "");
        setSnsPrivateIds(new Set(json.photos.filter((p) => !p.sns_public).map((p) => p.id)));
      })
      .catch((e) => setError(e.message));
  }, [slug]);

  const originalPhotos = useMemo(
    () => (data?.photos ?? []).filter((p) => p.kind === "original"),
    [data]
  );
  const editedPhotos = useMemo(() => (data?.photos ?? []).filter((p) => p.kind === "edited"), [data]);
  const samplePhotos = useMemo(() => (data?.photos ?? []).filter((p) => p.kind === "sample"), [data]);

  const latestEditedRound = useMemo(() => {
    if (editedPhotos.length === 0) return null;
    return Math.max(...editedPhotos.map((p) => p.revision_round));
  }, [editedPhotos]);

  const currentEditedPhotos = useMemo(
    () => (latestEditedRound === null ? [] : editedPhotos.filter((p) => p.revision_round === latestEditedRound)),
    [editedPhotos, latestEditedRound]
  );

  const reeditRoundNumber = latestEditedRound === null ? null : latestEditedRound + 1;

  const submittedReeditCount = useMemo(
    () => (data?.rounds ?? []).filter((r) => r.round >= 1 && r.submitted_at).length,
    [data]
  );
  const maxRetouchRounds = data?.limits.maxRetouchRounds ?? 2;
  const remainingRounds = Math.max(0, maxRetouchRounds - submittedReeditCount);

  useEffect(() => {
    if (!data || reeditRoundNumber === null) return;
    const round = data.rounds.find((r) => r.round === reeditRoundNumber);
    const roundItems = round ? data.items.filter((i) => i.round_id === round.id) : [];
    const initial: Record<string, SelectionState> = {};
    for (const item of roundItems) {
      initial[item.photo_id] = { heart: true, sparkle: item.retouch, memo: item.memo ?? "" };
    }
    setReeditSelections(initial);
    setReeditMemo(round?.overall_memo ?? "");
  }, [data, reeditRoundNumber]);

  function toGridPhotos(photos: ApiPhoto[], sel: Record<string, SelectionState>, kind: "select" | "flag"): GridPhoto[] {
    return photos.map((p) => ({
      id: p.id,
      filename: p.filename,
      thumbUrl: p.thumbUrl,
      heart: kind === "select" ? Boolean(sel[p.id]?.heart) : undefined,
      sparkle: kind === "select" ? Boolean(sel[p.id]?.sparkle) : undefined,
      flagged: kind === "flag" ? Boolean(sel[p.id]?.heart) : undefined,
    }));
  }

  const originalGridPhotos = toGridPhotos(originalPhotos, selections, "select");
  const editedGridPhotos = toGridPhotos(currentEditedPhotos, reeditSelections, "flag").map((g) => ({
    ...g,
    snsPublic: !snsPrivateIds.has(g.id),
  }));
  const sampleGridPhotos = toGridPhotos(samplePhotos, {}, "flag");

  async function updateSnsVisibility(photoIds: string[], isPublic: boolean) {
    setSnsPrivateIds((prev) => {
      const next = new Set(prev);
      photoIds.forEach((id) => (isPublic ? next.delete(id) : next.add(id)));
      return next;
    });
    try {
      await fetch(`/api/gallery/${slug}/photos/sns-visibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds, public: isPublic }),
      });
    } catch {
      // 네트워크 오류는 조용히 무시 — 화면은 이미 낙관적으로 갱신됨
    }
  }

  function toggleSnsPublic(id: string) {
    updateSnsVisibility([id], snsPrivateIds.has(id));
  }

  function setAllSnsPublic(isPublic: boolean) {
    updateSnsVisibility(
      currentEditedPhotos.map((p) => p.id),
      isPublic
    );
  }

  const colorCount = Object.values(selections).filter((s) => s.heart).length;
  const retouchCount = Object.values(selections).filter((s) => s.heart && s.sparkle).length;

  function toggleHeart(id: string) {
    setSelections((prev) => {
      const cur = prev[id] ?? { heart: false, sparkle: false, memo: "" };
      if (cur.heart && colorCount >= 1) {
        return { ...prev, [id]: { ...cur, heart: false, sparkle: false } };
      }
      if (!cur.heart && colorCount >= (data?.limits.color ?? 50)) {
        setBanner(`색상보정은 최대 ${data?.limits.color}장까지 선택 가능합니다.`);
        return prev;
      }
      return { ...prev, [id]: { ...cur, heart: !cur.heart, sparkle: cur.heart ? false : cur.sparkle } };
    });
  }

  function toggleSparkle(id: string) {
    setSelections((prev) => {
      const cur = prev[id];
      if (!cur?.heart) return prev;
      if (!cur.sparkle && retouchCount >= (data?.limits.retouch ?? 15)) {
        setBanner(`리터칭은 최대 ${data?.limits.retouch}장까지 선택 가능합니다.`);
        return prev;
      }
      return { ...prev, [id]: { ...cur, sparkle: !cur.sparkle } };
    });
  }

  function updateMemo(id: string, memo: string) {
    setSelections((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { heart: false, sparkle: false }), memo } }));
  }

  function toggleFlag(id: string) {
    setReeditSelections((prev) => {
      const cur = prev[id] ?? { heart: false, sparkle: false, memo: "" };
      return { ...prev, [id]: { ...cur, heart: !cur.heart } };
    });
  }

  function updateReeditMemo(id: string, memo: string) {
    setReeditSelections((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { heart: false, sparkle: false }), memo } }));
  }

  async function submitOriginalSelection() {
    setSubmitting(true);
    setBanner(null);
    try {
      const items = Object.entries(selections)
        .filter(([, s]) => s.heart)
        .map(([photoId, s]) => ({ photoId, retouch: s.sparkle, memo: s.memo }));

      const res = await fetch(`/api/gallery/${slug}/selection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ round: 0, overallMemo, items }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setBanner(body?.error || "제출 중 오류가 발생했습니다.");
        return;
      }
      setBanner("셀렉이 제출되었습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReedit() {
    if (reeditRoundNumber === null) return;
    setSubmitting(true);
    setBanner(null);
    try {
      const items = Object.entries(reeditSelections)
        .filter(([, s]) => s.heart)
        .map(([photoId, s]) => ({ photoId, retouch: true, memo: s.memo }));

      const res = await fetch(`/api/gallery/${slug}/selection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ round: reeditRoundNumber, overallMemo: reeditMemo, items }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setBanner(body?.error || "제출 중 오류가 발생했습니다.");
        return;
      }
      setBanner("재수정 요청이 제출되었습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function downloadAll(photos: ApiPhoto[]) {
    if (tab === "original" && data?.gallery.zipReady) {
      setBanner("다운로드 준비 중...");
      try {
        const res = await fetch(`/api/gallery/${slug}/zip-url`);
        const body = await res.json();
        if (!res.ok) {
          setBanner(body?.error || "다운로드 실패");
          return;
        }
        window.location.href = body.url;
        setBanner(null);
      } catch {
        setBanner("다운로드 중 오류가 발생했습니다.");
      }
      return;
    }

    setBanner("다운로드 준비 중...");
    try {
      const res = await fetch(`/api/gallery/${slug}/download-urls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds: photos.map((p) => p.id) }),
      });
      const body = await res.json();
      if (!res.ok) {
        setBanner(body?.error || "다운로드 실패");
        return;
      }
      await downloadPhotosAsZip(body.files, `${studioName}-photos.zip`);
      setBanner(null);
    } catch {
      setBanner("다운로드 중 오류가 발생했습니다.");
    }
  }

  async function downloadOne(id: string) {
    const res = await fetch(`/api/gallery/${slug}/photos/${id}/url?type=original`);
    const body = await res.json();
    if (res.ok) window.open(body.url, "_blank");
  }

  async function handleLogout() {
    await fetch(`/api/gallery/${slug}/auth`, { method: "DELETE" });
    window.location.reload();
  }

  if (error) {
    return <div className="mx-auto max-w-lg bg-bg px-4 py-24 text-center text-sm text-[#e08a8a]">{error}</div>;
  }

  if (!data) {
    return <div className="mx-auto max-w-lg bg-bg px-4 py-24 text-center text-sm text-text-muted">불러오는 중...</div>;
  }

  const activeList = tab === "original" ? originalGridPhotos : tab === "edited" ? editedGridPhotos : sampleGridPhotos;
  const activeApiList = tab === "original" ? originalPhotos : tab === "edited" ? currentEditedPhotos : samplePhotos;
  const selectedCount = activeList.filter((p) => (tab === "original" ? p.heart : tab === "edited" ? p.flagged : false)).length;
  const displayedList =
    showOnlySelected && tab !== "sample"
      ? activeList.filter((p) => (tab === "original" ? p.heart : p.flagged))
      : activeList;

  return (
    <div className="mx-auto max-w-6xl bg-bg px-4 py-6 text-text">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">{studioName} 갤러리</h1>
        <div className="flex gap-2">
          <button type="button" onClick={() => downloadAll(activeApiList)} className="jp-btn-secondary rounded-md px-3 py-1.5 text-xs">
            전체 ZIP 다운로드
          </button>
          <button type="button" onClick={handleLogout} className="jp-btn-secondary rounded-md px-3 py-1.5 text-xs">
            로그아웃
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex gap-2">
          {originalPhotos.length > 0 && (
            <button
              type="button"
              onClick={() => setTab("original")}
              className={`rounded-full px-4 py-1.5 ${tab === "original" ? "bg-accent text-white" : "bg-surface-2 text-text-muted"}`}
            >
              원본
            </button>
          )}
          {editedPhotos.length > 0 && (
            <button
              type="button"
              onClick={() => setTab("edited")}
              className={`rounded-full px-4 py-1.5 ${tab === "edited" ? "bg-accent text-white" : "bg-surface-2 text-text-muted"}`}
            >
              보정본
            </button>
          )}
          {samplePhotos.length > 0 && (
            <button
              type="button"
              onClick={() => setTab("sample")}
              className={`rounded-full px-4 py-1.5 ${tab === "sample" ? "bg-accent text-white" : "bg-surface-2 text-text-muted"}`}
            >
              샘플
            </button>
          )}
        </div>
        {tab !== "sample" && (
          <button
            type="button"
            onClick={() => setShowOnlySelected((v) => !v)}
            className={`rounded-full px-4 py-1.5 text-xs ${
              showOnlySelected ? "bg-rose-500 text-white" : "bg-surface-2 text-text-muted"
            }`}
          >
            ♥ 선택한 사진만 보기 ({selectedCount})
          </button>
        )}
      </div>

      {tab === "sample" && (
        <p className="mb-4 rounded-md bg-surface-2 p-3 text-xs text-text-muted">
          📎 참고 및 SNS 업로드용 샘플 사진입니다. 자유롭게 다운로드해서 사용하세요.
        </p>
      )}

      {banner && <p className="jp-card mb-4 rounded-md p-3 text-sm text-text-muted">{banner}</p>}

      {tab === "original" && (
        <OriginalSelectionPanel
          colorCount={colorCount}
          colorLimit={data.limits.color}
          retouchCount={retouchCount}
          retouchLimit={data.limits.retouch}
          deadline={data.gallery.selectionDeadline}
          overallMemo={overallMemo}
          onOverallMemoChange={setOverallMemo}
          onSubmit={submitOriginalSelection}
          submitting={submitting}
          submitLabel="셀렉 완료"
        />
      )}

      {tab === "edited" && reeditRoundNumber !== null && (
        <ReeditPanel
          remaining={remainingRounds}
          max={maxRetouchRounds}
          overallMemo={reeditMemo}
          onOverallMemoChange={setReeditMemo}
          onSubmit={submitReedit}
          submitting={submitting}
        />
      )}

      {tab === "edited" && currentEditedPhotos.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface-2 p-3 text-xs">
          <span className="text-text-muted">
            🌐 SNS 공개 가능 {currentEditedPhotos.length - snsPrivateIds.size}장 / 전체 {currentEditedPhotos.length}장 (기본은
            전체 공개 가능이며, 원하지 않으면 사진별로 또는 전체를 비공개로 바꿀 수 있습니다)
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setAllSnsPublic(true)} className="jp-btn-secondary rounded-md px-3 py-1.5">
              전체 공개로 설정
            </button>
            <button type="button" onClick={() => setAllSnsPublic(false)} className="jp-btn-secondary rounded-md px-3 py-1.5">
              전체 비공개로 설정
            </button>
          </div>
        </div>
      )}

      <div className="mt-4">
        <PhotoGrid
          photos={displayedList}
          mode={tab === "original" ? "select" : tab === "edited" && remainingRounds > 0 ? "flag" : "view"}
          onOpen={setLightboxIndex}
          onToggleHeart={toggleHeart}
          onToggleSparkle={toggleSparkle}
          onToggleFlag={toggleFlag}
          onToggleSnsPublic={toggleSnsPublic}
        />
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={displayedList}
          index={lightboxIndex}
          mode={tab === "original" ? "select" : tab === "edited" && remainingRounds > 0 ? "flag" : "view"}
          memo={
            tab === "original"
              ? selections[displayedList[lightboxIndex].id]?.memo ?? ""
              : reeditSelections[displayedList[lightboxIndex].id]?.memo ?? ""
          }
          onMemoChange={(v) =>
            tab === "original"
              ? updateMemo(displayedList[lightboxIndex].id, v)
              : updateReeditMemo(displayedList[lightboxIndex].id, v)
          }
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
          onToggleHeart={toggleHeart}
          onToggleSparkle={toggleSparkle}
          onToggleFlag={toggleFlag}
          onToggleSnsPublic={toggleSnsPublic}
          onDownload={downloadOne}
        />
      )}
    </div>
  );
}
