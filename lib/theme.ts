// 클라이언트 컴포넌트(테마 설정 미리보기)에서도 그대로 import하는 순수 유틸리티 모듈입니다.
// 서버 전용 코드(DB 조회/저장)는 여기 두지 말고 lib/theme-server.ts에 작성하세요 —
// 그래야 service_role 키를 다루는 Supabase admin 클라이언트가 클라이언트 번들에 섞여 들어가지 않습니다.

export type ThemeMode = "light" | "dark";

export interface ThemeSettings {
  mode: ThemeMode;
  accent: string;
}

export const DEFAULT_THEME: ThemeSettings = { mode: "dark", accent: "#7E76A0" };

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function isValidHexColor(value: string): boolean {
  return HEX_RE.test(value);
}

function clamp(n: number) {
  return Math.max(0, Math.min(255, n));
}

/** hex 색상을 흰색/검은색 쪽으로 amount(0~1)만큼 섞는다 */
function mixHex(hex: string, toward: "white" | "black", amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const target = toward === "white" ? 255 : 0;
  const mix = (c: number) => clamp(Math.round(c + (target - c) * amount));
  const toHex = (c: number) => c.toString(16).padStart(2, "0");
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

const BASE_TOKENS = {
  dark: {
    bg: "#0F0F13",
    surface: "#17171C",
    surface2: "#1E1E24",
    surfaceHover: "#26262E",
    text: "#ECECEF",
    textMuted: "#A6A6B0",
    textFaint: "#6E6E78",
    placeholder: "#5E5E68",
    border: "rgba(255, 255, 255, 0.08)",
    borderStrong: "rgba(255, 255, 255, 0.12)",
  },
  light: {
    bg: "#FFFFFF",
    surface: "#F5F5F7",
    surface2: "#EEEEF0",
    surfaceHover: "#E4E4E8",
    text: "#17171C",
    textMuted: "#5A5A63",
    textFaint: "#8B8B93",
    placeholder: "#9A9AA1",
    border: "rgba(0, 0, 0, 0.08)",
    borderStrong: "rgba(0, 0, 0, 0.12)",
  },
};

/** 관리자가 고른 메인 컬러 하나로 hover/soft/dot 파생색까지 전부 계산한다.
 * 밝은 배경에서는 어둡게, 어두운 배경에서는 밝게 섞어야 글자·링크 대비가 유지된다. */
export function buildThemeCssVars(settings: ThemeSettings): Record<string, string> {
  const tokens = BASE_TOKENS[settings.mode];
  const isDark = settings.mode === "dark";
  const accent = isValidHexColor(settings.accent) ? settings.accent : DEFAULT_THEME.accent;
  const accentHover = mixHex(accent, isDark ? "white" : "black", isDark ? 0.15 : 0.15);
  const accentSoft = mixHex(accent, isDark ? "white" : "black", isDark ? 0.35 : 0.3);
  const accentDot = mixHex(accent, isDark ? "white" : "black", isDark ? 0.3 : 0.25);

  return {
    "--bg": tokens.bg,
    "--surface": tokens.surface,
    "--surface-2": tokens.surface2,
    "--surface-hover": tokens.surfaceHover,
    "--text": tokens.text,
    "--text-muted": tokens.textMuted,
    "--text-faint": tokens.textFaint,
    "--placeholder": tokens.placeholder,
    "--accent": accent,
    "--accent-hover": accentHover,
    "--accent-soft": accentSoft,
    "--accent-dot": accentDot,
    "--border": tokens.border,
    "--border-strong": tokens.borderStrong,
  };
}
