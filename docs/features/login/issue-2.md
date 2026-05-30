# 이슈 #2 — LOGIN-2: 로그인 상태가 새로고침해도 유지된다

> 출처: GitHub 이슈 [#2](https://github.com/Sungho-pk42ac/harness_project/issues/2) · 라벨 `feature/login` `P0` `slice:session` · 의존: LOGIN-1
> 범위: 로그인 성공 시 비번 제외 user를 localStorage에 저장, 앱 시작 시 복원, 복원 전 loading 가드로 깜빡임 방지 (ADR-0002). 로그아웃 정리는 LOGIN-3.

## 확정 시그니처

```ts
// ── src/context/AuthContext.tsx (변경) ────────────────────────────
const STORAGE_KEY = 'auth.user'; // localStorage 키

interface AuthContextType {
  user: User | null;
  loading: boolean; // ← 신규: localStorage 복원 판정 중 true
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
// AuthProvider:
//   - 시작 시 useEffect로 localStorage[STORAGE_KEY]를 읽어 user 복원, 끝나면 loading=false
//   - login 성공 시 setUser + localStorage.setItem(STORAGE_KEY, JSON.stringify({id,email}))
//     ⚠ 비밀번호는 저장하지 않는다 (User에 password 없음)

// ── src/App.tsx (변경) ────────────────────────────────────────────
// const { user, loading } = useAuth();
// if (loading) return null;            // 복원 중 가드 — LoginPage 깜빡임 방지
// if (!user) return <LoginPage/>;
// else 노트화면
```

## 테스트 시나리오

### AuthContext / App (세션 복원 — 통합)

- [정상] App — should 다시 로그인하지 않아도 노트 화면(+ 새 노트)이 보인다 when localStorage에 user가 저장돼 있고 앱을 연다(새로고침/재진입)
- [정상] AuthContext — should localStorage에 비밀번호 없이 {id,email}만 저장한다 when 로그인에 성공한다
- [경계] App — should 로그인 화면이 깜빡이지 않는다(이메일 입력칸이 끝까지 나타나지 않음) when 저장된 세션을 복원하며 시작한다

### AC 커버리지

| AC 시나리오               | 커버하는 테스트 시나리오                                     |
| ------------------------- | ------------------------------------------------------------ |
| A — 새로고침 후 유지      | `[정상] localStorage 복원 → 노트 화면`                       |
| B — 탭 닫았다 열어도 유지 | `[정상] localStorage 복원 → 노트 화면` (localStorage는 영속) |
| C — 복원 중 깜빡임 없음   | `[경계] 복원 중 로그인 화면 미표시` + loading 가드           |
| (DoD) 비번 미저장         | `[정상] {id,email}만 저장`                                   |

> A·B는 localStorage 영속성이 같은 메커니즘이라 한 테스트로 커버(탭 재진입=새 마운트+localStorage 유지). 비번 미저장은 DoD라 별도 단언. lint·build·회귀는 게이트.
