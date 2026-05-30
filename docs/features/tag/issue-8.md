# 이슈 #8 — TAG-3: 태그 입력이 정규화·검증된다 (빈값·중복·개수)

> 출처: GitHub 이슈 [#8](https://github.com/Sungho-pk42ac/harness_project/issues/8) · 라벨 `feature/tag` `P0` `slice:validation` · 의존: TAG-1
> 이 문서는 TDD 직전 단계 산출물입니다. **상단=확정 시그니처(계약)**, **하단=테스트 시나리오**. (test-scenarios 스킬 생성)
> 범위: 정규화·검증을 **순수 함수로 분리**(ADR-0002)하고 `NoteEditor` 추가 흐름에 연결. api/Context 변경 없음.

## 확정 시그니처

```ts
// ── src/lib/tag.ts (신규 순수 모듈) ───────────────────────────────
/** 노트당 태그 최대 개수 (ADR-0002) */
export const MAX_TAGS = 5;

/**
 * 태그 정규화 — 앞뒤 공백 제거 + 영문 소문자화 (ADR-0002).
 * 한글은 toLowerCase 영향 없음.
 */
export function normalizeTag(raw: string): string;
//   normalizeTag('  Work  ') === 'work'
//   normalizeTag('   ')      === ''

/** canAddTag 판정 결과 — ok면 정규화된 value, 아니면 거부 사유 */
export type TagAddResult =
  | { ok: true; value: string }
  | { ok: false; reason: 'empty' | 'duplicate' | 'max' };

/**
 * 정규화 후 빈값/중복/개수상한을 순서대로 검사해 추가 가능 여부를 판정한다.
 * 검사 순서(ADR-0002): 정규화 → 빈값('empty') → 중복('duplicate') → 개수상한('max').
 * 중복 검사는 정규화된 값 기준(대소문자/공백 무시).
 */
export function canAddTag(existing: string[], raw: string): TagAddResult;

// ── src/components/NoteEditor.tsx ─────────────────────────────────
interface NoteEditorProps {
  // 변경 없음
  selectedNoteId: string | null;
  isCreating: boolean;
  onDone: () => void;
}

// handleTagKeyDown 변경: Enter/쉼표 확정 시 raw push 대신 canAddTag로 판정.
//   const result = canAddTag(tags, tagInput);
//   ok        → setTags([...prev, result.value]); setTagInput('')
//   duplicate → alert('이미 있는 태그입니다')  (AC C)
//   empty/max → 추가하지 않음 (AC B·D, 별도 알림 없음 — ADR-0002는 max 알림 미요구)

// 저장/삭제 경로 불변 (TAG-1·TAG-2 재사용). api/Context 변경 없음.
```

## 테스트 시나리오

### normalizeTag (순수 함수)

- [정상] normalizeTag — should 앞뒤 공백을 제거하고 영문을 소문자화한다 when " Work "를 정규화한다 → "work"
- [경계] normalizeTag — should 빈 문자열을 반환한다 when 공백만 있는 문자열을 정규화한다
- [경계] normalizeTag — should 한글은 그대로 둔다 when " 회의 "를 정규화한다 → "회의"

### canAddTag (순수 함수)

- [정상] canAddTag — should { ok: true, value: 정규화값 }을 반환한다 when 새롭고 비어있지 않은 태그다
- [예외] canAddTag — should { ok: false, reason: 'empty' }를 반환한다 when 정규화 결과가 빈 문자열이다
- [예외] canAddTag — should { ok: false, reason: 'duplicate' }를 반환한다 when 정규화값이 기존 목록에 이미 있다(대소문자 무시)
- [예외] canAddTag — should { ok: false, reason: 'max' }를 반환한다 when 기존 태그가 이미 5개다

### NoteEditor (추가 흐름 통합)

- [정상] NoteEditor — should 정규화된 태그가 추가된다 when " Work " 입력 후 Enter ("work" 칩 표시)
- [경계] NoteEditor — should 아무 태그도 추가되지 않는다 when 공백만 입력 후 Enter
- [예외] NoteEditor — should 추가되지 않고 "이미 있는 태그" 알림이 뜬다 when 기존 "work"에 "Work"를 입력 후 Enter
- [경계] NoteEditor — should 6번째 태그가 추가되지 않는다 when 이미 태그가 5개다

### AC 커버리지

| AC 시나리오              | 커버하는 테스트 시나리오                                                           |
| ------------------------ | ---------------------------------------------------------------------------------- |
| A — 공백·대소문자 정규화 | `[정상] normalizeTag 공백·소문자` + `[정상] NoteEditor "  Work  " → "work"`        |
| B — 빈 값 무시           | `[예외] canAddTag 'empty'` + `[경계] NoteEditor 공백만 입력 시 미추가`             |
| C — 중복 차단(alert)     | `[예외] canAddTag 'duplicate'` + `[예외] NoteEditor 중복 시 "이미 있는 태그" 알림` |
| D — 개수 제한(최대 5)    | `[예외] canAddTag 'max'` + `[경계] NoteEditor 6번째 미추가`                        |

> 모든 AC(A~D)가 순수함수 단위 + 컴포넌트 통합 양쪽으로 커버됨. DoD의 디자인 토큰·husky·lint·build·리뷰는 게이트라 행위 시나리오에서 제외.
