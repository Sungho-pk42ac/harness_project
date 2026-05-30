/**
 * 텍스트를 파일로 다운로드한다 (export spec-fixed §5). Blob → object URL → 가짜 <a> 클릭 → revoke.
 * object URL은 클릭 직후 해제해 메모리 누수를 막는다. (부수효과 전용 헬퍼 — 순수 변환과 분리)
 * @param filename 저장 파일명
 * @param text 파일 내용(UTF-8)
 * @param mime MIME 타입(text/markdown, application/json 등)
 */
export function downloadTextFile(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
