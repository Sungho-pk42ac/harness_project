# ADR-0002 — 클라이언트 순수 함수 정렬 + 원본 불변(복사 후 정렬)

- **상태(Status)**: Accepted
- **날짜**: 2026-05-31
- **관련**: [PRD §6 FR-1·FR-7](../PRD.md#6-기능-요구사항-functional-requirements), [ADR-0001](0001-sort-state-location.md), [검색 ADR-0002](../../search/adr/0002-client-pure-filter.md)

## Context

노트 목록을 어떻게·어디서 정렬할지 결정해야 한다. 제약·맥락은 다음과 같다.

- 모든 노트 데이터는 이미 클라이언트 메모리(`NotesContext.notes`)에 있다. 규모는 수십~수백 건 수준(학습용 로컬 앱).
- `NotesContext.notes`는 **서버 데이터의 단일 출처**이며, `addNote`(append)·`editNote`(map)·`removeNote`(filter)가 응답으로 이 배열을 갱신한다.
- 자바스크립트 `Array.prototype.sort`는 **제자리(in-place) 정렬**이라 원본 배열을 직접 바꾼다 — 단일 출처를 정렬하면 데이터가 오염된다.
- 검색 기능이 이미 순수 함수 `filterNotes(notes, query)`로 원본 불변 패턴을 확립했다(검색 ADR-0002).

## Decision

정렬을 **클라이언트 순수 함수 `sortNotes`** 로 분리하고, **원본을 복사한 뒤 정렬**해 새 배열을 반환한다.

```ts
// src/utils/sortNotes.ts
export type SortBy = 'updatedAt' | 'createdAt' | 'title';
export type SortDir = 'asc' | 'desc';

export function sortNotes(notes: Note[], sortBy: SortBy, sortDir: SortDir): Note[] {
  const sorted = [...notes].sort((a, b) => {
    const cmp =
      sortBy === 'title'
        ? a.title.localeCompare(b.title, 'ko')
        : a[sortBy].localeCompare(b[sortBy]); // ISO 문자열 = 시간순
    return sortDir === 'asc' ? cmp : -cmp;
  });
  return sorted;
}
```

- **원본 불변**: 반드시 `[...notes]`로 복사한 뒤 `sort` → `NotesContext.notes`는 절대 변형되지 않는다.
- **비교 규칙**: 날짜(`updatedAt`/`createdAt`)는 ISO 문자열 비교(사전식 = 시간순), 제목은 `localeCompare('ko')`(한·영 자연 정렬).
- **방향**: 비교 결과 부호를 `sortDir`로 반전(한곳에서만 방향 처리).
- **안정 정렬**: 모던 JS `sort`는 stable이라 같은 값일 때 원본 순서 유지.
- **합성**: 검색이 함께 걸리면 **filter → sort** 순서로 합성한다(거른 결과만 정렬).
- **핀 재사용**: 핀 섹션이 도입되면 같은 `sortNotes`를 **섹션별로 호출**해 섹션 내부 정렬을 동일하게 적용한다.

## Consequences

**긍정**

- 입력(배열+기준+방향)→출력(정렬된 새 배열)이 명확해 **단위 테스트가 쉽다**(검색 `filterNotes`와 동일 철학).
- 원본 불변 덕에 정렬을 바꿔도 `NotesContext`의 응답 기반 갱신이 깨지지 않는다.
- 서버 왕복이 없어 선택 즉시 재정렬(체감 지연 0). 서버·DB 스키마 변경 불필요.
- 순수 함수라 검색 결과·핀 섹션 등 **어떤 노트 배열에도 재사용** 가능하다.

**부정 / 트레이드오프**

- 매 렌더마다 정렬이 다시 돈다 — 현재 규모에선 무시 가능하나, 데이터가 커지면 `useMemo` 또는 서버 정렬을 별도 도입한다.
- `[...notes]` 복사 비용이 생기지만 얕은 복사라 수백 건까지 무시 가능하며, 원본 보호라는 이득이 훨씬 크다.

## Alternatives Considered

1. **서버 정렬(JSON Server `_sort`/`_order` 쿼리 위임)**
   - 기각 이유: 데이터가 이미 메모리에 있어 서버 왕복이 불필요한 비용이다. 정렬을 바꿀 때마다 재요청·로딩 상태가 생겨 즉시성이 떨어지고, `api/notes.ts`·Context까지 손대 범위가 샌다. 규모가 커지면 그때 도입(YAGNI).
2. **`NotesContext.notes`를 직접 정렬해 저장(in-place)**
   - 기각 이유: 단일 출처를 오염시킨다. 정렬 기준을 바꾸면 원본 순서 복구가 불가능하고, `add`/`edit`/`remove`의 응답 기반 갱신이 정렬된 배열을 망가뜨린다. `sort`의 in-place 특성과 정면충돌.
3. **`NoteList` 안에 비교 로직을 인라인으로 작성**
   - 기각 이유: 정렬 로직이 컴포넌트에 묶여 단위 테스트가 어렵고, 핀 섹션 등에서 재사용할 수 없다. 순수 함수 분리가 테스트·재사용 모두에 유리하다.
