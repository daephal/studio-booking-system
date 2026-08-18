import { downloadZip } from "client-zip";

export interface ZipFileSource {
  name: string;
  url: string;
}

export interface ZipExtraTextFile {
  name: string;
  content: string;
}

/**
 * 브라우저에서 presigned URL 목록을 받아 ZIP으로 묶어 다운로드.
 * client-zip은 스트리밍 압축(압축 없이 저장)을 지원하지만, 여기서는 구현 단순성을 위해
 * blob()으로 최종 결과만 받습니다. 총 용량이 매우 크면(수 GB) 브라우저 메모리 사용량이
 * 커질 수 있으니, 실제 운영 중 문제가 되면 streamsaver.js 등으로 디스크 스트리밍 전환을 고려하세요.
 */
export async function downloadPhotosAsZip(
  files: ZipFileSource[],
  zipFilename: string,
  extraTextFiles: ZipExtraTextFile[] = []
) {
  const fileObjects = await Promise.all(
    files.map(async (f) => {
      const res = await fetch(f.url);
      if (!res.ok) throw new Error(`다운로드 실패: ${f.name}`);
      return new File([await res.blob()], f.name);
    })
  );
  const extraFileObjects = extraTextFiles.map(
    (f) => new File([f.content], f.name, { type: "text/plain;charset=utf-8" })
  );

  const blob = await downloadZip([...fileObjects, ...extraFileObjects]).blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipFilename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
