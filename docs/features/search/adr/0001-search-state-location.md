# ADR-0001 — 검색어 상태 위치: `App.tsx` UI 상태

- **상태(Status)**: Accepted
- **날짜**: 2026-05-31
- **관련**: [PRD §7 NFR](../PRD.md#7-비기능-요구사항-nfr), [ADR-0002](0002-client-pure-filter.md)

## Context

검색어(`searchQuery`)를 어디에 보관할지 정해야 한다. 이 프로젝트는 상태 책임 경계가 명확하다.

- **서버 데이터**(`notes/loading/error`)는 `NotesContext`가 단일 출처로 소유한다.
- **화면 선택 상태**(`selectedNoteId`, `isCreating`)는 `App.tsx`의 `useState`가 소유하고 props로 내려준다.
- 검색어는 서버에 저장되지 않는 **순수 화면 상태**이고, `SearchBar`(입력)와 `NoteList`(걸러진 결과) **둘 이상**이 공유해야 한다.

## Decision

검색어를 **`App.tsx`의 `useState`** 로 보관한다 — `selectedNoteId`와 같은 경계.

```ts
const [searchQuery, setSearchQuery] = useState('');
// App이 SearchBar(value/onChange)와 NoteList(검색어)에 내려준다.
```

- `NotesContext`에는 검색 관련 상태를 두지 않는다(서버 데이터만 유지).
- 검색 중 노트를 선택/생성해도 `searchQuery`는 초기화하지 않는다(독립 상태).

## Consequences

**긍정**

- 기존 상태 경계(서버=Context, 화면=App)를 그대로 따라 일관성이 유지된다.
- 검색어가 컴포넌트 트리 한 곳(App)에 모여 `SearchBar`·`NoteList`가 동일 출처를 공유한다.
- Context를 건드리지 않으므로 `addNote`/`editNote`/`removeNote`의 응답 기반 갱신 로직과 충돌이 없다.

**부정 / 트레이드오프**

- `App`이 검색어를 두 자식에게 내려주는 props 배선이 늘어난다(작은 비용).
- 전역 어디서나 검색어를 읽어야 하는 요구가 생기면(현재 없음) Context 승격을 재검토한다 → 그때 별도 ADR.

## Alternatives Considered

1. **`NotesContext`에 `searchQuery` 추가**
   - 기각 이유: 서버 데이터 출처에 화면 상태를 섞어 경계가 무너진다. 노트 전환·재진입 시 잔여 상태 위험. 검색은 서버와 무관한 읽기·표시 계층이다.
2. **`NoteList` 로컬 `useState`**
   - 기각 이유: 검색 입력(`SearchBar`)과 결과 렌더(`NoteList`)가 분리돼 있어, 한 컴포넌트 로컬로는 둘이 상태를 공유할 수 없다(상위로 끌어올려야 함).
