# ADR-0001 — 정렬 상태 위치: `App.tsx` UI 상태

- **상태(Status)**: Accepted
- **날짜**: 2026-05-31
- **관련**: [PRD §9](../PRD.md#9-데이터--상태-모델-개요), [ADR-0002](0002-client-pure-sort.md), [검색 ADR-0001](../../search/adr/0001-search-state-location.md)

## Context

정렬 기준(`sortBy`)과 방향(`sortDir`)을 어디에 보관할지 결정해야 한다. 제약·맥락은 다음과 같다.

- 이 프로젝트는 **상태 경계 규칙**이 명확하다: **서버 데이터는 `NotesContext`(단일 출처)**, **화면 선택 상태는 `App.tsx`의 `useState`**(`selectedNoteId`, `isCreating`).
- 검색 기능(v0.2)이 이미 같은 규칙으로 `searchQuery`를 `App.tsx`에 두었다(검색 ADR-0001).
- 정렬은 "어떤 노트가 서버에 있나"가 아니라 "지금 화면에서 어떤 순서로 볼까"라는 **순수 화면 관심사**다.

## Decision

정렬 기준·방향을 **`App.tsx`의 화면 상태(`useState`)** 로 보관한다.

```ts
// App.tsx
const [sortBy, setSortBy] = useState<SortBy>('updatedAt');
const [sortDir, setSortDir] = useState<SortDir>('desc');
```

- `selectedNoteId`/`searchQuery`와 **같은 경계**에 둔다. 기본값은 `updatedAt`/`desc`(최근 수정 먼저).
- `App`이 소유하고 `SortControl`(value/onChange)과 `NoteList`(정렬 기준·방향)에 props로 내려준다.
- **세션 메모리 한정**: 새로고침 시 기본값으로 돌아간다. `localStorage` 영속화는 별도 ADR/슬라이스로 분리.

## Consequences

**긍정**

- 기존 상태 책임 경계(서버=Context, 화면=App)를 그대로 지켜 구조 일관성이 유지된다.
- 검색(`searchQuery`)과 나란히 두어 두 화면 필터·정렬 상태가 한곳에서 관리된다.
- Context를 건드리지 않으므로 `addNote`/`editNote`/`removeNote`의 응답 기반 갱신과 충돌이 없다.

**부정 / 트레이드오프**

- 정렬 상태를 멀리 떨어진 컴포넌트에서 쓰려면 props 전달이 필요하다(현재 트리 깊이가 얕아 부담 없음).
- 새로고침하면 정렬이 초기화된다 — 영속화가 필요해지면 후속 ADR로 `localStorage`를 도입한다.

## Alternatives Considered

1. **`NotesContext`에 정렬 상태를 둔다**
   - 기각 이유: 정렬은 서버 데이터가 아니라 화면 관심사다. Context에 두면 상태 경계가 흐려지고, 노트 전환·재진입 시 잔여 상태 위험이 생긴다. 검색이 이미 App에 있어 일관성도 깨진다.
2. **`NoteList` 내부 로컬 상태로 둔다**
   - 기각 이유: 정렬 컨트롤(`SortControl`)과 목록(`NoteList`)이 형제로 분리되면 컨트롤이 `NoteList` 내부 상태를 못 만진다. 정렬 설정을 App이 소유해야 두 컴포넌트가 공유한다. (검색 상태와 동일 구조.)
3. **처음부터 `localStorage`에 영속화**
   - 기각 이유: 직렬화·복원·유효성 검증이라는 숨은 복잡도를 walking skeleton에 끌어온다. 한 번에 한 기능 원칙에 따라 메모리 상태로 시작하고 영속화는 별도 슬라이스로 미룬다.
