# 이슈 #4 — LOGIN-4: 로그인 실패 시 폼 안에 에러 메시지

> 출처: GitHub 이슈 [#4](https://github.com/Sungho-pk42ac/harness_project/issues/4) · 라벨 `feature/login` `P1` `slice:error` · 의존: LOGIN-1
> 범위: 로그인 실패(불일치/네트워크) 시 alert가 아닌 폼 안 인라인 텍스트(text-destructive)로 안내. 재시도 시 초기화.

## 확정 시그니처

```ts
// ── src/components/LoginPage.tsx (변경) ───────────────────────────
// error 로컬 상태 추가. handleSubmit:
//   setError('') 로 시작(재시도 초기화) → try await login → catch에서 메시지 설정
//   - Error.message === 'Invalid credentials' → '이메일 또는 비밀번호가 올바르지 않습니다.'
//   - 그 외(네트워크 'Failed to login' 등)        → '로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
// 렌더: {error && <p className="text-destructive ...">{error}</p>}  (alert 미사용)
// 성공 시 화면 전환은 LOGIN-1 게이트가 처리(에러는 자연히 사라짐).
```

## 테스트 시나리오

### LoginPage (실패 에러 — 통합)

- [예외] LoginPage — should "이메일 또는 비밀번호가 올바르지 않습니다." 인라인 메시지를 보여준다 when 잘못된 자격증명으로 로그인 실패한다
- [예외] LoginPage — should alert를 호출하지 않는다 when 로그인이 실패한다 (화면 내 텍스트로만 안내)
- [예외] LoginPage — should 사용자 친화적 에러 메시지를 보여준다 when 네트워크 오류('Failed to login')로 실패한다
- [정상] LoginPage — should 에러가 사라지고 노트 화면으로 전환된다 when 실패 후 올바른 계정으로 재시도한다

### AC 커버리지

| AC 시나리오               | 커버하는 테스트 시나리오                  |
| ------------------------- | ----------------------------------------- |
| A — 불일치 에러 표시      | `[예외] 불일치 인라인 메시지`             |
| B — alert 미사용          | `[예외] alert 미호출`                     |
| C — 네트워크 오류 처리    | `[예외] 네트워크 친화적 메시지`           |
| D — 재시도 시 에러 초기화 | `[정상] 재시도 성공 → 에러 사라지고 전환` |

> 모든 AC(A~D) 커버. text-destructive 토큰 사용·alert 미사용은 DoD이자 시나리오로 검증. lint·build·회귀는 게이트.
