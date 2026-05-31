# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 목적

React 19 + TypeScript + Vite 기반의 **노트 CRUD 앱 실습 프로젝트**입니다.
강의용 코드베이스로, 아래 TDD 워크플로(수직 슬라이스)를 따라 기능을 한 이슈씩 쌓아 왔습니다.
지금까지 구현된 기능: **태그 · 로그인/인증 · 휴지통(소프트 삭제) · 핀 고정 · 정렬 · 통합 검색 ·
마크다운 미리보기 · 노트 복제 · 내보내기(.md)/백업(.json)**. 각 기능은 `docs/features/<기능>/`에
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

| 명령어               | 설명                                                           |
| -------------------- | -------------------------------------------------------------- |
| `npm run dev`        | Vite(5173) + JSON Server(3001) **동시 실행** (concurrently)    |
| `npm run server`     | JSON Server만 실행 — 프론트 없이 API만 띄울 때                 |
| `npm run build`      | `tsc` 타입체크 후 Vite 프로덕션 빌드                           |
| `npm run lint`       | ESLint 검사 (`--fix` 자동 적용됨)                              |
| `npm run format`     | Prettier 전체 포맷                                             |
| `npm test`           | Vitest 1회 실행 (단위·컴포넌트)                                |
| `npm run test:watch` | Vitest watch 모드                                              |
| `npm run e2e`        | Playwright E2E 실행                                            |
| `npm run dev:e2e`    | E2E용 서버 — `db.e2e.json`을 seed로 초기화 후 vite+json-server |

- 단일 단위 테스트 실행: `npx vitest run src/components/NoteEditor.test.tsx`
  또는 이름으로 필터링 `npx vitest run -t "저장"`
- 단일 E2E 실행: `npx playwright test e2e/tag.spec.ts`
- **테스트 배치**: 단위·컴포넌트 테스트는 소스 옆에 co-locate(`*.test.{ts,tsx}`), Vitest는 `src/`만
  수집(globals + jsdom + `src/test-setup.ts`). **E2E는 `e2e/`의 Playwright**로 분리되며 Vitest가
  수집하지 않습니다. E2E는 dev DB와 격리된 `db.e2e.json`을 매 실행 전 `e2e/seed.mjs`로 새로 초기화하고,
  단일 json-server를 공유하므로 **직렬 실행**(`workers: 1`)합니다.

## 아키텍처

> 의존성 다이어그램: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) (브라우저용: `docs/architecture/index.html`)

데이터는 **JSON Server**(`db.json`)가 `http://localhost:3001`로 제공하는 REST API(`/notes`, `/users`)에서
옵니다. 프론트엔드는 단방향으로 흐릅니다:

```
db.json ─ JSON Server ─ src/api/{notes,auth}.ts ─ {Notes,Auth}Context ─ 컴포넌트
                                                  └ src/lib, src/utils (순수 함수)
```

- **`src/api/notes.ts`, `src/api/auth.ts`** — 유일한 fetch 계층. notes는
  `fetchNotes / createNote / updateNote / deleteNote`, auth는 `login`.
  `createNote`/`updateNote`가 `createdAt`/`updatedAt` 타임스탬프를 **클라이언트에서** 채웁니다.
  컴포넌트는 절대 직접 `fetch`하지 말고 이 모듈을 통해야 합니다.
- **`src/context/NotesContext.tsx`** — 노트 상태의 단일 출처. `notes / loading / error`와
  `addNote / editNote / removeNote / togglePin / restoreNote / purgeNote / duplicateNote`를 노출.
  API 응답으로 로컬 `notes` 배열을 갱신(낙관적 업데이트 아님). `useNotes()` 훅으로만 접근(Provider 밖 호출 시 throw).
  **삭제는 소프트 삭제**(`removeNote`가 `deletedAt`을 PATCH) — 실제 제거는 `purgeNote`(휴지통의 영구 삭제)뿐.
- **`src/context/AuthContext.tsx`** — 인증 상태(`user / loading`)와 `login / logout`. 세션은
  `localStorage('auth.user')`에 영속화하고 앱 시작 시 복원(복원 중 `loading`으로 LoginPage 깜빡임 방지).
  `useAuth()` 훅으로만 접근.
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

- 모든 네트워크 호출은 **`src/api/notes.ts`에만** 존재. 컴포넌트/Context는 이 모듈만 호출.
- 각 함수: `async` + `fetch` + `if (!res.ok) throw new Error(...)` + `res.json()` 반환.
- 타임스탬프는 클라이언트가 채우고(`new Date().toISOString()`), **ID는 JSON Server가 부여**
  (POST 응답의 `id` 사용, 클라이언트 생성 금지).

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
  UI 노출 문구·주석은 한국어. 사용자 노출 메시지 기준이 섞여 있음.
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
