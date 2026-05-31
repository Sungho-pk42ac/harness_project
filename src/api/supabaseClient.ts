import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * url·anonKey로 Supabase 클라이언트를 생성한다 (spec-fixed §5). 순수 팩토리 — env에 의존하지 않아
 * 단위 테스트가 쉽다. 둘 중 하나라도 비면 명확한 에러를 throw한다.
 * @param url Supabase 프로젝트 URL (VITE_SUPABASE_URL)
 * @param anonKey publishable/anon API 키 (VITE_SUPABASE_ANON_KEY)
 */
export function createSupabaseClient(url: string, anonKey: string): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error(
      'Supabase 환경변수가 설정되지 않았습니다 (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)',
    );
  }
  return createClient(url, anonKey);
}

// 앱 전역에서 쓰는 단일 클라이언트(지연 생성·캐시). 최초 호출 시 env로 1회 생성한다.
let cachedClient: SupabaseClient | null = null;

/**
 * 앱 전역 Supabase 클라이언트를 반환한다 (없으면 env로 생성 후 캐시).
 * api 계층(notes.ts)은 이 함수만 호출한다 — 테스트는 supabaseClient 모듈 하나만 모킹하면 된다.
 */
export function getSupabase(): SupabaseClient {
  if (!cachedClient) {
    cachedClient = createSupabaseClient(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    );
  }
  return cachedClient;
}
