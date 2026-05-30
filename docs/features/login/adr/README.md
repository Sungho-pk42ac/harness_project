# 로그인 기능 — ADR 인덱스

기술 결정 기록(Architecture Decision Records). 각 파일은 **중요한 결정 하나**를 다루며,
한 번 Accepted 되면 불변이다(번복 시 새 ADR로 Superseded).

| #                                   | 결정             | Status   | 요약                                                                      |
| ----------------------------------- | ---------------- | -------- | ------------------------------------------------------------------------- |
| [0001](0001-auth-data-model.md)     | 인증 데이터 모델 | Accepted | `db.json` `users` 컬렉션 + 평문, JSON Server 쿼리 검증 (실습 비보안 명시) |
| [0002](0002-session-persistence.md) | 세션 유지        | Accepted | `AuthContext` + localStorage(비번 제외 user), 복원 `loading` 가드         |
| [0003](0003-route-protection.md)    | 화면 보호        | Accepted | 라우터 없이 `App` 조건부 렌더(LoginPage ↔ 노트화면)                       |

## 관련 문서

- [PRD](../PRD.md) — 무엇을·왜
- [spec-fixed](../spec-fixed.md) — ② 인터뷰 확정본
- `../issues.md` — ④ 수직 슬라이스 (다음 단계)
