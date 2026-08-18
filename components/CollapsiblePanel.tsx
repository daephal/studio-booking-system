"use client";

import { useState } from "react";

export function CollapsiblePanel({
  title,
  defaultOpen = true,
  children,
}: {
  title: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="space-y-4 adm-card rounded-lg p-4">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between text-left">
        <h2 className="font-medium">{title}</h2>
        <span className="text-xs text-adm-text-muted">{open ? "▲ 접기" : "▼ 펴기"}</span>
      </button>
      {open && (
        <div
          className="adm-resizable min-h-[160px] resize-y space-y-4 overflow-y-auto rounded-md"
          style={{ height: 420, maxHeight: "80vh" }}
        >
          {children}
        </div>
      )}
      {open && (
        <p className="pointer-events-none -mt-2 text-right text-[10px] text-adm-text-faint">
          ↕ 오른쪽 아래 모서리를 드래그하면 크기를 조절할 수 있습니다
        </p>
      )}
    </section>
  );
}
