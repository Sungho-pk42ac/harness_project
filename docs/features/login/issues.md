# 로그인 기능 이슈 분해 (Vertical Slicing)

[`PRD.md`](PRD.md)를 기반으로 한 구현 이슈 목록입니다.

## 분해 원칙 — 수직 슬라이싱

각 이슈는 **데이터 → API/Context → UI를 관통하는, 그 자체로 동작하고 사용자에게 보이는 한 조각**입니다.

- 먼저 **walking skeleton**(LOGIN-1: 올바른 계정으로 로그인하면 노트 화면이 열린다)으로 전 계층을 얇게 관통한 뒤,
- 세션 유지(LOGIN-2) → 로그아웃·사용자 표시(LOGIN-3) → 실패 에러(LOGIN-4) → 핵심 로직 테스트(LOGIN-5) 순으로 가치를 덧붙입니다.

## 각 이슈의 구성 — AC와 DoD 구분

- **인수 기준(AC, Acceptance Criteria)** = "**올바르게 동작**하는가?" 기능별 행위 기준. **Given/When/Then**으로 표현.
- **완료 정의(DoD, Definition of Done)** = "**정말 끝났는가?**" 품질·프로세스 게이트. 행위를 다시 적지 않고 완료 조건만.

## 이슈 ↔ 요구사항(FR) 매핑

| 이슈                               | 담는 FR    | 의존      |
| ---------------------------------- | ---------- | --------- |
| LOGIN-1 로그인 & 화면 진입(게이트) | FR-1, FR-2 | —         |
| LOGIN-2 세션 유지(새로고침 복원)   | FR-3       | LOGIN-1   |
| LOGIN-3 로그아웃 & 사용자 표시     | FR-4, FR-6 | LOGIN-1   |
| LOGIN-4 로그인 실패 인라인 에러    | FR-5       | LOGIN-1   |
| LOGIN-5 핵심 로직 테스트           | (테스트)   | LOGIN-1~4 |

> LOGIN-1이 모든 이슈의 선행입니다. LOGIN-2·3·4는 LOGIN-1 이후 병렬 진행 가능, LOGIN-5는 대상 로직이 구현된 뒤.

---

## LOGIN-1 — 올바른 계정으로 로그인하면 노트 화면이 열린다

**라벨**: `feature/login` `P0` `slice:happy-path`
**의존**: 없음 (선행 이슈)

### 설명

로그인 기능의 **walking skeleton**. `db.json`의 `users` 계정으로 이메일/비밀번호를 입력해 로그인하면 노트 화면으로 전환되고, 미로그인 상태에서는 노트 화면 대신 로그인 화면만 보인다. 이 한 슬라이스로 `users` 데이터 → `api/auth.ts` → `AuthContext` → `LoginPage`/`App` 게이트까지 전 계층을 얇게 관통한다. (세션 유지는 LOGIN-2, 로그아웃은 LOGIN-3, 실패 에러는 LOGIN-4)

### 범위

- `db.json`: `users` 컬렉션 + 시드 계정 1~2개 추가 (ADR-0001).
- `src/types/user.ts`: **신규** `User { id, email }`.
- `src/api/auth.ts`: **신규** `login(email, password)` — `GET /users?email=&password=`, 1건 이상이면 첫 사용자 반환(비번 제외), 0건이면 실패 throw. 네트워크는 이 모듈에만.
- `src/context/AuthContext.tsx`: **신규** `AuthProvider`/`useAuth` — `user`, `login()`, `logout()` 노출(이번 슬라이스는 메모리 상태만, 영속화는 LOGIN-2).
- `src/App.tsx`: `AuthProvider`로 감싸고 `user` 유무로 `LoginPage` ↔ 노트화면 조건부 렌더 (ADR-0003).
- `src/components/LoginPage.tsx`: **신규** 이메일·비밀번호 폼 + 로그인 버튼.

### 인수 기준 (AC)

```
시나리오 A: 올바른 계정으로 로그인
  Given db.json에 test@test.com / 1234 계정이 있고 로그인 화면이 보인다
  When 이메일 "test@test.com", 비밀번호 "1234"를 입력하고 로그인 버튼을 누른다
  Then 로그인 화면이 사라지고 기존 노트 화면(목록·편집기)이 보인다

시나리오 B: 미로그인 시 접근 차단
  Given 로그인하지 않은 상태로 앱을 연다
  When 첫 화면을 본다
  Then 노트 화면이 아니라 로그인 화면이 보인다

시나리오 C: 잘못된 계정
  Given 로그인 화면이 보인다
  When 존재하지 않는 계정으로 로그인을 시도한다
  Then 노트 화면으로 전환되지 않고 로그인 화면에 머문다
```

