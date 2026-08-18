import { getStudioProfile } from "@/lib/studio-profile-server";
import { StudioProfileForm } from "./StudioProfileForm";

export const dynamic = "force-dynamic";

export default async function StudioProfilePage() {
  const profile = await getStudioProfile();

  return (
    <div className="max-w-lg space-y-4 text-adm-text">
      <h1 className="adm-h1">스튜디오 프로필</h1>
      <p className="text-sm text-adm-text-muted">
        스튜디오 이름, 연락 채널, 계좌정보, 법적 고지, 운영 규칙을 설정합니다. 여기서 저장한 값은 홈페이지·예약폼·이메일·구글
        캘린더에 자동으로 반영됩니다.
      </p>
      <StudioProfileForm initialProfile={profile} />
    </div>
  );
}
