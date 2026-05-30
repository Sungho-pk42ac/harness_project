# ADR-0003: 화면 보호 — 라우터 없이 `App` 조건부 렌더링

- **Status**: Accepted
- **Date**: 2026-05-30
- 관련: [PRD](../PRD.md) FR-2, [spec-fixed §3](../spec-fixed.md)

## Context

미로그인 사용자는 노트 화면에 접근할 수 없어야 한다(FR-2). 현재 앱에는 **라우팅
라이브러리가 없고**, `App`이 `selectedNoteId`/`isCreating` 같은 화면 상태를 소유하며
`Layout`에 슬롯으로 주입하는 단순 구조다.

선택지:

1. `App`에서 `user` 유무로 `LoginPage` ↔ 노트화면을 조건부 렌더.
2. `react-router`를 도입해 `/login`·`/notes` 경로로 분리하고 보호 라우트 구성.

## Decision

**`App`에서 조건부 렌더링**한다. `useAuth()`의 `user`가 `null`이면 `LoginPage`,
있으면 기존 노트 화면(`Layout` + `NoteList` + `NoteEditor`)을 렌더한다.

- `AuthProvider`로 앱을 감싸고, 복원 중(`loading`)에는 렌더를 가드(스플래시/빈 화면).
- `NotesProvider`는 로그인 이후(노트 화면) 트리에 두어도 되고 전체를 감싸도 무방하나,
  데이터 fetch가 로그인 후에만 의미 있으므로 **노트 화면 쪽에 두는 배치를 기본**으로 한다.

## Consequences

**좋은 점**

- 새 의존성·구조 변경 없이 기존 `App` 패턴 위에서 최소 변경으로 구현.
- 보호 로직이 한 곳(`App`)에 모여 흐름이 명확 — 실습 이해에 유리.

**나쁜 점 / 한계**

- URL이 화면 상태를 반영하지 않음 → 딥링크/뒤로가기/주소 공유 불가(비목표로 수용).
- 화면이 늘어나면 조건 분기가 복잡해질 수 있음 → 그 시점에 라우터 도입을 새 ADR로 검토.

## Alternatives Considered

- **react-router 도입**: URL 구분·보호 라우트·딥링크에 유리하나, 새 의존성과 구조
  재편이 필요하고 현재 화면이 2개뿐이라 과함. 이번 범위에선 기각(향후 확장 시 재검토).
