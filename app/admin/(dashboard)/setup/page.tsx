import Link from "next/link";

const STEPS = [
  {
    title: "① 스튜디오 프로필",
    description: "스튜디오 이름, 알림 이메일, 카카오톡·인스타그램, 계좌정보, 법적 고지, 운영 규칙을 설정합니다.",
    href: "/admin/studio-profile",
  },
  {
    title: "② 촬영 약관",
    description: "예약 폼과 홈페이지에 표시되는 촬영/취소/환불 약관을 스튜디오 상황에 맞게 편집합니다.",
    href: "/admin/terms",
  },
  {
    title: "③ 예약 항목 설정",
    description: "촬영형태 종류와 이름, 예약 폼의 텍스트 입력 항목(개수·이름·필수여부)을 설정합니다.",
    href: "/admin/reservation-fields",
  },
  {
    title: "④ 구글 캘린더 연동",
    description: "예약이 접수될 때 자동으로 일정이 등록될 구글 캘린더를 연결합니다.",
    href: "/admin/setup/google",
  },
  {
    title: "⑤ 테마 설정",
    description: "홈페이지와 관리자 화면의 색상 테마를 선택합니다.",
    href: "/admin/theme",
  },
];

export default function SetupGuidePage() {
  return (
    <div className="max-w-lg space-y-4 text-adm-text">
      <h1 className="adm-h1">설정 가이드</h1>
      <p className="text-sm text-adm-text-muted">
        처음 시스템을 받으셨다면 아래 순서대로 한 번씩 설정해보세요. 각 항목은 나중에 언제든 다시 와서 바꿀 수
        있습니다.
      </p>
      <div className="space-y-3">
        {STEPS.map((step) => (
          <Link
            key={step.href}
            href={step.href}
            className="adm-card block rounded-lg p-4 transition-colors hover:bg-adm-surface-hover"
          >
            <h2 className="font-medium">{step.title}</h2>
            <p className="mt-1 text-sm text-adm-text-muted">{step.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