> 시나리오 C의 "사용자에게 보이는 에러 메시지"는 LOGIN-4에서 다룬다. 여기선 화면 전환이 일어나지 않는 것까지만.

### 완료 정의 (DoD)

- [ ] 위 AC 시나리오(A~C)가 모두 통과한다.
- [ ] 네트워크 호출이 `src/api/auth.ts`에만 존재한다(컴포넌트 직접 fetch 없음).
- [ ] 인증 상태가 `AuthContext`로 관리된다(props drilling 없음).
- [ ] 디자인 시스템 토큰 사용, lint·build 통과(임의 색/그림자/인라인 style 없음).
- [ ] 기존 노트 CRUD에 회귀가 없다.
- [ ] 코드 리뷰 후 머지된다.

---

## LOGIN-2 — 로그인 상태가 새로고침해도 유지된다

**라벨**: `feature/login` `P0` `slice:session`
**의존**: LOGIN-1

### 설명

로그인 성공 시 비밀번호를 제외한 user(`{ id, email }`)를 **localStorage**에 저장하고, 앱 시작 시 이를 읽어 `user`를 복원한다. 복원 판정이 끝나기 전에는 로딩 가드로 화면 깜빡임을 막는다 (ADR-0002).

### 범위

- `AuthContext`: 로그인 성공 시 `localStorage.setItem`, 시작 시 `localStorage`에서 복원, `loading` 상태 추가.
- `App`: `loading` 동안 렌더 가드(빈 화면/스플래시), 복원 완료 후 게이트 판정.

### 인수 기준 (AC)

```
시나리오 A: 새로고침 후 로그인 유지
  Given 로그인해서 노트 화면을 보고 있다
  When 브라우저를 새로고침한다
  Then 다시 로그인하지 않아도 노트 화면이 보인다

시나리오 B: 탭을 닫았다 다시 열어도 유지
  Given 로그인한 상태다
  When 탭을 닫고 같은 주소를 다시 연다
  Then 로그인 화면 없이 노트 화면이 보인다

시나리오 C: 복원 중 깜빡임 없음
  Given 로그인된 상태에서 새로고침한다
  When 앱이 초기화되는 동안
  Then 로그인 화면이 번쩍 보였다 사라지지 않는다
```

### 완료 정의 (DoD)

- [ ] 위 AC 시나리오(A~C)가 모두 통과한다.
- [ ] localStorage에 **비밀번호가 저장되지 않는다**(`{ id, email }`만).
- [ ] 복원 타이밍을 `loading` 가드로 처리한다.
- [ ] lint·build 통과, 기존 기능 회귀 없음.
- [ ] 코드 리뷰 후 머지된다.

---

## LOGIN-3 — 로그아웃할 수 있고 헤더에 현재 사용자가 보인다

**라벨**: `feature/login` `P1` `slice:logout`
**의존**: LOGIN-1 (LOGIN-2와 함께면 영속 세션까지 정리)

### 설명

상단 헤더(`Layout`)에 현재 로그인한 사용자 이메일과 로그아웃 버튼을 둔다. 로그아웃하면 세션(메모리 + localStorage)이 지워지고 로그인 화면으로 돌아간다.

### 범위

- `Layout`: 헤더 우측에 `user.email` + 로그아웃 버튼. `useAuth()`로 접근(또는 props 주입은 기존 패턴에 맞춰 결정).
- `AuthContext.logout()`: `user=null` + `localStorage.removeItem`.

### 인수 기준 (AC)

```
시나리오 A: 로그아웃
  Given 로그인해서 노트 화면을 보고 있다
  When 헤더의 로그아웃 버튼을 누른다
  Then 로그인 화면으로 돌아간다

시나리오 B: 로그아웃 후 세션 제거
  Given 로그아웃한 직후다
  When 브라우저를 새로고침한다
  Then 여전히 로그인 화면이 보인다(자동 재로그인되지 않는다)

시나리오 C: 현재 사용자 표시
  Given test@test.com으로 로그인했다
  When 헤더를 본다
  Then "test@test.com"이 헤더에 표시된다
```

### 완료 정의 (DoD)

