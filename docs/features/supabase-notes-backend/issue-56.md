# 이슈 #56 — SUPA-1: Supabase 클라이언트·notes 테이블·env 연결 (walking skeleton)

## 확정 시그니처

```ts
// src/api/supabaseClient.ts
import { type SupabaseClient } from '@supabase/supabase-js';

/**
 * url·anonKey로 Supabase 클라이언트를 생성한다. 둘 중 하나라도 비면 명확한 에러를 throw한다.
 * (순수 팩토리 — env에 의존하지 않아 단위 테스트가 쉽다.)
 */
export function createSupabaseClient(url: string, anonKey: string): SupabaseClient;

/**
 * 앱 전역에서 쓰는 단일 클라이언트(지연 생성). VITE_SUPABASE_URL/ANON_KEY로 1회 생성 후 캐시.
 */
export function getSupabase(): SupabaseClient;
```

- 에러 케이스: `createSupabaseClient`는 `url`이 빈 문자열이거나 `anonKey`가 빈 문자열이면
  `Error('Supabase 환경변수가 설정되지 않았습니다 (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)')`를 throw.
- 환경: `.env.example`에 `VITE_SUPABASE_URL=`, `VITE_SUPABASE_ANON_KEY=` 키만(값 없이). `.env`는 `.gitignore`.
- DB: `public.notes` 테이블 (id uuid pk default gen_random_uuid(), title text, content text,
  created_at timestamptz, updated_at timestamptz, tags text[] default '{}', is_pinned boolean default false,
  deleted_at timestamptz null). RLS 활성 + anon select/insert/update/delete 임시 허용.

## 테스트 시나리오

- [정상] createSupabaseClient — should 클라이언트 객체(`.from` 메서드 보유)를 반환한다 when url·anonKey가 모두 주어진다
- [예외] createSupabaseClient — should Error를 throw한다 when url이 빈 문자열이다
- [예외] createSupabaseClient — should Error를 throw한다 when anonKey가 빈 문자열이다

### AC 커버리지

- AC-A(유효 키로 import 시 클라이언트 생성, 키 누락 시 명확한 에러) → 위 3개 시나리오 전부
- AC-B(notes 테이블이 스키마대로 존재) → DB 마이그레이션으로 충족(단위 테스트 대상 아님 — `list_tables`로 확인)
