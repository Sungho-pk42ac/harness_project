// 태그 정규화·검증 순수 모듈 (ADR-0002)

/** 노트당 태그 최대 개수 (ADR-0002) */
export const MAX_TAGS = 5;

/** canAddTag 판정 결과 — ok면 정규화된 value, 아니면 거부 사유 */
export type TagAddResult =
  | { ok: true; value: string }
  | { ok: false; reason: 'empty' | 'duplicate' | 'max' };

/**
 * 태그 정규화 — 앞뒤 공백 제거 + 영문 소문자화 (ADR-0002).
 * @param raw 사용자 입력 원문
 */
export function normalizeTag(raw: string): string {
  // 앞뒤 공백 제거 후 영문 소문자화 (한글 등은 toLowerCase 영향 없음)
  return raw.trim().toLowerCase();
}

/**
 * 정규화 후 빈값/중복/개수상한을 순서대로 검사해 추가 가능 여부를 판정한다.
 * @param existing 현재 태그 목록(정규화된 상태로 가정)
 * @param raw 사용자 입력 원문
 */
export function canAddTag(existing: string[], raw: string): TagAddResult {
  // 검사 순서(ADR-0002): 정규화 → 빈값 → 중복 → 개수상한
  const value = normalizeTag(raw);
  if (value === '') return { ok: false, reason: 'empty' };
  if (existing.includes(value)) return { ok: false, reason: 'duplicate' };
  if (existing.length >= MAX_TAGS) return { ok: false, reason: 'max' };
  return { ok: true, value };
}
