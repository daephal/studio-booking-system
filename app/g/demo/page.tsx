import { DemoGalleryView } from "./DemoGalleryView";
import { getStudioProfile } from "@/lib/studio-profile-server";

export async function generateMetadata() {
  const { studioName } = await getStudioProfile();
  return { title: `갤러리 데모 | ${studioName}` };
}

export default function DemoGalleryPage() {
  return <DemoGalleryView />;
}
