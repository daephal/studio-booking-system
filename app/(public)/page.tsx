import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getDownloadUrl } from "@/lib/r2";
import type { SitePhoto } from "@/lib/types";
import { Hero } from "./Hero";
import { PhotoFeed } from "./PhotoFeed";
import { getStudioProfile } from "@/lib/studio-profile-server";

// site_photos는 관리자가 언제든 바꿀 수 있고, presigned URL도 만료되므로 정적 캐싱하지 않습니다.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = getSupabaseAdmin();
  const studioProfile = await getStudioProfile();

  let heroImageUrls: string[] = [];
  let feedImages: { id: string; url: string }[] = [];

  if (supabase) {
    const { data: photos } = await supabase
      .from("site_photos")
      .select("*")
      .order("sort_order", { ascending: true });

    const list = (photos as SitePhoto[]) ?? [];
    const heroPhotos = list.filter((p) => p.kind === "hero");
    const feed = list.filter((p) => p.kind === "feed");

    heroImageUrls = (
      await Promise.all(
        heroPhotos.map(async (p) => {
          try {
            return await getDownloadUrl(p.r2_key, 3600 * 6);
          } catch {
            return null;
          }
        })
      )
    ).filter((v): v is string => v !== null);

    feedImages = (
      await Promise.all(
        feed.map(async (p) => {
          try {
            return { id: p.id, url: await getDownloadUrl(p.thumb_key, 3600 * 6) };
          } catch {
            return null;
          }
        })
      )
    ).filter((v): v is { id: string; url: string } => v !== null);
  }

  return (
    <div className="animate-[jpFade_400ms_cubic-bezier(0.32,0.72,0,1)]">
      <Hero imageUrls={heroImageUrls} kakaoChannelUrl={studioProfile.kakaoChannelUrl} />
      <PhotoFeed images={feedImages} instagramUrl={studioProfile.instagramUrl} />
    </div>
  );
}
