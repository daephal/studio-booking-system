import { BookingForm } from "./BookingForm";
import { getFormSettings } from "@/lib/form-settings-server";
import { enabledShootTypes, enabledCustomFields } from "@/lib/form-settings";
import { getStudioProfile } from "@/lib/studio-profile-server";
import { getTerms } from "@/lib/terms-server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const studioProfile = await getStudioProfile();
  return { title: `예약하기 | ${studioProfile.studioName}` };
}

export default async function BookingPage() {
  const [settings, studioProfile, terms] = await Promise.all([getFormSettings(), getStudioProfile(), getTerms()]);
  return (
    <BookingForm
      shootTypes={enabledShootTypes(settings)}
      customFields={enabledCustomFields(settings)}
      studioProfile={studioProfile}
      terms={terms}
    />
  );
}
