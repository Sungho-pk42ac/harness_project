# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 목적

React 19 + TypeScript + Vite 기반의 **노트 CRUD 앱 실습 프로젝트**입니다.
강의용 코드베이스로, 아래 TDD 워크플로(수직 슬라이스)를 따라 기능을 한 이슈씩 쌓아 왔습니다.
지금까지 구현된 기능: **태그 · 로그인/회원가입(Supabase Auth) · 휴지통(소프트 삭제) · 핀 고정 · 정렬 ·
통합 검색 · 마크다운 미리보기 · 노트 복제 · 내보내기(.md)/백업(.json) · 자동저장**. 백엔드는 **Supabase**
(Postgres + Auth + RLS)이고 **Vercel**로 배포합니다. 각 기능은 `docs/features/<기능>/`에
spec → spec-fixed → PRD → ADR → issues 순으로 설계 문서를 남깁니다 (새 기능도 이 구조를 따르세요).

## 새 이슈 작업 사이클 (TDD 워크플로) — 반드시 준수

새 이슈(예: TAG-N)를 구현할 때는 **아래 7단계를 순서대로** 진행합니다. 각 단계는 지정된
**스킬 또는 에이전트로만** 실행하고, 이전 단계 산출물을 입력으로 받습니다.

**🚦 핵심 규칙 — 인간 승인 게이트(Human-in-the-loop):**
각 단계를 마치면 **결과를 보고하고 멈춥니다(STOP)**. 사용자가 명시적으로 승인("다음", "진행", "ok" 등)하기
전에는 **절대 다음 단계로 넘어가지 않습니다.** 한 번에 여러 단계를 몰아서 실행하지 않습니다. 단계를
건너뛰거나 순서를 바꾸지 않습니다. 게이트에서 실패가 나오면 해당 단계로 되돌아갑니다.

| #   | 단계         | 실행 주체                        | 산출물 / 통과 기준                                                                  | 승인 게이트        |
| --- | ------------ | -------------------------------- | ----------------------------------------------------------------------------------- | ------------------ |
| 1   | **시나리오** | `test-scenarios` (skill)         | 시그니처(계약) 확정 + `should…when…` 시나리오 → `docs/features/<기능>/issue-{N}.md` | 시나리오 승인 후 ▶ |
| 2   | **RED**      | `tdd-red` (skill)                | 시나리오를 **실패하는 Vitest 테스트**로 변환, RED 확인(최소 스텁만)                 | RED 확인 후 ▶      |
| 3   | **GREEN**    | `tdd-green` (skill)              | **최소 구현**으로 전부 통과(GREEN), 테스트 수정 금지                                | GREEN 확인 후 ▶    |
| 4   | **AC 검증**  | `ac-fulfillment-auditor` (agent) | 테스트 통과가 아니라 **각 AC 의도가 코드에 반영됐는지** 검증                        | 결과 검토 후 ▶     |
| 5   | **REFACTOR** | `tdd-refactor` (skill)           | **초록불 유지**한 채 구조·가독성만 개선(동작 불변)                                  | 변경 검토 후 ▶     |
| 6   | **REVIEW**   | `tdd-review` (skill)             | 커밋 전 타입(`tsc`)·보안 점검 → Blocker/Warning/Pass 분류, **Blocker 0**            | 판정 승인 후 ▶     |
| 7   | **통합**     | `/commit` → PR                   | 커밋 → PR(**base: `feature/<spec>`**) → **squash merge** → **이슈 클로즈**          | 각 액션 전 승인    |

**7단계(통합) 세부:** `tdd-review` 통과 후에만 진행한다. ① `/commit`으로 커밋, ② 현재 브랜치를 push,
③ **base `feature/<spec>`** 로 PR 생성, ④ 리뷰 후 **squash merge**(커밋 1개로 압축), ⑤ 머지되면 해당
**GitHub 이슈를 클로즈**한다(PR 본문에 `Closes #N`). push·PR·merge·이슈 클로즈는 **각각 사용자 승인 후** 실행한다.

> 한 사이클 = 한 수직 슬라이스(이슈). 인접 기능(정규화·삭제·목록 표시 등)은 그 이슈의 테스트가 없으면
> 구현하지 않고, 별도 이슈로 새 사이클을 엽니다.

## 명령어

