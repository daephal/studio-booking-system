"use client";

export interface GridPhoto {
  id: string;
  filename: string;
  thumbUrl: string | null;
  heart?: boolean;
  sparkle?: boolean;
  flagged?: boolean;
  snsPublic?: boolean;
}

export function PhotoGrid({
  photos,
  mode,
  onOpen,
  onToggleHeart,
  onToggleSparkle,
  onToggleFlag,
  onToggleSnsPublic,
}: {
  photos: GridPhoto[];
  mode: "select" | "flag" | "view";
  onOpen: (index: number) => void;
  onToggleHeart?: (id: string) => void;
  onToggleSparkle?: (id: string) => void;
  onToggleFlag?: (id: string) => void;
  onToggleSnsPublic?: (id: string) => void;
}) {
  if (photos.length === 0) {
    return <p className="py-16 text-center text-sm text-text-faint">사진이 없습니다.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {photos.map((photo, index) => (
        <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-md bg-surface-2">
          <button type="button" className="h-full w-full" onClick={() => onOpen(index)}>
            {photo.thumbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo.thumbUrl}
                alt={photo.filename}
                loading="lazy"
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-text-faint">로드 실패</div>
            )}
          </button>

          {mode === "select" && (
            <div className="absolute right-1 top-1 flex gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleHeart?.(photo.id);
                }}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-sm backdrop-blur ${
                  photo.heart ? "bg-rose-500 text-white" : "bg-black/40 text-white/80"
                }`}
                aria-label="색상보정 선택"
              >
                ♥
              </button>
              {photo.heart && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSparkle?.(photo.id);
                  }}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-sm backdrop-blur ${
                    photo.sparkle ? "bg-amber-400 text-white" : "bg-black/40 text-white/80"
                  }`}
                  aria-label="리터칭 선택"
                >
                  ✨
                </button>
              )}
            </div>
          )}

          {mode === "flag" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFlag?.(photo.id);
              }}
              className={`absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full text-sm backdrop-blur ${
                photo.flagged ? "bg-rose-500 text-white" : "bg-black/40 text-white/80"
              }`}
              aria-label="재수정 요청"
            >
              ✎
            </button>
          )}

          {photo.snsPublic !== undefined && onToggleSnsPublic && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSnsPublic(photo.id);
              }}
              className={`absolute left-1 top-1 flex h-7 w-7 items-center justify-center rounded-full text-sm backdrop-blur ${
                photo.snsPublic ? "bg-black/40 text-white/80" : "bg-amber-600 text-white"
              }`}
              aria-label={photo.snsPublic ? "SNS 공개 가능 (클릭 시 비공개로 전환)" : "SNS 비공개 (클릭 시 공개로 전환)"}
              title={photo.snsPublic ? "SNS 공개 가능" : "SNS 비공개"}
            >
              {photo.snsPublic ? "🌐" : "🚫"}
            </button>
          )}

          <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 text-[10px] text-white">
            {photo.filename}
          </span>
        </div>
      ))}
    </div>
  );
}