- [ ] 위 AC 시나리오(A~C)가 모두 통과한다.
- [ ] 로그아웃 시 localStorage 세션이 제거된다.
- [ ] 헤더 레이아웃이 디자인 토큰을 따르고 기존 "+ 새 노트" 버튼과 충돌하지 않는다.
- [ ] lint·build 통과, 기존 기능 회귀 없음.
- [ ] 코드 리뷰 후 머지된다.

---

## LOGIN-4 — 로그인 실패 시 폼 안에 에러 메시지가 보인다

**라벨**: `feature/login` `P1` `slice:error`
**의존**: LOGIN-1

### 설명

이메일/비밀번호 불일치(조회 0건)나 네트워크 오류 시, `alert`가 아니라 **폼 안 인라인 텍스트**(`text-destructive`)로 사용자에게 알린다.

### 범위

- `LoginPage`: 실패 상태(error 메시지)를 로컬 상태로 두고 폼 하단에 렌더.
- `login()` 실패(throw)를 `LoginPage`에서 try/catch로 받아 메시지 설정.
- 재시도 시 이전 에러 메시지 초기화.

### 인수 기준 (AC)

```
시나리오 A: 불일치 에러 표시
  Given 로그인 화면이 보인다
  When 잘못된 비밀번호로 로그인을 시도한다
  Then 폼 안에 "이메일 또는 비밀번호가 올바르지 않습니다." 메시지가 보인다

시나리오 B: alert 미사용
  Given 잘못된 계정으로 로그인을 시도한다
  When 실패가 발생한다
  Then alert 팝업이 아니라 화면 내 텍스트로 안내된다

시나리오 C: 네트워크 오류 처리
  Given 서버가 응답하지 않는다
  When 로그인을 시도한다
  Then 폼 안에 사용자 친화적 에러 메시지가 표시된다

시나리오 D: 재시도 시 에러 초기화
  Given 실패 메시지가 떠 있다
  When 올바른 계정으로 다시 로그인한다
  Then 에러 메시지가 사라지고 노트 화면으로 전환된다
```

### 완료 정의 (DoD)

- [ ] 위 AC 시나리오(A~D)가 모두 통과한다.
- [ ] 에러 표시에 `text-destructive` 토큰을 사용하고 `alert`를 쓰지 않는다.
- [ ] lint·build 통과, 기존 기능 회귀 없음.
- [ ] 코드 리뷰 후 머지된다.

---

## LOGIN-5 — 핵심 인증 로직에 Vitest 테스트를 추가한다

**라벨**: `feature/login` `P1` `slice:test`
**의존**: LOGIN-1~4 (테스트 대상 로직이 구현된 뒤)

### 설명

이 프로젝트의 **첫 Vitest 테스트**. 로그인 성공/실패, 세션 저장·복원, 로그아웃의 핵심 흐름을 테스트한다. `fetch`(또는 `api/auth` 모듈)는 모킹한다. 폭넓은 컴포넌트/통합 테스트는 범위 밖(spec-fixed §8).

### 범위

- `src/**/*.test.ts(x)` 추가.
- 대상: `login()` 성공 → user 반환 / 실패(0건) → throw, `AuthContext`의 localStorage 저장·복원·로그아웃.
- `fetch` 또는 `api/auth` 모킹 설정.

### 인수 기준 (AC)

```
시나리오 A: 로그인 성공 테스트
  Given users 조회가 1건을 반환하도록 모킹한다
  When login(email, password)를 호출한다
  Then 비밀번호를 제외한 user가 반환된다

시나리오 B: 로그인 실패 테스트
  Given users 조회가 빈 배열을 반환하도록 모킹한다
  When login()을 호출한다
  Then 실패로 처리된다(throw/에러)

시나리오 C: 세션 복원 테스트
  Given localStorage에 user가 저장돼 있다
  When AuthProvider가 초기화된다
  Then user가 복원된다

시나리오 D: 로그아웃 테스트
  Given 로그인된 상태다
  When logout()을 호출한다
  Then user가 null이 되고 localStorage에서 제거된다
```

### 완료 정의 (DoD)

- [ ] 위 AC 시나리오(A~D)가 `npm test`로 통과한다.
- [ ] 테스트가 실제 네트워크에 의존하지 않는다(모킹).
- [ ] CI/로컬에서 안정적으로 재현된다(플래키 없음).
- [ ] 코드 리뷰 후 머지된다.

```

```