| 명령어               | 설명                                                                       |
| -------------------- | -------------------------------------------------------------------------- |
| `npm run dev`        | Vite 개발 서버(5173) 실행. **데이터는 원격 Supabase** — 로컬 API 서버 없음 |
| `npm run build`      | `tsc` 타입체크 후 Vite 프로덕션 빌드                                       |
| `npm run lint`       | ESLint 검사 (`--fix` 자동 적용됨)                                          |
| `npm run format`     | Prettier 전체 포맷                                                         |
| `npm test`           | Vitest 1회 실행 (단위·컴포넌트)                                            |
| `npm run test:watch` | Vitest watch 모드                                                          |
| `npm run e2e`        | Playwright E2E 실행                                                        |
| `npm run dev:e2e`    | E2E용 서버 — `e2e/seed.mjs`로 Supabase 테스트 계정을 준비 후 vite 실행     |

- 단일 단위 테스트 실행: `npx vitest run src/components/NoteEditor.test.tsx`
  또는 이름으로 필터링 `npx vitest run -t "저장"`
- 단일 E2E 실행: `npx playwright test e2e/tag.spec.ts`
- **테스트 배치**: 단위·컴포넌트 테스트는 소스 옆에 co-locate(`*.test.{ts,tsx}`), Vitest는 `src/`만
  수집(globals + jsdom + `src/test-setup.ts`). **E2E는 `e2e/`의 Playwright**로 분리되며 Vitest가
  수집하지 않습니다. E2E는 매 실행 전 `e2e/seed.mjs`(service_role 키로 RLS 우회)가 **데모 계정
  `test@test.com` / `1234`**를 준비하고(이미 있으면 무시), 원격 Supabase를 공유하므로 **직렬
  실행**(`workers: 1`)합니다. _(주의: `playwright.config.ts` 주석은 아직 json-server/`db.e2e.json`을
  언급하지만 실제로는 Supabase 시드만 돌립니다 — 주석이 stale.)_

## 환경변수 / 배포

- **`.env`**(git 무시, `.env.example` 참고)에 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`가 있어야
  앱이 동작합니다. 둘 중 하나라도 비면 `getSupabase()`가 명확한 에러를 throw합니다.
- **E2E 시드 전용**(로컬/CI에서만, 절대 커밋 금지): `SUPABASE_SERVICE_ROLE_KEY` — `e2e/seed.mjs`가 RLS를
  우회해 데모 계정을 만들 때 사용. 없으면 시드가 실패 종료합니다.
- **배포는 Vercel**(`vercel.json`: framework `vite`, SPA rewrite). 같은 `VITE_*` 변수를 Vercel 프로젝트
  환경변수에 등록해야 합니다. 자세한 내용은 `docs/features/vercel-deploy-config/`.

## 아키텍처

> 의존성 다이어그램: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) (브라우저용: `docs/architecture/index.html`)

데이터는 **Supabase**(Postgres + Auth)에서 옵니다. `notes` 테이블은 **RLS**로 보호되어 각 사용자가
자신의 노트(`user_id = auth.uid()`)만 읽고 씁니다. 인증은 Supabase Auth(이메일/비밀번호)입니다.
프론트엔드는 단방향으로 흐릅니다:

```
Supabase(Postgres+Auth) ─ src/api/supabaseClient.ts ─ src/api/{notes,auth}.ts ─ {Notes,Auth}Context ─ 컴포넌트
                                                                              └ src/lib, src/utils (순수 함수)
