# 이슈 #9 — TAG-4: 노트 목록에서 각 노트의 태그가 보인다

> 출처: GitHub 이슈 [#9](https://github.com/Sungho-pk42ac/harness_project/issues/9) · 라벨 `feature/tag` `P0` `slice:list-display` · 의존: TAG-1
> 이 문서는 TDD 직전 단계 산출물입니다. **상단=확정 시그니처(계약)**, **하단=테스트 시나리오**. (test-scenarios 스킬 생성)
> 범위: `NoteItem`이 `note.tags`를 칩으로 표시(읽기 전용). 없으면 영역 미표시, 많으면 줄바꿈. api/Context 변경 없음.

## 확정 시그니처

```ts
// ── src/components/NoteItem.tsx ───────────────────────────────────
interface NoteItemProps {
  // 변경 없음
  note: Note;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

// 신규: 카드 본문에 태그 칩 영역을 추가한다(읽기 전용, 삭제 버튼 없음 — 삭제는 편집기 소관 TAG-2).
//   const tags = note.tags ?? [];                       // 구버전 노트 방어 (ADR-0001)
//   tags.length > 0 일 때만 칩 컨테이너를 렌더:
//     <div data-testid="note-tags" className="flex flex-wrap gap-1 mt-2">
//       {tags.map((tag, i) => (
//         <span key={`${tag}-${i}`}
//           className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
//           {tag}
//         </span>
//       ))}
//     </div>
//   tags가 비면 컨테이너 자체를 렌더하지 않는다(영역 미표시) → queryByTestId('note-tags') === null
```

## 테스트 시나리오

### NoteItem (목록 카드 태그 표시)

- [정상] NoteItem — should "회의" 칩을 카드에 표시한다 when note.tags에 "회의"가 있다
- [경계] NoteItem — should 태그 영역(note-tags)을 렌더하지 않는다 when note.tags가 빈 배열이다
- [경계] NoteItem — should 에러 없이 태그 영역을 렌더하지 않는다 when note.tags가 undefined다 (note.tags ?? [])
- [경계] NoteItem — should 태그 5개를 모두 칩으로 표시한다 when note.tags에 태그가 5개 있다

### AC 커버리지

| AC 시나리오          | 커버하는 테스트 시나리오                                                  |
| -------------------- | ------------------------------------------------------------------------- |
| A — 목록에 태그 표시 | `[정상] "회의" 칩 표시`                                                   |
| B — 태그 없는 노트   | `[경계] tags 빈 배열 → note-tags 미렌더` (+ `[경계] tags undefined 방어`) |
| C — 다수 태그 줄바꿈 | `[경계] 태그 5개 모두 표시` (flex-wrap으로 줄바꿈, 모두 가시)             |

> 모든 AC(A~C) 커버. 줄바꿈(C)은 `flex-wrap` 스타일이라 단위 테스트에서는 "5개 모두 렌더/가시"로 검증(시각적 줄바꿈은 E2E J3 보강). DoD의 디자인 토큰·husky·lint·build·성능은 게이트라 행위 시나리오에서 제외.
