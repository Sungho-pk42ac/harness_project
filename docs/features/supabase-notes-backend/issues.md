# 수직 슬라이스 이슈 — supabase-notes-backend

> walking skeleton 먼저. 각 이슈는 `AC(Given/When/Then) ≠ DoD(체크리스트)`로 분리.
> 라벨: `feature/supabase-notes-backend`, `P0`, `slice:N`.

---

## SUPA-1 (walking skeleton) — Supabase 클라이언트·테이블·env 연결

**설명**: Supabase 연결의 뼈대를 세운다. `@supabase/supabase-js` 설치, `notes` 테이블 생성(스키마),
env·`supabaseClient.ts` 모듈 추가. 아직 `notes.ts`는 바꾸지 않는다(연결만, 동작 변화 없음).

**범위**: `package.json`(의존성), `.env.example`, `.gitignore`(.env), `src/api/supabaseClient.ts`,
(DB) `notes` 테이블 마이그레이션. **범위 밖**: notes.ts CRUD 교체(SUPA-2~4).

**AC**

- Given 유효한 `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`, When `supabaseClient`를 import, Then 단일
  Supabase 클라이언트 인스턴스가 생성된다(키 누락 시 명확한 에러).
- Given Supabase 프로젝트, When 마이그레이션 적용, Then `public.notes`가 스키마(id uuid pk, title/content
  text, created_at/updated_at timestamptz, tags text[], is_pinned bool default false, deleted_at timestamptz null,
  anon RLS)대로 존재한다.

**DoD**: `npm run build`(tsc) 성공 · 기존 145 테스트 그린 유지 · `supabaseClient` 단위 테스트(키 검증) 통과 · service_role 키 미포함.

---

## SUPA-2 — `fetchNotes`를 Supabase로 전환

**설명**: 읽기 경로를 Supabase로 교체. snake→camel 매퍼(`toNote`) 도입. `notes.test.ts`의 fetchNotes
케이스를 `supabaseClient` 모킹으로 재작성.

**범위**: `src/api/notes.ts`(`fetchNotes`+매퍼), `src/api/notes.test.ts`(해당 케이스). 시그니처·반환형 `Note[]` 불변.

**AC**

- Given Supabase에 노트 row들이 있을 때, When `fetchNotes()`, Then `Note[]`(camelCase)로 매핑돼 반환된다.
- Given Supabase가 에러를 반환할 때, When `fetchNotes()`, Then 기존과 같이 Error를 throw한다.

**DoD**: notes.test.ts fetchNotes 케이스 그린 · 컴포넌트/Context 테스트 무변경 그린 · tsc 성공.

---

## SUPA-3 — `createNote`·`updateNote`를 Supabase로 전환

**설명**: 쓰기 경로 교체. camel→snake 매퍼(`toRow`). 타임스탬프는 클라이언트가 채움. 반환은 생성/수정된 `Note`.

**범위**: `src/api/notes.ts`(`createNote`/`updateNote`+`toRow`), `notes.test.ts`(해당 케이스). 시그니처 불변.

**AC**

- Given 새 노트 payload, When `createNote`, Then insert 후 생성된 `Note`(id 포함)를 반환하고 created_at/updated_at가 채워진다.
- Given 기존 노트 id+부분 변경, When `updateNote`, Then 해당 row가 갱신되고 갱신된 `Note`를 반환한다(updated_at 갱신).
- Given Supabase 에러, When 각 함수, Then Error를 throw한다.

**DoD**: 해당 테스트 그린 · 회귀 0 · tsc 성공.

---

## SUPA-4 — `deleteNote` 전환 + 기존 db.json 데이터 시드

**설명**: 삭제 경로 교체(영구 삭제 = row 제거). 기존 `db.json`의 notes를 Supabase로 1회 시드 이관.

**범위**: `src/api/notes.ts`(`deleteNote`), `notes.test.ts`(해당), 데이터 시드(마이그레이션 또는 1회 스크립트).

**AC**

- Given 노트 id, When `deleteNote`, Then 해당 row가 Supabase에서 제거된다.
- Given 기존 db.json 노트들, When 시드 적용, Then Supabase `notes`에 그 노트들이 존재한다.

**DoD**: 해당 테스트 그린 · 회귀 0 · tsc 성공 · 앱이 JSON Server 없이 노트 CRUD 동작(수동 확인 로그).

---

## 등록된 GitHub 이슈 (역링크)

- SUPA-1 → #56
- SUPA-2 → #57
- SUPA-3 → #58
- SUPA-4 → #59
