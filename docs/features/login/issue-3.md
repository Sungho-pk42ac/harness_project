# 이슈 #3 — LOGIN-3: 로그아웃 & 헤더에 현재 사용자 표시

> 출처: GitHub 이슈 [#3](https://github.com/Sungho-pk42ac/harness_project/issues/3) · 라벨 `feature/login` `P1` `slice:logout` · 의존: LOGIN-1(+2)
> 범위: 헤더(`Layout`)에 현재 사용자 이메일 + 로그아웃 버튼. 로그아웃 시 메모리+localStorage 세션 제거 후 로그인 화면 복귀.

## 확정 시그니처

```ts
// ── src/context/AuthContext.tsx (변경) ────────────────────────────
// logout(): user=null + localStorage.removeItem(STORAGE_KEY)  ← removeItem 추가(LOGIN-2는 setUser(null)만)

// ── src/components/Layout.tsx (변경) ──────────────────────────────
// useAuth()로 user/logout 접근(props drilling 없이). 헤더 우측에:
//   <span>{user.email}</span> + <button>로그아웃</button>(클릭 시 logout())
// 기존 "+ 새 노트" 버튼과 공존. 디자인 토큰 사용(임의 그림자·인라인 style 제거).
```

## 테스트 시나리오

### App / Layout (로그아웃 — 통합)

- [정상] App — should 로그인 화면으로 돌아간다 when 로그인 상태에서 헤더의 로그아웃 버튼을 누른다
- [정상] App — should localStorage 세션이 제거된다(자동 재로그인 안 됨) when 로그아웃한다
- [정상] Layout — should 헤더에 현재 사용자 이메일이 표시된다 when test@test.com으로 로그인돼 있다

### AC 커버리지

| AC 시나리오               | 커버하는 테스트 시나리오        |
| ------------------------- | ------------------------------- |
| A — 로그아웃              | `[정상] 로그아웃 → 로그인 화면` |
| B — 로그아웃 후 세션 제거 | `[정상] localStorage 세션 제거` |
| C — 현재 사용자 표시      | `[정상] 헤더에 이메일 표시`     |

> B의 "새로고침해도 로그인 화면"은 localStorage 제거로 보장(제거 확인까지 단위 검증). lint·build·회귀는 게이트.
