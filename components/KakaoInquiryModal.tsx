"use client";

export function KakaoInquiryModal({ kakaoChannelUrl, onClose }: { kakaoChannelUrl: string; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{ background: "rgba(0,0,0,0.7)" }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-5 animate-[jpFade_220ms_ease-out]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
        className="w-full max-w-[420px] overflow-hidden rounded-3xl shadow-2xl animate-[jpUp_300ms_cubic-bezier(0.32,0.72,0,1)]"
      >
        <div className="px-7 pb-2 pt-8 text-center">
          <div
            style={{ background: "rgba(126,118,160,0.2)" }}
            className="mx-auto mb-5 flex h-[60px] w-[60px] items-center justify-center rounded-full"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-soft)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3 className="mb-3 text-[19px] font-bold tracking-tight" style={{ color: "var(--text)" }}>
            가격 및 예약문의
          </h3>
          <p className="mb-1 text-[15px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
            날짜와 시간, 장소를 카카오톡으로 남겨주시면
            <br />
            가능여부와 구성 정보를 보내드리겠습니다.
          </p>
        </div>
        <div className="px-7 pb-7 pt-5">
          <a
            href={kakaoChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: "#fee500", color: "#3b1e1e" }}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-bold transition-colors hover:bg-[#ffeb3b]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.9 3 3 6.3 3 10.3c0 2.6 1.7 4.9 4.3 6.2-.2.7-.7 2.5-.8 2.9 0 0-.02.14.07.2.09.05.2.01.2.01.26-.04 3-2 3.5-2.35.57.08 1.15.12 1.74.12 5.1 0 9-3.3 9-7.3S17.1 3 12 3z" />
            </svg>
            카카오톡으로 문의하기
          </a>
          <button
            type="button"
            onClick={onClose}
            className="mt-2.5 w-full rounded-2xl py-3.5 text-sm font-semibold transition-colors"
            style={{ color: "var(--text-faint)" }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
