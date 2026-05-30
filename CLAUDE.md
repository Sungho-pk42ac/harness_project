# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 목적

React 19 + TypeScript + Vite 기반의 **노트 CRUD 앱 실습 프로젝트**입니다.
강의용 코드베이스로, 일부 기능은 의도적으로 미완성 상태입니다 (예: `src/types/note.ts`의 `tags` 필드는
강의에서 추가할 예정이라는 주석이 달려 있음). 기능을 확장할 때 이런 의도된 빈자리를 참고하세요.

## 명령어

| 명령어               | 설명                                                        |
| -------------------- | ----------------------------------------------------------- |
| `npm run dev`        | Vite(5173) + JSON Server(3001) **동시 실행** (concurrently) |
| `npm run server`     | JSON Server만 실행 — 프론트 없이 API만 띄울 때              |
| `npm run build`      | `tsc` 타입체크 후 Vite 프로덕션 빌드                        |
| `npm run lint`       | ESLint 검사 (`--fix` 자동 적용됨)                           |
| `npm run format`     | Prettier 전체 포맷                                          |
| `npm test`           | Vitest 1회 실행                                             |
| `npm run test:watch` | Vitest watch 모드                                           |

- 단일 테스트 실행: `npx vitest run src/components/NoteEditor.test.tsx`
  또는 이름으로 필터링 `npx vitest run -t "저장"`
- **주의**: 아직 테스트 파일이 없습니다. Vitest 설정(globals + jsdom + `src/test-setup.ts`)만
  갖춰져 있으므로, 테스트 작성 시 `*.test.tsx`를 `src/` 하위에 추가하면 됩니다.

## 아키텍처

> 의존성 다이어그램: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) (브라우저용: `docs/architecture/index.html`)

데이터는 **JSON Server**(`db.json`)가 `http://localhost:3001/notes`로 제공하는 REST API에서 옵니다.
프론트엔드는 단방향으로 흐릅니다:

```
db.json ─ JSON Server ─ src/api/notes.ts ─ NotesContext ─ 컴포넌트
```

- **`src/api/notes.ts`** — 유일한 fetch 계층. `fetchNotes / createNote / updateNote / deleteNote`.
  `createNote`/`updateNote`에서 `createdAt`/`updatedAt` 타임스탬프를 **클라이언트에서** 채웁니다.
  컴포넌트는 절대 직접 `fetch`하지 말고 이 모듈을 통해야 합니다.
- **`src/context/NotesContext.tsx`** — 전역 상태의 단일 출처(single source of truth).
  `notes / loading / error`와 `addNote / editNote / removeNote`를 노출.
  API 호출 성공 후 로컬 `notes` 배열을 갱신하는 패턴(낙관적 동기화 아님, 응답 기반 갱신)을 따릅니다.
  상태에 접근할 땐 반드시 `useNotes()` 훅 사용 (Provider 밖에서 호출 시 throw).
- **`src/App.tsx`** — `selectedNoteId`와 `isCreating` UI 상태를 소유하고
  `Layout`에 `sidebar`/`main` 슬롯으로 주입. 서버 데이터 상태는 Context, 화면 선택 상태는 App이 담당.
- 컴포넌트는 props로 선택/생성 상태를 받고, 데이터 변경은 `useNotes()`로 수행하는
  **컨테이너-프레젠테이션 혼합** 패턴입니다.

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

## ⚠️ 발견된 비일관성 (정리/통일 시 참고)

- **export 방식**: `App.tsx`만 `export default`, 나머지 컴포넌트는 named export. 통일 권장.
- **에러 메시지 언어**: `api/notes.ts`는 영어(`'Failed to fetch notes'`)로 throw하지만
  UI 노출 문구·주석은 한국어. 사용자 노출 메시지 기준이 섞여 있음.
- **boolean 네이밍**: `isCreating`/`isSelected`(is 접두사)와 `loading`/`saving`(접두사 없음)이 혼재.
- **에러 처리 위치**: Context의 변경 함수(`addNote`/`editNote`/`removeNote`)는 자체 catch가 없고,
  **호출부에서 try/catch+`alert`**로 처리하는 패턴. (삭제 실패 미처리 버그는 `NoteList.handleDelete`
  추가로 수정 완료 — 새 변경 함수도 이 호출부 처리 패턴을 따를 것.)
- **인라인 style 혼용**: 대부분 Tailwind 클래스지만 `Layout`은 `style={{ height: 'calc(100vh - 65px)' }}`,
  `fontFamily`를 인라인으로 사용(65px 매직넘버). 그림자도 `shadow-[0_2px_12px_rgba(...)]` 임의값이 반복됨.

## 코드 스타일 참고

전역 규칙(`~/.claude/CLAUDE.md`)에 camelCase 변수명, 함수 JSDoc, 한국어 주석, `console.log` 대신 로깅
라이브러리 사용이 명시되어 있으나 — 이 코드베이스는 아직 JSDoc과 로깅 라이브러리가 도입되지 않았습니다.
새 코드 작성 시 전역 규칙을 우선 적용하되, 기존 코드 스타일(한국어 주석, camelCase)과 일관성을 맞추세요.
