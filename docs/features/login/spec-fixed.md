# 로그인 기능 정의서 (확정본)

> ① 초안([`spec.md`](spec.md))의 모호함을 ② 인터뷰로 결정한 확정본입니다.
> 이후 ③ PRD/ADR, ④ issues 작성의 입력이 됩니다.

## 기능 개요

사용자가 이메일/비밀번호로 **로그인**해야 노트 화면에 접근할 수 있다. 로그인 상태는
새로고침해도 유지되며, 로그아웃할 수 있다. 이번 범위에서 로그인은 노트 화면을 막는
**"문지기(gate)" 역할**만 하며, 노트 데이터 자체는 모든 사용자에게 공용이다.

## 확정 사항

### 1. 데이터 모델 — `users` 컬렉션

- `db.json`에 `users` 컬렉션을 신설한다. JSON Server가 `http://localhost:3001/users`로 제공.
- 사용자 형태:
  ```jsonc
  {
    "id": "u1", // JSON Server 부여(기존 노트와 동일 규칙)
    "email": "test@test.com",
    "password": "1234", // ⚠️ 평문 (실습용, 아래 비고 참고)
  }
  ```
- 클라이언트 타입은 비밀번호를 제외한 형태로 다룬다:
  ```ts
  interface User {
    id: string;
    email: string;
  }
  ```

### 2. 인증(검증) 방식

- **회원가입은 범위에서 제외**한다. 계정은 `db.json`에 미리 넣어둔다(시드).
- 로그인 검증은 **JSON Server 쿼리 파라미터**로 한다:
  `GET /users?email=<email>&password=<password>`
  - 결과 배열이 **1건 이상이면 성공**(첫 번째 사용자), **0건이면 실패**.
- 비밀번호는 **평문 저장/비교**한다.

### 3. 입력 방식 / 화면

- 로그인 화면은 **이메일 + 비밀번호 입력 폼 + 로그인 버튼**으로 구성.
- **라우터 라이브러리는 도입하지 않는다.** `App`에서 **조건부 렌더링**:
  - 미로그인 → `LoginPage` 렌더
  - 로그인 → 기존 노트 화면(`Layout` + `NoteList` + `NoteEditor`) 렌더

### 4. 로그인 실패 표시

- 실패(이메일/비밀번호 불일치, 네트워크 오류) 시 **폼 안에 에러 메시지**를 표시한다.
  - 예: "이메일 또는 비밀번호가 올바르지 않습니다."
  - `alert`가 아니라 인라인 텍스트(`text-destructive` 토큰 사용).

### 5. 상태 관리 / 세션 유지

- **`AuthContext` 신설** (`NotesContext`와 동일한 Context 패턴). `useAuth()` 훅으로 접근.
  - 노출: `user`, `loading`, `login(email, password)`, `logout()`.
  - "서버데이터 → Context, UI상태 → App" 경계를 따른다(인증 상태는 Context).
- 로그인 성공 시 **비밀번호를 제외한 user 객체**(`{ id, email }`)를 **localStorage**에 저장.
- 앱 시작 시 localStorage를 읽어 `user`를 복원 → 새로고침해도 로그인 유지.
- 로그아웃 시 localStorage에서 제거하고 `user`를 `null`로.

### 6. 로그아웃 / 현재 사용자 표시

- **상단 헤더(`Layout`)** 우측에 현재 사용자 **이메일 + 로그아웃 버튼**을 둔다.
- 로그아웃하면 다시 `LoginPage`로 전환된다.

### 7. 범위 (Scope)

**포함**

- 이메일/비밀번호 로그인 (users 컬렉션 검증)
- localStorage 기반 세션 유지(새로고침 복원)
- 로그아웃
- 미로그인 시 노트 화면 접근 차단(조건부 렌더)
- 로그인 실패 인라인 에러

**제외 (Non-goals)**

- 회원가입 / 비밀번호 찾기 / 비밀번호 변경
- 비밀번호 해싱·실제 보안(평문 실습)
- 노트의 사용자별 분리(노트는 공용, `userId` 부여 안 함)
- 권한·역할(role), 자동 만료/토큰 갱신
- react-router 등 라우팅 도입

### 8. 테스트

- 범위: **핵심 로직만**(Vitest 첫 도입). 폭넓은 컴포넌트/통합 테스트는 제외.
- 대상 후보:
  - 로그인 **성공** → user 반환 & localStorage 저장
  - 로그인 **실패**(0건) → 에러 처리, user 미설정
  - localStorage **복원** → 시작 시 user 복구
  - 로그아웃 → localStorage 제거 & user null
- `fetch`는 모킹(또는 api 모듈 모킹). `*.test.ts(x)`를 `src/` 하위에 추가.

## 영향 파일

| 파일                           | 변경                                                                          |
| ------------------------------ | ----------------------------------------------------------------------------- |
| `db.json`                      | `users` 컬렉션 추가(시드 계정 1~2개)                                          |
| `src/types/user.ts`            | **신규** — `User` 인터페이스(`{ id, email }`)                                 |
| `src/api/auth.ts`              | **신규** — `login(email, password)` (GET /users 쿼리). 네트워크는 이 모듈에만 |
| `src/context/AuthContext.tsx`  | **신규** — `AuthProvider`/`useAuth`, localStorage 연동                        |
| `src/components/LoginPage.tsx` | **신규** — 로그인 폼 + 인라인 에러                                            |
| `src/components/Layout.tsx`    | 헤더에 사용자 이메일 + 로그아웃 버튼 추가                                     |
| `src/App.tsx`                  | `AuthProvider`로 감싸고, `user` 유무로 `LoginPage`/노트화면 조건부 렌더       |
| `src/main.tsx`                 | (필요 시) Provider 배치 확인                                                  |
| `src/**/*.test.ts(x)`          | **신규** — 핵심 로직 테스트                                                   |

## 비고 / 제약

- **보안 경고**: JSON Server는 모든 데이터를 클라이언트에 그대로 노출하므로, 평문 비밀번호와
  클라이언트측 검증은 **실제 보안이 아니다**. 강의용 실습 한정이며, 실서비스에서는 서버측
  인증·해싱·토큰이 필요하다(별도 ADR에서 기록).
- 기존 코드 컨벤션 유지: 네트워크는 `api/` 모듈에만, Context 패턴, named export, 한국어 주석,
  Tailwind 시맨틱 토큰. (전역 규칙: camelCase, 함수 JSDoc)
