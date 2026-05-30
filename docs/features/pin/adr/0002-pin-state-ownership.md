# ADR-0002 — 핀 상태 소유 위치: `NotesContext`(서버 데이터)

- **상태(Status)**: Accepted
- **날짜**: 2026-05-31
- **관련**: [PRD §7 NFR](../PRD.md#7-비기능-요구사항-nfr), [ADR-0001](0001-pin-data-model.md), [ADR-0003](0003-toggle-pin-and-partition.md)

## Context

이 코드베이스는 상태 책임 경계가 명확하다.

- **서버 데이터**(영속) → `NotesContext`(단일 출처): `notes`와 `addNote`/`editNote`/`removeNote`.
- **화면 상태**(휘발) → `App.tsx`의 `useState`: `selectedNoteId`, `isCreating`, (검색 도입 시) `searchQuery`.

핀 상태(`isPinned`)를 이 둘 중 어디에 둘지 정해야 한다. 검색 기능은 검색어를 **App의 화면 상태**로 두기로 결정한 선례가 있는데(ADR: 검색어 위치), 핀도 비슷해 보일 수 있어 혼동의 여지가 있다.

## Decision

핀 상태는 **`NotesContext`가 소유하는 서버 데이터**로 다룬다.

- `isPinned`는 노트 문서에 영속되는 필드이므로(ADR-0001), `notes` 배열의 일부로 Context가 단일 출처로 보유한다.
- 핀 변경은 Context의 **`togglePin(id)`** 변경 함수로 수행하고, `api.updateNote` 응답으로 로컬 배열을 교체한다(기존 `editNote`의 응답 기반 map 갱신 패턴).
- **정렬 분기(고정/일반 2섹션)** 는 서버 데이터가 아니라 **렌더 시점의 파생 계산**이다. 원본 `notes`를 바꾸지 않고 순수 함수 `partitionByPinned(notes)`로 나눈다(ADR-0003).

## Consequences

**긍정**

- 새로고침·재진입 후에도 핀 상태가 유지된다(영속 데이터의 단일 출처가 Context이므로 자연히 보장).
- 기존 변경 함수 패턴(`add`→append, `edit`→map, `remove`→filter)에 `togglePin`→map을 더하는 일관된 확장이다.
- 정렬은 파생 계산이라 원본 불변 — 검색의 "원본 `notes`를 안 바꾸고 걸러진 목록만 계산" 철학과 동일.

**부정 / 트레이드오프**

- 토글이 서버 왕복을 동반한다(낙관적 업데이트 아님 → 클릭 후 응답까지 미세 지연). 단, 기존 변경 함수도 모두 응답 기반이라 일관되며, 로컬 데이터라 지연은 사실상 무시 가능.
- 오프라인/느린 네트워크에서 토글 반영이 늦을 수 있음 → 필요 시 낙관적 업데이트를 별도 ADR로 검토(현재 범위 밖).

## Alternatives Considered

1. **핀 상태를 `App.tsx`의 화면 상태(`pinnedIds: Set`)로 두기** (검색어와 동일 경계)
   - 기각 이유: 핀은 **영속**돼야 한다. 화면 상태로 두면 새로고침 시 사라져 핵심 가치(매번 위에 둠)를 잃는다. 검색어(휘발 OK)와 본질이 다르다.
2. **별도 `PinContext` 신설**
   - 기각 이유: 핀은 노트 데이터의 한 필드일 뿐이라 `NotesContext`에서 자연히 다룬다. 컨텍스트를 쪼개면 `notes`와 핀 상태의 동기화 부담만 늘어난다(과도한 분리).
3. **정렬된 결과를 Context의 `notes`에 직접 반영(재정렬 저장)**
   - 기각 이유: Context의 `notes`는 서버 데이터의 단일 출처다. 정렬로 덮어쓰면 응답 기반 갱신(append/map/filter)이 꼬이고 원본 순서 복구가 불가능하다. 정렬은 파생 계산이어야 한다.
