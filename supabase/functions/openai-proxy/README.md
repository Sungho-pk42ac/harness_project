# openai-proxy (Edge Function)

note-assistant-agent의 **OpenAI 프록시 + Supabase 인증 게이트** (ADR-0002).
브라우저가 OpenAI 키를 모른 채 LLM을 호출할 수 있게, 이 함수가 JWT를 검증하고 키를 서버에서 주입해
OpenAI Chat Completions로 포워딩합니다.

## 동작

1. `OPTIONS` → CORS 프리플라이트 응답
2. `Authorization`(Supabase JWT) 없음/무효 → **401**
3. 함수 env에 `OPENAI_API_KEY` 없음 → **503** + 설정 가이드
4. 그 외 → 본문을 `https://api.openai.com/v1/chat/completions`로 포워딩(키는 서버 주입)

## 배포 (사용자 작업 — OpenAI 키 필요)

```bash
# 1) OpenAI 키를 함수 secret으로 등록 (브라우저에 노출되지 않음)
supabase secrets set OPENAI_API_KEY=sk-...

# 2) 함수 배포
supabase functions deploy openai-proxy
```

> 키를 등록하기 전까지 AI 비서는 503(설정 안내)을 받습니다. 코드·단위 테스트는 키 없이도 통과하며,
> 실제 LLM 호출/E2E 스모크는 키 등록 후 가능합니다(PRD Open Question).

## 로컬

```bash
supabase functions serve openai-proxy --env-file ./supabase/.env.local
```
