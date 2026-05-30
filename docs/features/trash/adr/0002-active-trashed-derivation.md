# ADR-0002 — 활성/삭제 파생(순수 함수)과 휴지통 화면 상태 경계

- **상태(Status)**: Accepted
- **날짜**: 2026-05-31
- **관련**: [PRD §7 NFR](../PRD.md#7-비기능-요구사항-nfr), [ADR-0001](0001-soft-delete-data-model.md)

## Context

`deletedAt` 마킹(ADR-0001)을 도입하면, 화면은 같은 `notes`에서 **활성 노트**와 **삭제 노트**를 갈라 보여줘야 한다. 두 가지를 정해야 한다.

1. 활성/삭제를 **어디서 어떻게 가르나** — Context의 `notes`를 둘로 쪼개 저장? 아니면 파생 계산?
2. "휴지통을 보고 있는가"라는 **화면 상태를 어디에 두나** — Context? App? 컴포넌트 로컬?

이 프로젝트는 상태 책임 경계가 명확하다.

- **서버 데이터**(`notes/loading/error`)는 `NotesContext`가 단일 출처로 소유한다.
- **화면 선택 상태**(`selectedNoteId`, `isCreating`)는 `App.tsx`의 `useState`가 소유하고 props로 내려준다.
- 검색 기능도 같은 원칙으로 `searchQuery`를 App에 두고 `filterNotes` 순수 함수로 파생했다(선례).

## Decision

**(1) 활성/삭제는 순수 함수로 파생하고 원본은 불변으로 둔다.**

```ts
// src/utils/trash.ts
export function isTrashed(note: Note): boolean; // !!note.deletedAt
export function activeNotes(notes: Note[]): Note[]; // 활성만
export function trashedNotes(notes: Note[]): Note[]; // 삭제만
```

- `NotesContext`의 `notes`는 **활성·삭제를 모두 담는 단일 배열**로 유지한다(둘로 쪼개 저장하지 않음).
- `NoteList`는 `activeNotes(notes)`, `TrashList`는 `trashedNotes(notes)`를 렌더한다. 원본은 변형하지 않는다.

**(2) 휴지통 보기 여부는 App의 화면 상태로 둔다.**

```ts
// App.tsx
const [view, setView] = useState<'notes' | 'trash'>('notes');
// App이 헤더 토글과 사이드바 슬롯 전환에 사용
```

- `NotesContext`에는 휴지통 관련 화면 상태를 두지 않는다(서버 데이터만 유지).

## Consequences

**긍정**

- 기존 상태 경계(서버=Context, 화면=App)와 검색 기능의 선례(`filterNotes` + App 상태)를 그대로 따라 일관성이 유지된다.
- 단일 배열 + 파생이라 삭제/복원이 `notes`의 **한 항목 교체(map)** 로 끝나고, 활성/휴지통 목록이 자동으로 갱신된다(중복 저장·동기화 버그 없음).
- 파생 함수가 순수 함수라 단위 테스트가 쉽다(입출력 분명).

**부정 / 트레이드오프**

- 매 렌더마다 `filter`가 돈다 → 수십~수백 건에선 비용 0, 데이터가 커지면 `useMemo`로 최적화(현재 불필요).
- `App`이 `view`를 Layout(토글)과 사이드바(목록 전환)에 내려주는 props 배선이 늘어난다(작은 비용).

## Alternatives Considered

1. **Context에 `activeNotes`/`trashedNotes`를 별도 상태로 저장**
   - 기각 이유: 단일 출처가 둘로 쪼개져 삭제/복원 때 두 배열을 동기화해야 한다 — 정합성 버그의 전형. 파생으로 충분.
2. **`view`(휴지통 여부)를 `NotesContext`에 추가**
   - 기각 이유: 서버 데이터 출처에 화면 상태를 섞어 경계가 무너진다. 검색의 `searchQuery`를 App에 둔 선례와도 어긋난다.
3. **휴지통을 별도 라우트(`/trash`)로 분리**
   - 기각 이유: 현재 앱은 라우터가 없고 화면 상태로 슬롯을 전환하는 구조다. 라우터 도입은 이 기능 범위를 넘는 과한 변경(YAGNI). 화면 상태 토글로 충분.
