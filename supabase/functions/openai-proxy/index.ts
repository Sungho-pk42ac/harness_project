// openai-proxy — OpenAI 프록시 + Supabase 인증 게이트 (note-assistant-agent ADR-0002).
//
// 역할 두 가지만:
//  1) 인증 게이트: 요청의 Supabase JWT를 검증한다(미인증 401). 키 오남용 차단.
//  2) 포워딩: 본문을 OpenAI Chat Completions로 전달하되 OPENAI_API_KEY를 서버에서 주입.
//
// 브라우저는 OpenAI 키를 모른다(ChatOpenAI/transport가 이 함수를 baseURL/엔드포인트로 사용).
// 배포: `supabase functions deploy openai-proxy` + `supabase secrets set OPENAI_API_KEY=...`
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  // 1) 인증 게이트 — 세션 JWT 검증
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Unauthorized' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  );
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return json({ error: 'Unauthorized' }, 401);

  // 2) 키 확인 — 없으면 503 + 설정 가이드
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    return json(
      {
        error:
          'OPENAI_API_KEY가 설정되지 않았습니다. `supabase secrets set OPENAI_API_KEY=...` 후 함수를 다시 배포하세요.',
      },
      503,
    );
  }

  // 3) 포워딩 — 본문 그대로 OpenAI로, 키는 서버에서 주입
  const body = await req.text();
  const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body,
  });
  const text = await openaiRes.text();
  return new Response(text, {
    status: openaiRes.status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});
