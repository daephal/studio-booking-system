import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getStudioProfile } from "@/lib/studio-profile-server";
import { getTerms } from "@/lib/terms-server";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [studioProfile, terms] = await Promise.all([getStudioProfile(), getTerms()]);
  return (
    <>
      <SiteHeader studioName={studioProfile.studioName} />
      <main className="flex-1">{children}</main>
      <SiteFooter studioProfile={studioProfile} terms={terms} />
    </>
  );
}
