import type { Metadata } from "next";
import localFont from "next/font/local";
import { buildThemeCssVars } from "@/lib/theme";
import { getThemeSettings } from "@/lib/theme-server";
import { getStudioProfile } from "@/lib/studio-profile-server";
import "./globals.css";

export const dynamic = "force-dynamic";

const montserrat = localFont({
  variable: "--font-montserrat",
  src: [
    { path: "./fonts/Montserrat-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/Montserrat-Medium.otf", weight: "500", style: "normal" },
    { path: "./fonts/Montserrat-SemiBold.otf", weight: "600", style: "normal" },
    { path: "./fonts/Montserrat-Bold.otf", weight: "700", style: "normal" },
  ],
});

const notoSansKr = localFont({
  variable: "--font-noto-sans-kr",
  src: [{ path: "./fonts/NotoSansKR-VariableFont_wght.ttf", weight: "100 900", style: "normal" }],
});

export async function generateMetadata(): Promise<Metadata> {
  const { studioName } = await getStudioProfile();
  return {
    title: studioName,
    description: `돌잔치 · 웨딩 · 야외 스냅사진 스튜디오 ${studioName}`,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getThemeSettings();
  const cssVars = buildThemeCssVars(theme);

  return (
    <html
      lang="ko"
      className={`${montserrat.variable} ${notoSansKr.variable} h-full antialiased`}
      style={cssVars as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
