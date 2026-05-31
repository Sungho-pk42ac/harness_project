# ADR-0002 — Edge Function은 "OpenAI 프록시 + 인증 게이트" 한 가지만

- **Status**: Accepted
- **Date**: 2026-06-01

## Context

에이전트는 브라우저에서 돈다([ADR-0001])지만 **OpenAI API 키는 브라우저에 둘 수 없다**. 키를
서버에서만 다루면서 브라우저의 `ChatOpenAI`가 OpenAI를 호출하게 하려면 중간 계층이 필요하다.

## Decision

**Supabase Edge Function `openai-proxy`** 하나를 둔다. 역할은 단 두 가지:

1. **인증 게이트** — 요청의 Supabase JWT를 검증(`Authorization` 헤더). 미인증이면 401. 키 오남용 차단.
2. **포워딩** — 본문을 OpenAI Chat Completions API로 그대로 전달하되 `Authorization: Bearer
$OPENAI_API_KEY`를 서버에서 주입. 응답을 그대로 반환. (스트리밍은 후속.)

브라우저는 `new ChatOpenAI({ apiKey: 'proxy', configuration: { baseURL: <함수 URL> } })`로 이 프록시를
가리킨다. `OPENAI_API_KEY`가 함수 env에 없으면 **503 + 설정 가이드 메시지**를 반환한다.

## Consequences

- 키는 함수 secret(`supabase secrets set OPENAI_API_KEY=...`)에만 존재 — 브라우저 번들/네트워크에 노출 0.
- 함수가 **얇다**(fetch 포워딩 + JWT 검증) → Deno 호환 리스크 최소, Vitest 밖이어도 표면적이 작아 E2E 스모크로 충분.
- CORS 프리플라이트(OPTIONS) 핸들러 필요.
- 키 미설정 시 503 → 통합 이슈 DoD에 "사용자가 키 제공 후 배포" 명시(Open Question).

## Alternatives Considered

- **브라우저에서 OpenAI 직접 호출**: 키 노출로 즉시 기각.
- **함수에서 OpenAI 호출까지 LangGraph로**: [ADR-0001]에서 기각된 Deno 실행과 동일 문제.
- **Vercel Serverless 프록시**: 가능하나 Supabase 함수가 JWT 검증·배포 파이프라인과 더 정합(기존 supabase/ 사용).
