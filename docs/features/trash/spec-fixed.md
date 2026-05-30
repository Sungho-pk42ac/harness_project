# 휴지통(소프트 삭제·복구) 기능 정의서 (확정본)

> 원본 `spec.md`를 바탕으로 설계 질문의 답변을 반영해 구현 가능한 수준으로 구체화한 문서입니다.
> "어떻게·왜 이 선택"의 근거는 [ADR 인덱스](adr/README.md)에 분리해 둡니다.

## 기능 개요

노트 삭제를 **즉시 제거 대신 `deletedAt` 마킹(소프트 삭제)** 으로 바꾸고, **휴지통 화면**에서 삭제된 노트를 **복원**하거나 **영구 삭제**한다. 일반 목록에는 `deletedAt`이 없는 노트만 보인다.

## 기능 요구사항

- 노트를 삭제하면 즉시 제거하지 않고 `deletedAt`을 채운다(소프트 삭제).
- 일반 노트 목록에는 활성 노트(`deletedAt`이 없는 노트)만 표시한다.
- 휴지통 화면에서 삭제된 노트(`deletedAt`이 있는 노트)만 모아 본다.
- 휴지통에서 노트를 복원하면 `deletedAt`이 지워지고 일반 목록으로 돌아온다.
- 휴지통에서 노트를 영구 삭제하면 DB에서 실제로 제거된다(되돌릴 수 없음).

---

## 1. 데이터 / 상태 모델

### 1-1. 데이터 모델 (서버 = Context 소유)

- `Note`에 **선택적 `deletedAt?: string`** 필드를 추가한다(ISO 8601 문자열).
- **활성 노트의 기본 표현은 "필드 부재(`undefined`)"** 로 통일한다. 즉, 삭제되지 않은 노트는 `deletedAt`을 갖지 않는다. (근거: [ADR-0001](adr/0001-soft-delete-data-model.md))
- 삭제 시 `deletedAt = new Date().toISOString()` 을 채운다(타임스탬프는 **클라이언트**가 채운다 — 기존 `createdAt/updatedAt`과 동일 철학).
- 복원 시 `deletedAt`을 제거한다(JSON Server PATCH로 `null` 전송 → 서버에서 키 제거 또는 `null` 저장. 읽는 쪽은 truthy 여부로만 판정).
- **기존 노트 호환**: 기존 `db.json` 노트에는 `deletedAt`이 없다. 읽을 때 `note.deletedAt`이 falsy면 **활성**으로 취급하므로 마이그레이션이 필요 없다.

```ts
// src/types/note.ts
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  deletedAt?: string; // 추가: 소프트 삭제 시각(ISO). 없으면 활성 노트 (ADR-0001)
}
```

### 1-2. 활성/삭제 판정 (순수 함수)

목록을 거르는 로직은 **순수 함수**로 분리해 단위 테스트한다. (근거: [ADR-0002](adr/0002-active-trashed-derivation.md))

```ts
// src/utils/trash.ts
export function isTrashed(note: Note): boolean; // !!note.deletedAt
export function activeNotes(notes: Note[]): Note[]; // 휴지통이 아닌 것
export function trashedNotes(notes: Note[]): Note[]; // 휴지통인 것
```

- `NotesContext`의 `notes`(단일 출처)는 **활성·삭제를 모두 담는다**. 화면은 위 파생 함수로 걸러 보여줄 뿐 원본을 변형하지 않는다.

### 1-3. 화면 상태 (App 소유)

- "휴지통을 보고 있는가"는 **순수 화면 상태**이므로 `App.tsx`의 `useState`에 둔다 — `selectedNoteId`·`isCreating`과 같은 경계. (근거: [ADR-0002](adr/0002-active-trashed-derivation.md))

```ts
// App.tsx
const [view, setView] = useState<'notes' | 'trash'>('notes');
```

---

## 2. 삭제·복원·영구삭제 동작 (Context / API)

데이터는 `UI → NotesContext → api/notes.ts → 서버` 순서로 흐른다. 세 동작 모두 이 경로를 따른다.

### 2-1. 삭제 = 소프트 삭제 (기존 `removeNote` 의미 변경)

- 기존 `removeNote(id)`는 `deleteNote`(HTTP DELETE)를 호출했다. 이를 **`updateNote(id, { deletedAt })`** 호출로 바꿔 소프트 삭제로 전환한다.
- Context는 응답 기반 갱신 패턴을 유지: PATCH 응답으로 받은 노트로 해당 항목을 **교체(map)** 한다(필터로 제거하지 않는다 — 노트는 여전히 `notes`에 남아 휴지통에서 보여야 하므로).

```ts
removeNote(id: string) => Promise<void>   // 시그니처 동일, 의미만 소프트 삭제로
```

### 2-2. 복원

- `restoreNote(id)` 를 추가한다. `updateNote(id, { deletedAt: null })`로 `deletedAt`을 비우고, 응답으로 받은 노트로 교체(map).

```ts
restoreNote(id: string) => Promise<void>
```

### 2-3. 영구 삭제

- `purgeNote(id)` 를 추가한다. 기존 `api.deleteNote(id)`(HTTP DELETE)를 호출하고, 성공 시 로컬 `notes`에서 제거(filter).

```ts
purgeNote(id: string) => Promise<void>
```

### 2-4. API 계층

