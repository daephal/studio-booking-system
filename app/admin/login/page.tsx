import { getStudioProfile } from "@/lib/studio-profile-server";
import { AdminLoginForm } from "./AdminLoginForm";

export default async function AdminLoginPage() {
  const { studioName } = await getStudioProfile();
  return <AdminLoginForm studioName={studioName} />;
}
