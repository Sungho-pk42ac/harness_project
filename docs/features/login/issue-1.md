# 이슈 #1 — LOGIN-1: 올바른 계정으로 로그인하면 노트 화면이 열린다 (walking skeleton)

> 출처: GitHub 이슈 [#1](https://github.com/Sungho-pk42ac/harness_project/issues/1) · 라벨 `feature/login` `P0` `slice:happy-path` · 의존: 없음
> 상단=확정 시그니처(계약), 하단=테스트 시나리오. 범위: users 데이터 → api/auth → AuthContext → LoginPage/App 게이트 전 계층 얇게 관통(메모리 상태만, 영속화는 LOGIN-2).

## 확정 시그니처

```ts
// ── src/types/user.ts (신규) ──────────────────────────────────────
export interface User {
  id: string;
  email: string; // 비밀번호는 클라이언트 타입에서 제외 (spec-fixed §1)
}

// ── src/api/auth.ts (신규) ────────────────────────────────────────
// GET /users?email=&password= → 1건 이상이면 첫 사용자(비번 제외) 반환, 0건이면 throw.
// 네트워크는 이 모듈에만 존재.
export async function login(email: string, password: string): Promise<User>;
//   성공: { id, email }
//   실패(0건): throw new Error('Invalid credentials')
//   네트워크 실패(!res.ok): throw new Error('Failed to login')

// ── src/context/AuthContext.tsx (신규) ────────────────────────────
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>; // 성공 시 user 설정
  logout: () => void; // user = null
}
export function AuthProvider({ children }: { children: ReactNode }): JSX.Element;
export function useAuth(): AuthContextType; // Provider 밖 호출 시 throw
// (loading/localStorage 영속화는 LOGIN-2 소관 — 이 슬라이스는 메모리 상태만)

// ── src/components/LoginPage.tsx (신규) ───────────────────────────
// 이메일·비밀번호 입력 + 로그인 버튼. placeholder: '이메일','비밀번호', 버튼 '로그인'.
// 제출 시 useAuth().login(email, password) 호출. (실패 인라인 에러는 LOGIN-4)
export function LoginPage(): JSX.Element;

// ── src/App.tsx (변경) ────────────────────────────────────────────
// AuthProvider로 감싸고, user 유무로 조건부 렌더:
//   user 없음 → <LoginPage/>
//   user 있음 → 기존 노트 화면(NotesProvider + Layout + NoteList + NoteEditor)
```

## 테스트 시나리오

### App (인증 게이트 — 통합)

- [경계] App — should 로그인 화면(이메일·비밀번호·로그인 버튼)을 보여준다 when 미로그인 상태로 앱을 연다 (노트 화면 미표시)
- [정상] App — should 노트 화면(+ 새 노트)으로 전환된다 when 올바른 계정으로 로그인한다
- [예외] App — should 로그인 화면에 머문다(노트 화면 미전환) when 잘못된 계정으로 로그인을 시도한다

### AC 커버리지

| AC 시나리오            | 커버하는 테스트 시나리오         |
| ---------------------- | -------------------------------- |
| A — 올바른 계정 로그인 | `[정상] 노트 화면으로 전환`      |
| B — 미로그인 접근 차단 | `[경계] 미로그인 시 로그인 화면` |
| C — 잘못된 계정        | `[예외] 로그인 화면에 머문다`    |

> AC C의 "에러 메시지"는 LOGIN-4 소관 — 여기선 화면 전환이 일어나지 않는 것까지만 검증. db.json users 시드는 구현 시 추가(테스트는 api/auth 모킹). DoD의 토큰·lint·build·회귀는 게이트라 시나리오 제외.
