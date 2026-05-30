# ADR-0002: 세션 유지 — localStorage + `AuthContext`

- **Status**: Accepted
- **Date**: 2026-05-30
- 관련: [PRD](../PRD.md) FR-3·FR-4, [spec-fixed §5](../spec-fixed.md)

## Context

로그인 상태는 **새로고침 후에도 유지**되어야 하고(FR-3), 앱 어디서든 현재 사용자·
로그인/로그아웃에 접근할 수 있어야 한다. 코드베이스는 "**서버데이터 → Context,
UI 선택상태 → App의 useState**" 경계를 따른다(`NotesContext`가 단일 출처).

결정할 두 가지:

1. **어디에 상태를 두나** — 전용 Context vs App의 useState + props.
2. **무엇을·어디에 영속화하나** — 저장소(localStorage/sessionStorage/cookie)와 저장 내용.

세션 유지 저장소·저장 내용은 ②에서 **localStorage / 비밀번호 제외 user 객체**로 확정됨.

## Decision

**`AuthContext`를 신설**하고(기존 `NotesContext`와 동일 패턴), **localStorage**에
비밀번호를 제외한 user(`{ id, email }`)를 영속화한다.

- `useAuth()`가 `user`, `loading`, `login(email, password)`, `logout()`를 노출.
- 로그인 성공 → `user` 설정 + `localStorage.setItem`.
- 앱 시작 시 `AuthProvider`가 localStorage를 읽어 `user`를 복원. 복원 판정이 끝나기
  전에는 `loading=true`로 두어 `LoginPage`가 깜빡이지 않도록 가드.
- 로그아웃 → `localStorage.removeItem` + `user=null`.

## Consequences

**좋은 점**

- 인증 상태가 단일 출처를 가지며, props drilling 없이 어디서든 `useAuth()`로 접근.
- 기존 Context 컨벤션과 일관 → 학습·유지보수 비용 낮음.
- localStorage라 탭/창을 닫았다 열어도 유지 — 실습 시연에 적합.

**나쁜 점 / 한계**

- localStorage 값은 위변조 가능(서명/토큰 없음) → 누구나 user를 흉내 가능. 실습 범위로 수용.
- 초기 복원 타이밍을 `loading` 가드로 다루지 않으면 로그인 화면이 한 번 번쩍일 수 있음 →
  본 ADR에서 가드를 결정에 포함.
- 여러 탭 간 로그아웃 동기화(storage 이벤트)는 비목표.

## Alternatives Considered

- **App의 useState + props 전달**: 단순하지만 헤더·노트화면 등 여러 컴포넌트로 user를
  내려야 해 번거롭고, "서버성 전역상태는 Context" 컨벤션과 어긋나 기각.
- **sessionStorage**: 탭 닫으면 풀려 FR-3(새로고침 유지)의 체감이 약해 기각.
- **cookie**: 서버 연동(HttpOnly)에 유리하나 JSON Server 환경에선 이점이 적고 설정이
  번거로워 기각.
