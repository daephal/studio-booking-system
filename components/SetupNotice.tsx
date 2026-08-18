export function SetupNotice({ items }: { items: string[] }) {
  return (
    <div
      style={{ borderColor: "rgba(217,158,66,0.4)", background: "rgba(217,158,66,0.08)", color: "#e8c891" }}
      className="rounded-lg border p-4 text-sm"
    >
      <p className="font-medium">⚠️ 환경변수 설정이 필요합니다</p>
      <ul className="mt-2 list-disc pl-5">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="mt-2" style={{ opacity: 0.8 }}>
        자세한 설정 방법은 프로젝트의 SETUP.md를 참고하세요.
      </p>
    </div>
  );
}
