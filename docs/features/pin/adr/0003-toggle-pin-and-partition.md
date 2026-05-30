# ADR-0003 — `togglePin` 변경 함수 + 정렬 분기 순수 함수

- **상태(Status)**: Accepted
- **날짜**: 2026-05-31
- **관련**: [PRD §6 FR-1·FR-3](../PRD.md#6-기능-요구사항-functional-requirements), [ADR-0001](0001-pin-data-model.md), [ADR-0002](0002-pin-state-ownership.md)

## Context

핀 기능은 두 가지 동작을 필요로 한다.

1. **쓰기**: 카드의 핀 버튼을 누르면 해당 노트의 `isPinned`가 뒤집히고 서버에 반영돼야 한다.
2. **읽기/표시**: 노트 목록을 고정·일반 두 섹션으로 나눠 렌더해야 한다.

기존 코드에는 `addNote(title, content, tags)` / `editNote(id, updates)` / `removeNote(id)` 세 변경 함수가 있다. 핀 쓰기를 새 전용 함수로 둘지, 기존 `editNote`로 처리할지 결정해야 한다. 또한 정렬 분기 로직을 컴포넌트 안에 둘지 순수 함수로 분리할지도 정해야 한다.

## Decision

**(쓰기) `NotesContext`에 전용 토글 함수 `togglePin(id)`을 추가한다.**

```ts
// NotesContext
togglePin: (id: string) => Promise<void>;

const togglePin = async (id: string) => {
  const target = notes.find((n) => n.id === id);
  if (!target) return;
  const updated = await api.updateNote(id, { isPinned: !(target.isPinned ?? false) });
  setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
};
```

- 내부적으로 `api.updateNote(id, { isPinned })`를 호출한다 — `updateNote`가 `Partial<Note>`를 받으므로 **API 시그니처 변경은 없다**(태그가 `Note`에 추가되며 자동 반영된 것과 동일).
- 응답으로 받은 노트로 로컬 배열을 `map` 교체한다(기존 `editNote` 패턴 재사용, 응답 기반 갱신).
- 호출부(`NoteItem`→`NoteList`)는 기존 `handleDelete`처럼 `try/catch` + `alert`로 실패를 처리한다.

**(읽기) 정렬 분기를 순수 함수 `partitionByPinned`로 분리한다.**

```ts
// src/utils/partitionByPinned.ts
/**
 * 노트 목록을 고정/일반 두 그룹으로 나눈다 (원본 불변, 각 그룹 원본 순서 유지).
 * @param notes 원본 노트 목록
 * @returns { pinned, others } — isPinned가 true인 노트와 나머지
 */
export function partitionByPinned(notes: Note[]): { pinned: Note[]; others: Note[] };
```

- `note.isPinned ?? false`로 구버전을 방어한다(ADR-0001).
- 원본 배열을 변형하지 않고 두 그룹을 새로 만든다. 각 그룹은 원본 순서를 유지한다.

## Consequences

**긍정**

- `togglePin`은 호출부에서 "현재 상태를 모른 채" 한 줄로 토글을 호출할 수 있어 `NoteItem`이 단순해진다(`editNote`로 매번 `!isPinned`를 계산해 넘길 필요 없음).
- 변경 함수 의미가 명확해진다(`add`/`edit`/`remove`/`togglePin`). 핀이라는 도메인 동작이 1급으로 드러난다.
- 정렬을 순수 함수로 분리해 입출력이 명확 → 단위 테스트·재사용이 쉽고, 검색의 `filterNotes`와 동일한 패턴이다.

**부정 / 트레이드오프**

- 변경 함수가 하나 늘어 Context 표면이 커진다. 단, 핀은 명확한 도메인 동작이라 `editNote`에 숨기기보다 드러내는 편이 가독성에 유리.
- `togglePin`이 `notes.find`로 현재 상태를 읽으므로, 함수가 최신 `notes`를 클로저로 참조해야 한다(기존 함수들과 동일한 제약, 추가 위험 없음).

## Alternatives Considered

1. **전용 함수 없이 `editNote(id, { isPinned: !current })`를 호출부에서 직접 호출**
   - 장점: Context에 함수를 안 늘려도 됨.
   - 기각 이유: 호출부(`NoteItem`)가 매번 현재 `isPinned`를 알아 부정 계산을 해야 해 책임이 샌다. 핀이라는 도메인 동작이 일반 수정에 묻혀 가독성·테스트성이 떨어진다.
2. **정렬 분기를 `NoteList` 컴포넌트 안에 인라인 `filter` 두 번으로 작성**
   - 기각 이유: 로직이 뷰에 섞여 단위 테스트가 어렵고, 구버전 방어(`?? false`)·순서 유지 규칙이 컴포넌트에 흩어진다. 검색이 `filterNotes`를 분리한 선례와 어긋난다.
3. **낙관적 업데이트(클릭 즉시 로컬 토글 후 실패 시 롤백)**
   - 기각 이유: 기존 변경 함수가 모두 응답 기반이라 일관성이 깨지고, 롤백 처리 복잡도가 MVP에 과도. 로컬 서버라 지연이 무시 가능하므로 응답 기반으로 충분. 필요 시 별도 ADR.
