# 이슈 #5 — LOGIN-5: 핵심 인증 로직 Vitest 테스트

> 출처: GitHub 이슈 [#5](https://github.com/Sungho-pk42ac/harness_project/issues/5) · 라벨 `feature/login` `P1` `slice:test` · 의존: LOGIN-1~4
> 범위: 핵심 인증 로직(login 성공/실패, 세션 복원/로그아웃)의 격리 단위 테스트. fetch/api 모킹. 폭넓은 컴포넌트 테스트는 범위 밖(spec-fixed §8).
> 비고: 대상 로직은 LOGIN-1~4에서 이미 구현됨 → 이 슬라이스는 **테스트 추가**가 산출물(RED 단계는 N/A, 작성한 테스트가 실제 로직을 검증하며 통과).

## 확정 시그니처 (테스트 대상 — 기구현)

```ts
// src/api/auth.ts      → login(email, password): Promise<User>  (GET /users 쿼리, 0건이면 throw)
// src/context/AuthContext.ts → AuthProvider(복원/login/logout), useAuth()
// 새 파일: src/api/auth.test.ts, src/context/AuthContext.test.tsx
```

## 테스트 시나리오

### login (api — fetch 모킹)

- [정상] login — should 비밀번호를 제외한 user를 반환한다 when users 조회가 1건을 반환한다 (AC A)
- [예외] login — should throw한다 when users 조회가 빈 배열을 반환한다 (AC B)
- [예외] login — should Error('Failed to login')을 throw한다 when 응답이 ok가 아니다

### AuthContext (renderHook — localStorage)

- [정상] AuthContext — should localStorage의 user를 복원한다 when AuthProvider가 초기화된다 (AC C)
- [정상] AuthContext — should user를 null로 만들고 localStorage에서 제거한다 when logout을 호출한다 (AC D)

### AC 커버리지

| AC 시나리오     | 커버하는 테스트 시나리오                |
| --------------- | --------------------------------------- |
| A — 로그인 성공 | `[정상] login 비번 제외 user 반환`      |
| B — 로그인 실패 | `[예외] login 빈 배열 → throw`          |
| C — 세션 복원   | `[정상] AuthContext localStorage 복원`  |
| D — 로그아웃    | `[정상] AuthContext logout → null+제거` |

> 모든 AC(A~D) 커버. 네트워크 비의존(fetch/localStorage 모킹), 플래키 없음(DoD). 기존 App 통합 테스트(13건)와 함께 회귀 가드를 형성.
