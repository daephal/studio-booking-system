export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  received: "접수",
  confirmed: "확정",
  shot_done: "촬영완료",
  originals_sent: "원본전송",
  selection_done: "셀렉완료",
  edits_sent: "보정본전송",
  closed: "종료",
  cancelled: "취소",
};

// 예약 진행 노선도(정상 흐름)에 표시되는 순서 — "취소"는 별도 예외 상태라 여기 포함하지 않음
export const RESERVATION_FLOW_STATUSES: { key: string; label: string }[] = [
  { key: "received", label: "접수" },
  { key: "confirmed", label: "확정" },
  { key: "shot_done", label: "촬영완료" },
  { key: "originals_sent", label: "원본전송" },
  { key: "selection_done", label: "셀렉완료" },
  { key: "edits_sent", label: "보정본전송" },
  { key: "closed", label: "종료" },
];

// 관리자 화면 노선도/배지에서 상태별로 구분되는 색(app/globals.css의 --adm-status-* 참조)
export const RESERVATION_STATUS_COLORS: Record<string, string> = {
  received: "var(--adm-status-received)",
  confirmed: "var(--adm-status-confirmed)",
  shot_done: "var(--adm-status-shot-done)",
  originals_sent: "var(--adm-status-originals-sent)",
  selection_done: "var(--adm-status-selection-done)",
  edits_sent: "var(--adm-status-edits-sent)",
  closed: "var(--adm-status-closed)",
  cancelled: "var(--adm-status-cancelled)",
};
