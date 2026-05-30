# 이슈 #6 — TAG-1: 노트에 태그를 달고 저장하면 다시 열었을 때 보인다 (walking skeleton)

> 출처: GitHub 이슈 [#6](https://github.com/Sungho-pk42ac/harness_project/issues/6) · 라벨 `feature/tag` `P0` `slice:happy-path`
> 이 문서는 TDD 직전 단계 산출물입니다. **상단=확정 시그니처(계약)**, **하단=테스트 시나리오**. (test-scenarios 스킬 생성)
> 범위: 타입 → api/Context → NoteEditor 까지의 walking skeleton. 정규화·중복·개수(TAG-3)·삭제(TAG-2)·목록 표시(TAG-4)는 제외.

## 확정 시그니처

```ts
// ── src/types/note.ts ─────────────────────────────────────────────
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[]; // 신규. 기본값 []. 읽기 시 note.tags ?? [] 로 방어 (ADR-0001)
}

// ── src/api/notes.ts (시그니처 불변 — Note 타입으로 tags가 흐름) ────
// note 객체에 tags 포함(타입상 필수). 받은 값 그대로 POST (api는 가공 안 함, ADR-0003)
createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note>
//   에러: !res.ok → throw new Error('Failed to create note')
updateNote(id: string, updates: Partial<Note>): Promise<Note>
//   에러: !res.ok → throw new Error('Failed to update note')
// fetchNotes, deleteNote 변경 없음

// ── src/context/NotesContext.tsx ──────────────────────────────────
addNote(title: string, content: string, tags: string[]): Promise<void>  // tags 인자 추가 (ADR-0003)
//   내부: api.createNote({ title, content, tags }) → 응답으로 notes 상태 append
//   자체 try/catch 없음 → 에러는 호출부(편집기)로 전파
editNote(id: string, updates: Partial<Note>): Promise<void>             // 변경 없음. 호출부가 { title, content, tags } 전달
// 기본값 []는 호출부(편집기)에서 채움. api/Context는 가공 안 함

// ── src/components/NoteEditor.tsx ─────────────────────────────────
interface NoteEditorProps {   // 변경 없음
  selectedNoteId: string | null;
  isCreating: boolean;
  onDone: () => void;
}
// 태그는 외부 props가 아니라 편집기 내부 로컬 상태(tags: string[], tagInput: string)로 관리.
// 동작: 입력 텍스트를 Enter/쉼표로 tags에 append → 저장 시 addNote/editNote에 tags 전달 → 실패 시 try/catch+alert.
// 빈 입력 가드 없음(빈값/정규화/중복/개수는 TAG-3 소관).
```

## 테스트 시나리오

### createNote (api)

- [정상] createNote — should POST 요청 body에 tags를 포함해 보낸다 when tags가 담긴 note 객체를 받는다
- [정상] createNote — should 서버가 부여한 id와 tags를 가진 Note를 반환한다 when 요청이 성공한다
- [경계] createNote — should 빈 배열을 그대로 전송한다 when tags가 []다
- [예외] createNote — should Error('Failed to create note')를 throw한다 when res.ok가 false다

### updateNote (api)

- [정상] updateNote — should PATCH 요청 body에 tags를 포함한다 when updates에 tags가 있다
- [예외] updateNote — should Error('Failed to update note')를 throw한다 when res.ok가 false다

### addNote (Context)

- [정상] addNote — should api.createNote에 { title, content, tags }를 전달한다 when 호출된다
- [정상] addNote — should 반환된 노트를 notes 상태에 append한다 when 생성이 성공한다
- [경계] addNote — should 빈 tags로도 정상 생성한다 when tags가 []다
- [예외] addNote — should 에러를 호출부로 전파한다 when api.createNote가 throw한다 (자체 catch 없음)

### editNote (Context)

- [정상] editNote — should api.updateNote에 tags를 포함한 updates를 넘긴다 when { title, content, tags }로 호출된다
- [정상] editNote — should 갱신된 노트로 해당 항목을 교체한다 when 수정이 성공한다
- [예외] editNote — should 에러를 호출부로 전파한다 when api.updateNote가 throw한다

### NoteEditor (컴포넌트 동작)

- [정상] NoteEditor — should 입력 텍스트를 칩으로 추가한다 when 태그칸에 입력 후 Enter를 누른다
- [정상] NoteEditor — should 입력 텍스트를 칩으로 추가한다 when 태그칸에 쉼표(,)를 입력한다
- [정상] NoteEditor — should 현재 tags를 칩 목록으로 렌더한다 when tags가 비어있지 않다
- [정상] NoteEditor — should addNote(title, content, tags)를 호출한다 when 새 노트를 저장한다
- [정상] NoteEditor — should editNote(id, { title, content, tags })를 호출한다 when 기존 노트를 저장한다
- [경계] NoteEditor — should 에러 없이 태그 0개로 렌더한다 when 노트의 tags가 undefined다 (note.tags ?? [])
- [예외] NoteEditor — should 저장 실패 alert를 노출한다 when 저장 중 addNote/editNote가 throw한다

### AC 커버리지

| AC 시나리오                                    | 커버하는 테스트 시나리오                                                                                                                                        |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A — 새 노트에 태그 달고 저장 후 재오픈 시 보임 | `[정상] NoteEditor — Enter로 칩 추가` + `[정상] NoteEditor — addNote 호출` + `[정상] addNote — createNote에 tags 전달` + `[정상] createNote — 반환 Note에 tags` |
| B — 쉼표로 태그 추가                           | `[정상] NoteEditor — 쉼표로 칩 추가`                                                                                                                            |
| C — 기존(tags 없는) 노트 호환                  | `[경계] NoteEditor — tags undefined면 0개로 렌더`                                                                                                               |
| D — 기존 노트 수정 저장 영속화                 | `[정상] NoteEditor — editNote 호출` + `[정상] editNote — updateNote에 tags 전달` + `[정상] updateNote — PATCH body에 tags`                                      |
| E — 저장 실패 알림                             | `[예외] NoteEditor — 저장 실패 alert` (+ `[예외] addNote/editNote — 에러 전파`)                                                                                 |

> 모든 AC(A~E)가 1개 이상의 시나리오로 커버됨. 비고: DoD의 디자인 토큰·husky·lint·build·코드리뷰는 행위 검증이 아니라 게이트라 시나리오에서 제외.
