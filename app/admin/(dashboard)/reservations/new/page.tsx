import { AdminReservationForm } from "./AdminReservationForm";
import { getFormSettings } from "@/lib/form-settings-server";
import { enabledShootTypes, enabledCustomFields } from "@/lib/form-settings";

export const dynamic = "force-dynamic";

export default async function NewReservationPage() {
  const settings = await getFormSettings();
  return (
    <AdminReservationForm shootTypes={enabledShootTypes(settings)} customFields={enabledCustomFields(settings)} />
  );
}