- `src/api/notes.ts`는 **변경 없음**. 소프트 삭제·복원은 기존 `updateNote(id, updates)`로, 영구 삭제는 기존 `deleteNote(id)`로 처리된다(`Note`에 `deletedAt`이 포함되어 자동 반영).
- "받은 걸 그대로 보낸다"는 기존 규칙을 유지하고, 기본값(`deletedAt` 채움/비움)은 **호출부(Context)** 에서 정한다.

### 2-5. 에러 처리

- 기존 패턴을 따른다 — Context의 변경 함수는 자체 catch 없이 호출부로 전파하고, **호출부에서 `try/catch` + `alert`**. (`NoteList.handleDelete` / `NoteEditor.handleSave`와 동일)

---

## 3. 표시 (UI)

### 3-1. 일반 노트 목록

- `NoteList`는 `activeNotes(notes)`만 렌더한다. 빈 상태 문구는 기존 "노트가 없습니다" 유지.

### 3-2. 휴지통 진입 UI

- 헤더에 **"휴지통" 토글 버튼**을 둔다(별도 라우트 도입 안 함 — 화면 상태로 전환). 휴지통을 보는 중엔 "노트로 돌아가기"로 토글된다.
- `view === 'trash'`이면 사이드바에 **휴지통 목록**을 렌더한다.

### 3-3. 휴지통 목록 (TrashList)

- `trashedNotes(notes)`만 렌더한다. 각 항목에 **"복원"** 과 **"영구 삭제"** 두 버튼을 둔다(목록의 "삭제" 버튼은 없음).
- 휴지통이 비어 있으면 **"휴지통이 비어 있습니다"** 전용 문구(활성 0건의 "노트가 없습니다"와 구분).
- 영구 삭제는 되돌릴 수 없으므로 **확인(confirm)** 후 실행한다.

### 3-4. 스타일

- 임의 색/그림자/인라인 style 금지. 시맨틱 토큰(`bg-card`, `text-muted-foreground`, `border-border`, `text-destructive` 등)만 사용. 휴지통 토글·복원·영구삭제 버튼은 기존 버튼 클래스 패턴을 재사용한다.

---

## 4. 저장 흐름 요약

```
[삭제]   목록 "삭제" → removeNote(id) → updateNote(id,{deletedAt:now}) → 응답으로 교체 → 활성 목록에서 사라짐
[복원]   휴지통 "복원" → restoreNote(id) → updateNote(id,{deletedAt:null}) → 응답으로 교체 → 활성 목록으로 복귀
[영구삭제] 휴지통 "영구 삭제" → confirm → purgeNote(id) → deleteNote(id) → 로컬에서 제거(filter)
```

선택 상태(`selectedNoteId`) 처리: 현재 편집 중인 노트가 삭제/영구삭제되면 `selectedNoteId`를 `null`로 되돌려 편집기를 빈 상태로 보낸다(편집기에서 사라진 노트를 가리키지 않도록).

---

## 5. 범위

### 이번 범위에 포함

- `Note.deletedAt?` 필드 추가 + 기존 노트 호환(`?? falsy` 판정).
- 삭제=소프트 마킹(`removeNote` 의미 변경), 복원(`restoreNote`), 영구삭제(`purgeNote`).
- 활성/삭제 파생 순수 함수(`isTrashed`/`activeNotes`/`trashedNotes`) + 단위 테스트.
- 휴지통 화면 상태(`App`의 `view`) + 헤더 토글 + `TrashList`.
- 일반 목록은 활성 노트만 표시.

### 이번 범위에서 제외 (다음 단계)

- **자동 비우기 스케줄**(N일 경과 자동 영구삭제).
- 다중 선택 일괄 복원/영구삭제, "휴지통 비우기" 일괄 버튼.
- 삭제 취소 토스트(Undo 스낵바), 휴지통 보관 기간 표시.

---

## 6. 테스트

- **파생 함수**(`isTrashed`/`activeNotes`/`trashedNotes`)에 Vitest 단위 테스트(입출력 분명).
- Context 동작(삭제→교체, 복원→교체, 영구삭제→제거)은 RED→GREEN 사이클에서 테스트로 고정.
- E2E(선택): 삭제→휴지통에서 보임→복원→목록 복귀, 영구삭제→사라짐 흐름.

---

## 7. 영향받는 파일

| 파일                                  | 변경 내용                                                       |
| ------------------------------------- | --------------------------------------------------------------- |
| `src/types/note.ts`                   | `deletedAt?: string` 필드 추가                                  |
| `src/api/notes.ts`                    | (변경 없음) `updateNote`/`deleteNote` 재사용                    |
| `src/utils/trash.ts` (신규)           | `isTrashed`/`activeNotes`/`trashedNotes` 순수 함수              |
| `src/context/NotesContext.tsx`        | `removeNote` 소프트 삭제로 변경, `restoreNote`/`purgeNote` 추가 |
| `src/App.tsx`                         | `view` 화면 상태, 헤더 토글, 휴지통/노트 슬롯 전환              |
| `src/components/Layout.tsx`           | 헤더에 휴지통 토글 버튼 슬롯                                    |
| `src/components/NoteList.tsx`         | `activeNotes`만 렌더                                            |
| `src/components/TrashList.tsx` (신규) | 휴지통 목록 + 복원·영구삭제 버튼 + 빈 상태                      |
| `src/**/*.test.ts(x)` (신규)          | 파생 함수·동작 단위 테스트                                      |
