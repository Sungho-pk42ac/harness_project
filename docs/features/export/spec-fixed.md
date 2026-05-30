# 노트 내보내기 기능 정의서 (확정본)

> 원본 `spec.md`를 바탕으로, 설계 질문의 답변을 반영해 구현 가능한 수준으로 구체화한 문서입니다.

## 기능 개요

노트를 로컬 파일로 내보낸다. 두 가지 경로를 제공한다.

- **단일 노트 → 마크다운(.md)**: 지금 열려 있는 노트 1건을 사람이 읽기 좋은 마크다운으로 다운로드한다.
- **전체 노트 → JSON(.json)**: 모든 노트를 기계가 다시 읽을 수 있는 백업 파일 하나로 다운로드한다.

## 기능 요구사항

- 편집기에서 현재 노트를 `.md`로 내보낼 수 있다.
- 헤더(앱 전역)에서 전체 노트를 `.json` 한 파일로 백업할 수 있다.
- 파일명에 제목/날짜가 들어가 식별할 수 있다.
- 서버·데이터 모델 변경 없이 클라이언트 Blob 다운로드만으로 동작한다.

---

## 1. 데이터 / 상태 모델

내보내기는 **읽기·파생 계산만** 한다. 새 상태도, 서버 호출도, 모델 변경도 없다.

- 소스 데이터: `NotesContext`의 `notes`(단일 출처)와 편집기가 들고 있는 현재 노트.
- 새로 추가하는 상태는 **없다**(다운로드는 클릭 시점의 일회성 부수효과).
- 변환 로직은 **순수 함수**로 분리한다.
  ```ts
  // src/lib/export.ts
  export function noteToMarkdown(note: Note): string; // 노트 1건 → 마크다운 문자열
  export function notesToJson(notes: Note[]): string; // 노트 배열 → JSON 백업 문자열
  export function buildExportFilename(base: string, ext: 'md' | 'json', date?: Date): string; // 파일명 생성
  ```
- 실제 다운로드(Blob 생성 → `URL.createObjectURL` → 가짜 `<a>` 클릭 → revoke)는 부수효과 헬퍼로 분리한다.
  ```ts
  // src/lib/download.ts
  export function downloadTextFile(filename: string, text: string, mime: string): void;
  ```

> 순수 변환 함수와 부수효과(다운로드)를 나눠, 변환은 단위 테스트하고 다운로드는 얇게 유지한다.

---

## 2. 입력 / 트리거 (어디서 누르나)

- **단일 `.md` 내보내기**: `NoteEditor` 안, 기존 저장/취소 버튼 줄에 **"내보내기"** 버튼을 둔다.
  - 노트를 보고 있을 때(선택됨)만 활성. **아직 저장 안 된 새 노트(`isCreating`)** 에서는 비활성/미표시(영속 데이터가 없음).
  - 클릭 시 **현재 편집 중 화면 상태가 아니라 저장된 노트(`selectedNote`)** 를 기준으로 내보낸다(혼동 방지). 미저장 변경은 내보내기 대상이 아님을 분명히 한다.
- **전체 `.json` 백업**: `Layout` 헤더의 "+ 새 노트" 옆에 **"백업"** 버튼을 둔다.
  - 노트가 0건이면 비활성.

---

## 3. 변환 규칙 (매칭·동작)

### 3.1 단일 노트 → 마크다운

```
# {title}

{content}

---
태그: {tags.join(', ')}      ← tags가 1개 이상일 때만 이 줄 출력
```

- 제목은 `# ` 헤딩으로, 본문은 그대로(본문은 사용자가 친 텍스트이므로 변형하지 않음).
- 태그가 **없으면 태그 줄과 구분선(`---`)을 생략**한다.
- `note.tags ?? []`로 구버전 노트를 방어한다(태그 기능과 동일 철학).
- 줄바꿈은 `\n`. 파일은 UTF-8.

### 3.2 전체 노트 → JSON

- `NotesContext.notes` **배열을 그대로** `JSON.stringify(notes, null, 2)`로 직렬화한다(들여쓰기 2칸, 사람이 열어봐도 읽힘).
- 별도 메타 래퍼(`{ version, exportedAt, notes }`)는 **이번 범위 제외** — 가져오기(import)를 안 하므로 단순 배열이면 충분(YAGNI). 근거는 ADR-0002.
- `id/createdAt/updatedAt/tags`를 포함한 노트 원본을 손실 없이 담는다.

### 3.3 파일명 규칙

