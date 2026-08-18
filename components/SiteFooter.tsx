"use client";

import { useState } from "react";
import { hasLegalNotice, type StudioProfile } from "@/lib/studio-profile";
import type { Terms } from "@/lib/terms-server";
import { TermsModal } from "./TermsModal";

export function SiteFooter({ studioProfile, terms }: { studioProfile: StudioProfile; terms: Terms }) {
  const [showTerms, setShowTerms] = useState(false);

  return (
    <footer style={{ borderTop: "1px solid var(--border)", background: "#0b0b0e" }}>
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-5 px-5 py-9">
        <div>
          <div className="mb-1.5 text-[15px] font-bold tracking-[.04em]" style={{ color: "var(--text)" }}>
            {studioProfile.studioName}
          </div>
          {studioProfile.studioTagline && (
            <p className="text-[13px]" style={{ color: "var(--text-faint)" }}>
              {studioProfile.studioTagline}
            </p>
          )}
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-faint)" }}>
            {studioProfile.notifyEmail}
          </p>
        </div>
        <div className="flex items-center gap-5">
          {studioProfile.instagramUrl && (
            <a
              href={studioProfile.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              {studioProfile.instagramHandle}
            </a>
          )}
          <button
            type="button"
            onClick={() => setShowTerms(true)}
            className="cursor-pointer border-none bg-transparent p-0 text-[13px] transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            촬영 약관
          </button>
        </div>
      </div>
      {hasLegalNotice(studioProfile) && (
        <div className="mx-auto max-w-[1180px] px-5 pb-7">
          <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-faint)" }}>
            {[
              studioProfile.businessOwnerName && `대표: ${studioProfile.businessOwnerName}`,
              studioProfile.businessRegistrationNumber && `사업자등록번호: ${studioProfile.businessRegistrationNumber}`,
              studioProfile.mailOrderRegistrationNumber && `통신판매업신고: ${studioProfile.mailOrderRegistrationNumber}`,
              studioProfile.businessAddress && `주소: ${studioProfile.businessAddress}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      )}
      {showTerms && <TermsModal title={terms.title} sections={terms.sections} onClose={() => setShowTerms(false)} />}
    </footer>
  );
}
