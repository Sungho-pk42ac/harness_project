# 이슈 #7 — TAG-2: 추가한 태그를 개별 삭제할 수 있다

> 출처: GitHub 이슈 [#7](https://github.com/Sungho-pk42ac/harness_project/issues/7) · 라벨 `feature/tag` `P0` `slice:delete` · 의존: TAG-1
> 이 문서는 TDD 직전 단계 산출물입니다. **상단=확정 시그니처(계약)**, **하단=테스트 시나리오**. (test-scenarios 스킬 생성)
> 범위: `NoteEditor` 칩의 × 버튼으로 로컬 태그 제거 + 저장 시 영속화. api/Context는 TAG-1 배선 재사용(변경 없음).

## 확정 시그니처

```ts
// ── src/components/NoteEditor.tsx ─────────────────────────────────
interface NoteEditorProps {
  // 변경 없음
  selectedNoteId: string | null;
  isCreating: boolean;
  onDone: () => void;
}

// 신규: 칩 개별 삭제 핸들러 — 로컬 tags 상태에서 해당 인덱스를 제거한다.
// handleRemoveTag(index: number): void
//   → setTags((prev) => prev.filter((_, i) => i !== index))
//   인덱스 기반: 같은 이름 태그가 여러 개여도 클릭한 칩만 제거 (중복 방지는 TAG-3 소관).

// 각 태그 칩에 삭제 버튼 추가:
//   <button type="button" aria-label={`${tag} 삭제`} onClick={() => handleRemoveTag(i)}>×</button>
//   네이티브 <button> → 키보드 포커스·Enter/Space 활성화 자동 지원 (AC C 접근성).

// 저장 경로 불변: handleSave가 현재(줄어든) tags를 addNote/editNote에 그대로 전달 (TAG-1 배선 재사용).

// ── src/api/notes.ts · src/context/NotesContext.tsx ───────────────
// 변경 없음. editNote(id, { title, content, tags })가 이미 줄어든 tags를 영속화한다(ADR-0003).
```

## 테스트 시나리오

### NoteEditor (컴포넌트 동작)

- [정상] NoteEditor — should 클릭한 태그만 제거하고 나머지는 남긴다 when 특정 칩의 삭제(×) 버튼을 클릭한다
- [경계] NoteEditor — should 클릭한 칩(인덱스)만 제거한다 when 같은 이름 태그가 여러 개 있다
- [경계] NoteEditor — should 칩 목록이 사라진다(미표시) when 유일한 태그를 삭제해 tags가 비게 된다
- [정상] NoteEditor — should 줄어든 tags로 editNote(id, { title, content, tags })를 호출한다 when 태그 삭제 후 저장한다
- [정상] NoteEditor — should 키보드로 삭제 버튼을 활성화하면 해당 태그가 제거된다 when 칩 삭제 버튼에 포커스 후 Enter/Space를 누른다 (접근성)

### AC 커버리지

| AC 시나리오                    | 커버하는 테스트 시나리오                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| A — 특정 태그 삭제(클릭)       | `[정상] 클릭한 태그만 제거` (+ `[경계] 중복 태그 인덱스 제거`)                                  |
| B — 삭제의 영속화(저장→재오픈) | `[정상] 줄어든 tags로 editNote 호출` (저장 계약 검증) — 전체 재오픈 왕복은 E2E `J4`(TAG-2) 담당 |
| C — 키보드 접근성              | `[정상] 키보드로 삭제 버튼 활성화 시 제거`                                                      |

> 모든 AC(A~C)가 1개 이상 시나리오로 커버됨. 비고: B의 "저장 후 다시 열기" 전체 왕복은 단위가 아니라 E2E(`e2e/tag.spec.ts`의 `J4` fixme) 소관 — 여기서는 "저장 시 줄어든 tags가 editNote로 전달된다"는 계약까지 검증. DoD의 디자인 토큰·husky·lint·build·리뷰는 행위 검증이 아니라 게이트라 시나리오에서 제외.
