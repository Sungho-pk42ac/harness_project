# 확정 정의서 — supabase-notes-backend

> 사람 인터뷰 대신 **멀티에이전트 합의**(PM·Tech Lead·User Advocate·Devil's Advocate)로 각 결정점을 확정.
> 각 결정에 근거를 단다. (auto-loop Phase 2-② 규칙)

## 1. 백엔드·SDK

- **결정**: Supabase Postgres + `@supabase/supabase-js`로 노트 CRUD만 교체. 인증은 이번 범위 밖.
- **근거**: API 호출이 `src/api/notes.ts` 단일 계층에 격리돼 교체 지점이 한 파일. 노트와 인증은 리스크
  프로파일이 달라(인증=세션·해싱·RLS) 분리한다. (Tech Lead·DA 합의)

## 2. id 타입 — `string` 유지 (uuid)

- **결정**: `Note.id`는 **`string` 그대로**. Supabase `notes.id`는 `uuid default gen_random_uuid()`.
- **근거**: 패널 일부가 "number→uuid 전환 비용"을 우려했으나, **코드 확인 결과 `src/types/note.ts`의 `id`는
  이미 `string`**이고 JSON Server도 문자열 id를 부여한다. 따라서 uuid가 자연스럽고 **타입 전파가 0**이다.
  (코드 사실로 합의 전제를 정정 — Claude 검증)

## 3. 스키마 & 컬럼 네이밍 — snake_case + api에서 매핑

- **결정**: 테이블 `public.notes` 컬럼은 Postgres 관례대로 **snake_case**(`created_at`, `updated_at`,
  `is_pinned`, `deleted_at`). `src/api/notes.ts`가 **camelCase ↔ snake_case 매핑**을 전담한다.
  `tags`는 `text[]`, `is_pinned`는 `boolean default false`, `deleted_at`은 `timestamptz null`.
- **근거**: `supabase-postgres-best-practices`(lowercase identifiers) 준수. 매핑을 경계(api)에 두면
  `Note` 타입(camelCase)과 앱 전체가 불변 → "시그니처 불변" 보장. (Tech Lead)

## 4. 타임스탬프 — 클라이언트가 채움 (기존 패턴 유지)

- **결정**: `created_at`/`updated_at`을 **클라이언트가 `new Date().toISOString()`으로 채워** insert/update.
  DB default(now())에 위임하지 않는다.
- **근거**: 기존 `api/notes.ts` 동작·테스트 기대와 동일하게 유지해 마이그레이션 충격 최소화. (DA)

## 5. 클라이언트 모듈 — `src/api/supabaseClient.ts` (DI·모킹 단일 지점)

- **결정**: `createClient(url, key)`를 감싼 단일 모듈을 만들고, `notes.ts`는 이 모듈만 import.
- **근거**: 테스트에서 이 모듈 하나만 `vi.mock`하면 됨 → 모킹 패턴을 slice-0에서 한 번 확정,
  이후 슬라이스는 재사용. (DA 리스크 A 완화)

## 6. 환경변수

- **결정**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`(publishable key `sb_publishable_...`).
  `.env`(gitignore) + `.env.example`(키 없는 템플릿) 추가.
- **근거**: Vite는 `VITE_` 접두사만 클라이언트에 노출. **publishable/anon 키만** 사용하고
  `service_role` 키는 **절대 클라이언트 번들에 넣지 않는다**(review 게이트 통과 조건). (DA 리스크 B)

## 7. RLS — anon 읽기/쓰기 임시 허용 (의도된 임시 상태)

- **결정**: `notes`에 RLS 활성 + anon read/write 정책. 사용자별 격리는 **다음 런 `supabase-auth-rls`**.
- **근거**: 인증이 없는 이번 범위에선 anon으로 동작해야 함. 임시 공개 상태임을 PRD Open Question에 명시하고
  다음 런 1순위로 큐잉. (DA)

## 8. 테스트 전략

- **결정**: `src/api/notes.test.ts`를 **`supabaseClient` 모킹** 기반으로 재작성(기존 `global.fetch` 모킹 대체).
  `from().select()/insert()/update()/delete()` 체이닝을 모킹. **Context·컴포넌트 테스트는 손대지 않는다**
  (시그니처 불변 — 깨지면 범위 위반 신호 → STOP).
- **근거**: 모킹 패러다임만 바뀌고 행위 계약은 동일. 충격을 `notes.test.ts` 1개로 격리. (Tech Lead·DA)

## 9. 데이터 이관

- **결정**: 기존 `db.json`의 notes를 Supabase `notes`로 **1회 시드**(slice-3). users는 이관하지 않음.
- **근거**: 기존 노트 보존. 인증 범위 밖이므로 users 제외. (PM)

## 영향 파일

- 신규: `src/api/supabaseClient.ts`, `.env.example`, (DB) `notes` 테이블 마이그레이션.
- 변경: `src/api/notes.ts`(내부 구현만), `src/api/notes.test.ts`(모킹 재작성), `package.json`(@supabase/supabase-js), `.gitignore`(.env).
- **불변**: `src/types/note.ts`, `src/context/*`, `src/components/*`, 그 테스트.
