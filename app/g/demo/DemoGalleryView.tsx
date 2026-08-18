"use client";

import { useMemo, useState } from "react";
import { PhotoGrid, type GridPhoto } from "../[slug]/PhotoGrid";
import { PhotoLightbox } from "../[slug]/PhotoLightbox";
import { OriginalSelectionPanel, ReeditPanel } from "../[slug]/SelectionPanel";
import { DEFAULT_STUDIO_PROFILE } from "@/lib/studio-profile";

interface MockPhoto {
  id: string;
  kind: "original" | "edited";
  revision_round: number;
  filename: string;
  thumbUrl: string;
}

function buildMockPhotos(): MockPhoto[] {
  const originals: MockPhoto[] = Array.from({ length: 14 }, (_, i) => ({
    id: `orig-${i}`,
    kind: "original",
    revision_round: 0,
    filename: `IMG_${1000 + i}.jpg`,
    thumbUrl: `https://picsum.photos/seed/jaypapa-original-${i}/600/600`,
  }));
  const edited: MockPhoto[] = Array.from({ length: 6 }, (_, i) => ({
    id: `edit-${i}`,
    kind: "edited",
    revision_round: 0,
    filename: `EDIT_${1000 + i}.jpg`,
    thumbUrl: `https://picsum.photos/seed/jaypapa-edited-${i}/600/600`,
  }));
  return [...originals, ...edited];
}

interface SelectionState {
  heart: boolean;
  sparkle: boolean;
  memo: string;
}

export function DemoGalleryView() {
  const photos = useMemo(buildMockPhotos, []);
  const [tab, setTab] = useState<"original" | "edited">("original");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [selections, setSelections] = useState<Record<string, SelectionState>>({});
  const [overallMemo, setOverallMemo] = useState("");
  const [reeditSelections, setReeditSelections] = useState<Record<string, SelectionState>>({});
  const [reeditMemo, setReeditMemo] = useState("");
  const [banner, setBanner] = useState<string | null>(
    "이 페이지는 데모입니다 — 실제 셀렉/다운로드는 저장되지 않습니다."
  );

  const originalPhotos = photos.filter((p) => p.kind === "original");
  const editedPhotos = photos.filter((p) => p.kind === "edited");
  const remainingRounds = DEFAULT_STUDIO_PROFILE.maxRetouchRounds;

  function toGridPhotos(list: MockPhoto[], sel: Record<string, SelectionState>, kind: "select" | "flag"): GridPhoto[] {
    return list.map((p) => ({
      id: p.id,
      filename: p.filename,
      thumbUrl: p.thumbUrl,
      heart: kind === "select" ? Boolean(sel[p.id]?.heart) : undefined,
      sparkle: kind === "select" ? Boolean(sel[p.id]?.sparkle) : undefined,
      flagged: kind === "flag" ? Boolean(sel[p.id]?.heart) : undefined,
    }));
  }

  const originalGridPhotos = toGridPhotos(originalPhotos, selections, "select");
  const editedGridPhotos = toGridPhotos(editedPhotos, reeditSelections, "flag");

  const colorCount = Object.values(selections).filter((s) => s.heart).length;
  const retouchCount = Object.values(selections).filter((s) => s.heart && s.sparkle).length;

  function toggleHeart(id: string) {
    setSelections((prev) => {
      const cur = prev[id] ?? { heart: false, sparkle: false, memo: "" };
      if (cur.heart) return { ...prev, [id]: { ...cur, heart: false, sparkle: false } };
      if (colorCount >= DEFAULT_STUDIO_PROFILE.selectionLimitColor) {
        setBanner(`색상보정은 최대 ${DEFAULT_STUDIO_PROFILE.selectionLimitColor}장까지 선택 가능합니다.`);
        return prev;
      }
      return { ...prev, [id]: { ...cur, heart: true } };
    });
  }

  function toggleSparkle(id: string) {
    setSelections((prev) => {
      const cur = prev[id];
      if (!cur?.heart) return prev;
      if (!cur.sparkle && retouchCount >= DEFAULT_STUDIO_PROFILE.selectionLimitRetouch) {
        setBanner(`리터칭은 최대 ${DEFAULT_STUDIO_PROFILE.selectionLimitRetouch}장까지 선택 가능합니다.`);
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

  const activeList = tab === "original" ? originalGridPhotos : editedGridPhotos;

  return (
    <div className="mx-auto max-w-6xl bg-bg px-4 py-6 text-text">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">{DEFAULT_STUDIO_PROFILE.studioName} 갤러리 (데모)</h1>
        <button
          type="button"
          onClick={() => setBanner("데모에서는 다운로드가 비활성화되어 있습니다. 실제 배포본에서는 ZIP으로 받아집니다.")}
          className="jp-btn-secondary rounded-md px-3 py-1.5 text-xs"
        >
          전체 ZIP 다운로드
        </button>
      </div>

      <div className="mb-4 flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setTab("original")}
          className={`rounded-full px-4 py-1.5 ${tab === "original" ? "bg-accent text-white" : "bg-surface-2 text-text-muted"}`}
        >
          원본
        </button>
        <button
          type="button"
          onClick={() => setTab("edited")}
          className={`rounded-full px-4 py-1.5 ${tab === "edited" ? "bg-accent text-white" : "bg-surface-2 text-text-muted"}`}
        >
          보정본
        </button>
      </div>

      {banner && <p className="jp-card mb-4 rounded-md p-3 text-sm text-text-muted">{banner}</p>}

      {tab === "original" && (
        <OriginalSelectionPanel
          colorCount={colorCount}
          colorLimit={DEFAULT_STUDIO_PROFILE.selectionLimitColor}
          retouchCount={retouchCount}
          retouchLimit={DEFAULT_STUDIO_PROFILE.selectionLimitRetouch}
          deadline="2026-08-15"
          overallMemo={overallMemo}
          onOverallMemoChange={setOverallMemo}
          onSubmit={() => setBanner("데모에서는 실제로 제출되지 않습니다. (실제 배포본에서는 관리자에게 알림 메일이 발송됩니다)")}
          submitting={false}
          submitLabel="셀렉 완료"
        />
      )}

      {tab === "edited" && (
        <ReeditPanel
          remaining={remainingRounds}
          max={DEFAULT_STUDIO_PROFILE.maxRetouchRounds}
          overallMemo={reeditMemo}
          onOverallMemoChange={setReeditMemo}
          onSubmit={() => setBanner("데모에서는 실제로 제출되지 않습니다.")}
          submitting={false}
        />
      )}

      <div className="mt-4">
        <PhotoGrid
          photos={activeList}
          mode={tab === "original" ? "select" : "flag"}
          onOpen={setLightboxIndex}
          onToggleHeart={toggleHeart}
          onToggleSparkle={toggleSparkle}
          onToggleFlag={toggleFlag}
        />
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={activeList}
          index={lightboxIndex}
          mode={tab === "original" ? "select" : "flag"}
          memo={
            tab === "original"
              ? selections[activeList[lightboxIndex].id]?.memo ?? ""
              : reeditSelections[activeList[lightboxIndex].id]?.memo ?? ""
          }
          onMemoChange={(v) =>
            tab === "original" ? updateMemo(activeList[lightboxIndex].id, v) : updateReeditMemo(activeList[lightboxIndex].id, v)
          }
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
          onToggleHeart={toggleHeart}
          onToggleSparkle={toggleSparkle}
          onToggleFlag={toggleFlag}
          onDownload={() => setBanner("데모에서는 다운로드가 비활성화되어 있습니다.")}
        />
      )}
    </div>
  );
}
