import { getFormSettings } from "@/lib/form-settings-server";
import { ReservationFieldsForm } from "./ReservationFieldsForm";

export const dynamic = "force-dynamic";

export default async function ReservationFieldsPage() {
  const settings = await getFormSettings();

  return (
    <div className="max-w-lg space-y-4 text-adm-text">
      <h1 className="adm-h1">예약 항목 설정</h1>
      <p className="text-sm text-adm-text-muted">
        예약 폼(고객용)과 예약 상세 화면에 표시되는 촬영형태 이름, 텍스트 항목의 이름·개수를 설정합니다.
      </p>
      <ReservationFieldsForm initialShootTypes={settings.shootTypes} initialCustomFields={settings.customFields} />
    </div>
  );
}
