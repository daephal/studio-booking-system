import Link from "next/link";
import { LogoutButton } from "./LogoutButton";
import { AdminNav } from "./AdminNav";
import { getStudioProfile } from "@/lib/studio-profile-server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { studioName } = await getStudioProfile();
  return (
    <div className="min-h-screen bg-adm-bg text-adm-text">
      <header
        className="sticky top-0 z-20 border-b border-adm-border"
        style={{ background: "rgba(22,24,27,0.72)", backdropFilter: "blur(20px) saturate(160%)" }}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <Link href="/admin" className="font-semibold tracking-[-0.01em] text-adm-text">
              {studioName} 관리자
            </Link>
            <div className="flex items-center gap-2">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="adm-btn-secondary rounded-full px-3 py-1.5 text-sm"
              >
                홈페이지 보기 ↗
              </a>
              <LogoutButton />
            </div>
          </div>
          <AdminNav />
        </div>
      </header>
      <main className="mx-auto max-w-6xl overflow-x-hidden px-4 py-6">{children}</main>
    </div>
  );
}
