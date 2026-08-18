import { getTerms } from "@/lib/terms-server";
import { TermsEditorForm } from "./TermsEditorForm";

export const dynamic = "force-dynamic";

export default async function TermsPage() {
  const terms = await getTerms();

  return (
    <div className="max-w-lg space-y-4 text-adm-text">
      <h1 className="adm-h1">촬영 약관</h1>
      <p className="text-sm text-adm-text-muted">
        예약 폼과 홈페이지 하단에 표시되는 약관입니다. 항목은 자유롭게 추가·삭제할 수 있고, 각 항목의 내용은 한 줄에
        하나씩 입력합니다.
      </p>
      <TermsEditorForm initialTerms={terms} />
    </div>
  );
}