- 단일 md: `{안전제목}-{YYYY-MM-DD}.md` (예: `회의록-2026-05-31.md`).
- 전체 json: `notes-backup-{YYYY-MM-DD}.json`.
- **안전제목**: 제목에서 파일명 금지/위험 문자(`\ / : * ? " < > |`와 제어문자)를 `-`로 치환하고 trim. 빈 제목이면 `untitled`.
- 날짜는 `toISOString().slice(0, 10)`으로 `YYYY-MM-DD`(로컬 표시 혼동을 피해 ISO 날짜만 사용).

---

## 4. 표시 / 피드백

- 버튼은 **디자인 토큰만** 사용(편집기 보조 버튼은 `bg-muted text-muted-foreground`, 헤더 버튼은 헤더 톤과 일치). 임의 색/그림자/인라인 style 금지.
- 다운로드는 브라우저 기본 동작(파일 저장)으로 끝나며, **별도 토스트·알림은 두지 않는다**(MVP — 브라우저가 이미 피드백을 줌).
- 노트 0건/미저장 등 **내보낼 게 없을 때는 버튼을 비활성**으로 표현해 클릭 자체를 막는다(에러 대신 예방).
- 접근성: 버튼에 명확한 텍스트 라벨, 키보드 포커스·클릭 가능.

---

## 5. 저장(다운로드) 흐름

```
[단일 .md]
편집기 "내보내기" 클릭 → selectedNote 확보 → noteToMarkdown(note)
  → buildExportFilename(note.title, 'md') → downloadTextFile(name, md, 'text/markdown')
[전체 .json]
헤더 "백업" 클릭 → notes 확보 → notesToJson(notes)
  → buildExportFilename('notes-backup', 'json') → downloadTextFile(name, json, 'application/json')
```

- 모든 단계는 **동기**(서버 왕복 없음). 실패 지점이 거의 없으나, Blob/URL 생성이 예외를 던지면 `try/catch` 후 기존 패턴대로 `alert`로 알린다.
- `URL.createObjectURL`로 만든 객체 URL은 클릭 직후 `URL.revokeObjectURL`로 해제해 메모리 누수를 막는다.

---

## 6. 범위

### 이번 범위에 포함

- 단일 노트 `.md` 내보내기(제목·본문·태그 변환, 파일명에 제목+날짜).
- 전체 노트 `.json` 백업(배열 직렬화, 파일명에 날짜).
- 내보낼 게 없을 때 버튼 비활성.
- 변환 순수 함수 단위 테스트.

### 이번 범위에서 제외 (다음 단계)

- **PDF·HTML 내보내기** (렌더링/라이브러리 의존 → 별도 기능).
- **가져오기(import)** (파싱·검증·머지 정책이 큰 별도 주제).
- **클라우드 업로드 / 공유 링크**.
- **선택 다중 내보내기**(여러 노트를 골라 한 번에), **zip 묶음**.
- **내보내기 메타 래퍼·버전 필드**(import이 없으므로 불필요, YAGNI).
- 다운로드 완료 **토스트/히스토리**.

---

## 7. 테스트

- 변환 순수 함수에 단위 테스트(Vitest)를 둔다 — 입출력이 명확해 적합.
  - `noteToMarkdown`: 태그 있음/없음, 빈 본문, 다국어 제목.
  - `notesToJson`: 빈 배열, 다건, 들여쓰기 형식.
  - `buildExportFilename`: 위험문자 치환, 빈 제목→`untitled`, 날짜 포맷.
- 다운로드 부수효과(`downloadTextFile`)는 `URL.createObjectURL`/anchor click을 mock해 호출·인자만 검증(브라우저 저장 자체는 E2E 영역).

---

## 8. 영향받는 파일

| 파일                            | 변경 내용                                                      |
| ------------------------------- | -------------------------------------------------------------- |
| `src/lib/export.ts` (신규)      | `noteToMarkdown`/`notesToJson`/`buildExportFilename` 순수 함수 |
| `src/lib/download.ts` (신규)    | `downloadTextFile` Blob 다운로드 부수효과 헬퍼                 |
| `src/components/NoteEditor.tsx` | "내보내기"(.md) 버튼 추가, 저장된 노트 기준 내보내기           |
| `src/components/Layout.tsx`     | 헤더에 "백업"(.json) 버튼 슬롯/콜백 추가                       |
| `src/App.tsx`                   | 전체 백업 핸들러를 `Layout`에 주입(헤더 액션은 App이 소유)     |
| `src/**/*.test.ts` (신규)       | 변환·파일명·다운로드 단위 테스트                               |

> 데이터 모델(`src/types/note.ts`)·API 계층(`src/api/notes.ts`)·`NotesContext`는 **변경하지 않는다**(읽기만).