```

> ⚠️ **JSON Server는 더 이상 쓰지 않습니다**(과거 백엔드). `json-server`가 `devDependencies`에, `db.json`·
> `db.e2e.json`이 파일로 남아 있지만 **죽은 코드**입니다(`npm run server`·`localhost:3001` 제거됨).
> 새 데이터 접근은 전부 Supabase 경유.

- **`src/api/supabaseClient.ts`** — 앱 전역 Supabase 클라이언트의 단일 출처. `createSupabaseClient(url, key)`는
  env에 의존하지 않는 순수 팩토리(테스트 용이)이고, `getSupabase()`가 env로 1회 지연 생성·캐시합니다.
  api 계층은 이 함수만 호출하므로 **테스트는 이 모듈 하나만 모킹**하면 됩니다.
- **`src/api/notes.ts`, `src/api/auth.ts`** — 유일한 데이터 접근 계층(전부 `getSupabase()` 사용). notes는
  `fetchNotes / createNote / updateNote / deleteNote`, auth는 `login / signUp / logout / getSessionUser / onAuthChange`.
  notes는 DB의 **snake_case row ↔ 앱의 camelCase `Note`**를 `toNote`/`toRow`로 매핑하고, `createNote`는
  RLS(`user_id = auth.uid()`)를 만족하도록 세션 `user_id`를 명시 주입합니다.
  `createNote`/`updateNote`가 타임스탬프를 **클라이언트에서** 채우고, **ID는 DB(`gen_random_uuid`)가 부여**합니다.
  컴포넌트는 절대 직접 `fetch`/`supabase`를 호출하지 말고 이 모듈을 통해야 합니다.
  (주의: `deleteNote`는 실제 DELETE — **소프트 삭제는 `updateNote`로 `deletedAt`을 채우는** Context의 `removeNote`이고, `purgeNote`만 `deleteNote`로 영구 제거합니다.)
- **`src/context/NotesContext.tsx`** — 노트 상태의 단일 출처. `notes / loading / error`와
  `addNote / editNote / removeNote / togglePin / restoreNote / purgeNote / duplicateNote`를 노출.
  API 응답으로 로컬 `notes` 배열을 갱신(낙관적 업데이트 아님). `useNotes()` 훅으로만 접근(Provider 밖 호출 시 throw).
  **삭제는 소프트 삭제**(`removeNote`가 `updateNote`로 `deletedAt`을 채움) — 실제 제거는 `purgeNote`(휴지통의 영구 삭제)뿐.
- **`src/context/AuthContext.tsx`** — 인증 상태(`user / loading`)와 `login / signup / logout`. 세션 영속화는
  **supabase-js가 담당**(localStorage 수동 관리 제거) — 앱 시작 시 `getSessionUser()`로 복원하고
  `onAuthChange`로 상태 변화를 구독합니다(복원 중 `loading`으로 LoginPage 깜빡임 방지). `useAuth()` 훅으로만 접근.
- **`src/App.tsx`** — `AuthProvider`로 전체를 감싸고, `AppContent`가 **인증 게이트**(미로그인→`LoginPage`,
  로그인→`NotesProvider`+노트 화면) 역할. 화면 UI 상태(`selectedNoteId`, `isCreating`, `view`(notes/trash),
  `sortBy`/`sortDir`, `searchQuery`)를 모두 App이 소유하고 `Layout`에 `sidebar`/`main` 슬롯으로 주입.
- **`src/lib/`** — 부수효과/도메인 변환 헬퍼: `tag`(정규화·검증), `duplicate`(복제 페이로드),
  `export`(노트→마크다운/백업 JSON), `download`(Blob 다운로드). **`src/utils/`** — 목록 가공 순수 함수:
  `filterNotes`(검색), `sortNotes`(정렬), `partitionByPinned`(핀 분리), `trash`(삭제 판정). 모두 원본 불변.
  **새 도메인 로직은 컴포넌트가 아니라 이 순수 모듈에 두고 단위 테스트**하는 것이 이 코드베이스의 패턴입니다.
- 컴포넌트는 props로 선택/생성/화면 상태를 받고, 데이터 변경은 `useNotes()`로 수행하는
  **컨테이너-프레젠테이션 혼합** 패턴입니다.

### 데이터 모델 진화 (구버전 방어)

`Note`(`src/types/note.ts`)는 이슈마다 필드가 추가돼 왔습니다: `tags: string[]`(태그),
`isPinned: boolean`(핀), `deletedAt?: string | null`(소프트 삭제). DB에 구버전 노트가 남아 있을 수 있으므로
**읽기 시 항상 방어**합니다 — `note.tags ?? []`, `note.isPinned ?? false`, `deletedAt`은 falsy면 활성.
새 필드를 추가할 때도 같은 패턴(옵셔널 + 읽기 시 기본값)을 따르세요.

## 구현 패턴 / 컨벤션

### 컴포넌트 패턴

- **함수 선언 + named export**: `export function ComponentName(props) { ... }` 형태.
  (단 `App.tsx`만 `export default` — 아래 비일관성 참고)
- Props 타입은 컴포넌트 **바로 위에 `ComponentNameProps` 인터페이스**로 정의 (별도 파일 분리 안 함).
- **프레젠테이션 컴포넌트는 콜백을 props로** 받아 동작 (`onSelect`, `onDelete`, `onDone`, `onNewNote`).
  데이터 변경은 props 콜백 또는 `useNotes()`로, 자체 fetch는 하지 않음.
- **조건부 early-return**으로 loading/error/empty 상태를 먼저 렌더 후 본문 (`NoteList` 참고).
- `Layout`은 `sidebar`/`main`을 `ReactNode` **슬롯 props**로 받는 합성(composition) 패턴.

### 상태 관리

- **서버 데이터 → Context**(`notes/loading/error`), **UI 선택 상태 → `App`의 `useState`**
  (`selectedNoteId`, `isCreating`). 이 경계를 새 기능에서도 유지하세요.
- Context의 변경 함수는 **API 응답으로 로컬 배열을 갱신**(낙관적 업데이트 아님):
  `add`→append, `edit`→map, `remove`→filter.
- 폼 상태는 컴포넌트 로컬(`useState`)이며, `selectedNoteId` 변경 시 `useEffect`로 동기화
  (`NoteEditor`, deps 경고는 `eslint-disable-line`으로 무시).

### API 호출 패턴

- 모든 데이터 접근은 **`src/api/{notes,auth}.ts`에만** 존재(내부적으로 `getSupabase()`). 컴포넌트/Context는 이 모듈만 호출.
- 각 함수: `async` + supabase 쿼리 + `if (error) throw new Error(...)` 후 매핑된 결과 반환.
- 타임스탬프는 클라이언트가 채우고(`new Date().toISOString()`), **ID는 DB(`gen_random_uuid`)가 부여**
  (insert 응답의 `id` 사용, 클라이언트 생성 금지).

### 네이밍

- 컴포넌트/인터페이스 `PascalCase`, 변수/함수 `camelCase`.
- 이벤트 핸들러는 **`handleXxx`**(App 내부), 콜백 props는 **`onXxx`**.
- API 함수는 **동사 + 명사**(`fetchNotes`, `createNote`, `updateNote`, `deleteNote`).

### 스타일링

- Tailwind CSS v4 (`@tailwindcss/vite`, 별도 config 없음). 색상은 `bg-card`,
  `text-muted-foreground`, `border-border`, `text-destructive` 등 **시맨틱 토큰** 사용 —
  `src/index.css`의 CSS 변수 기반이므로 임의 색상값 대신 토큰을 따르세요.
- UI를 새로 만들거나 스타일을 바꿀 땐 **디자인 시스템**(`docs/design-system/`, `design-system` 스킬)을
  따릅니다. 임의 hex 색상·임의 그림자(`shadow-[…]`)·인라인 `style={{…}}`은 아래 커밋 게이트가 차단합니다.

## 커밋 전 자동 품질 게이트

husky pre-commit이 **lint-staged**를 돌립니다 (`package.json`의 `lint-staged` 참고):

- `*.ts(x)` → `eslint --fix` + `prettier --write`
- `*.tsx`/`*.css` → 추가로 **`scripts/check-design-system.mjs`** — 임의 hex 색상, 임의 그림자값
  (`shadow-[…]`), 인라인 `style={{`를 찾으면 **종료 코드 1로 커밋을 막습니다**. 시맨틱 토큰/공통 클래스로 고치세요.
- 커밋 메시지는 **commitlint**(`@commitlint/config-conventional`)로 검증 — Conventional Commits 형식 필수.

## ⚠️ 발견된 비일관성 (정리/통일 시 참고)

- **export 방식**: `App.tsx`만 `export default`, 나머지 컴포넌트는 named export. 통일 권장.
- **에러 메시지 언어**: `api/notes.ts`는 영어(`'Failed to fetch notes'`)로 throw하지만
  UI 노출 문구·주석은 한국어. 사용자 노출 메시지 기준이 섞여 있음. (단 `api/auth.ts`의 `'Invalid credentials'`는
  `LoginPage`가 한국어로 매핑하므로 문구를 바꾸면 안 됨.)
- **죽은 의존성/파일**: `json-server`(devDep)·`db.json`·`db.e2e.json`은 Supabase 이행 후 미사용. 제거 후보.
- **boolean 네이밍**: `isCreating`/`isSelected`(is 접두사)와 `loading`/`saving`(접두사 없음)이 혼재.
- **에러 처리 위치**: Context의 변경 함수(`addNote`/`editNote`/`removeNote`)는 자체 catch가 없고,
  **호출부에서 try/catch+`alert`**로 처리하는 패턴. (삭제 실패 미처리 버그는 `NoteList.handleDelete`
  추가로 수정 완료 — 새 변경 함수도 이 호출부 처리 패턴을 따를 것.)
- ~~인라인 style·임의 그림자값 혼용~~ → 디자인 시스템 적용(#55)으로 정리 완료. 현재 `src/`에 인라인
  `style={{`·`shadow-[…]`·임의 hex가 없으며, 커밋 게이트(`check-design-system.mjs`)가 재유입을 막습니다.

## 코드 스타일 참고

전역 규칙(`~/.claude/CLAUDE.md`)에 camelCase 변수명, 함수 JSDoc, 한국어 주석, `console.log` 대신 로깅
라이브러리 사용이 명시되어 있으나 — 이 코드베이스는 아직 JSDoc과 로깅 라이브러리가 도입되지 않았습니다.
새 코드 작성 시 전역 규칙을 우선 적용하되, 기존 코드 스타일(한국어 주석, camelCase)과 일관성을 맞추세요.
