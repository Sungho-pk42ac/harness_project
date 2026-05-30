# ADR-0001 — 기존 `addNote` 재사용 + 반환을 `Promise<Note>`로 확장

- **상태(Status)**: Accepted
- **날짜**: 2026-05-31
- **관련**: [PRD §6 FR-1·4·5](../PRD.md#6-기능-요구사항-functional-requirements), [ADR-0002](0002-duplicate-context-app-selection.md)

## Context

노트 복제는 "원본을 읽어 제목에 `(사본)`을 붙이고 본문·태그를 복사한 **새 노트**를 만든다"는 작업이다. 제약·관찰은 다음과 같다.

- 생성 경로(`api/notes.ts`의 `createNote`)는 이미 안정적이다: 클라이언트가 타임스탬프를 채우고 **`id`는 서버(JSON Server)가 부여**한다. 복제본도 새 `id`/타임스탬프가 필요하므로 이 규칙이 그대로 들어맞는다.
- `NotesContext.addNote(title, content, tags)`가 이미 존재하고, 내부에서 `createNote` 호출 → 응답 노트를 로컬 `notes`에 append한다. 시그니처 `(title, content, tags)`가 복제에 필요한 모든 필드를 덮는다.
- 그러나 현재 `addNote`는 `Promise<void>`를 반환한다. **복제 직후 그 노트를 선택**하려면 생성된 노트의 새 `id`가 필요한데, `void`라 알 수 없다.
- 복제는 새로운 종류의 데이터가 아니다 — 기존 `Note`를 한 건 더 만드는 것일 뿐이다. 신규 fetch 계층 함수를 추가할 이유가 없다(YAGNI).

## Decision

**신규 API를 만들지 않고 기존 생성 경로를 재사용**하되, 선택 이동에 필요한 새 `id`를 얻기 위해 **`addNote`의 반환 타입을 `Promise<void> → Promise<Note>`로 확장**한다.

```ts
// src/context/NotesContext.tsx
const addNote = async (title: string, content: string, tags: string[]): Promise<Note> => {
  const created = await api.createNote({ title, content, tags });
  setNotes((prev) => [...prev, created]);
  return created; // ← 추가된 한 줄
};
```

복제 페이로드는 **순수 함수**로 분리해 `id`·타임스탬프를 빼고 만든다.

```ts
// src/lib/duplicate.ts
/** 원본 노트로부터 복제 생성용 페이로드를 만든다(id·타임스탬프 제외). */
export function buildDuplicatePayload(note: Note): {
  title: string;
  content: string;
  tags: string[];
} {
  const baseTitle = note.title ?? '';
  return {
    title: baseTitle ? `${baseTitle} (사본)` : '(사본)',
    content: note.content ?? '',
    tags: [...(note.tags ?? [])], // 얕은 복사로 원본 배열과 참조 분리
  };
}
```

- `id`/`createdAt`/`updatedAt`은 **복사하지 않는다** — 서버·`createNote`가 새로 채운다.
- `tags`는 얕은 복사해 원본 배열과 참조를 끊는다(원본 불변, FR-9).

## Consequences

**긍정**

- 신규 API·신규 데이터 모델이 전혀 없다. 복제 구현 비용이 최소다(PRD 핵심 가치).
- `void → Note`는 **하위호환 변경**이다: 반환을 무시하던 기존 호출부(`NoteEditor.handleSave`의 `await addNote(...)`)는 그대로 동작한다.
- 페이로드 생성이 순수 함수라 단위 테스트가 쉽다(제목 규칙·빈 제목·태그 복사를 입출력으로 검증).

**부정 / 트레이드오프**

- Context 인터페이스(`NotesContextType.addNote`) 타입을 함께 바꿔야 한다 — 한 곳 수정으로 끝나지만 타입 변경이므로 `tsc` 게이트로 회귀를 확인한다.
- "복제"라는 의도가 `addNote` 자체엔 드러나지 않는다 → 의도는 [ADR-0002](0002-duplicate-context-app-selection.md)의 `duplicateNote(id)` 래퍼와 `buildDuplicatePayload` 이름으로 표현한다.

## Alternatives Considered

1. **신규 `duplicateNote` API를 `api/notes.ts`에 추가**(서버에 복제 전용 엔드포인트/로직)
   - 기각 이유: JSON Server엔 복제 엔드포인트가 없고, 결국 POST 한 번이라 `createNote`와 동일하다. 새 fetch 함수는 중복. YAGNI.
2. **`addNote` 반환은 그대로 두고, append 후 `notes`에서 새 노트를 추론**(예: 마지막 항목)
   - 기각 이유: 동시성·정렬 가정에 의존해 깨지기 쉽다. 생성 응답의 `id`를 직접 받는 게 정확하다.
3. **클라이언트에서 `id`를 생성해 복제본에 부여**
   - 기각 이유: 프로젝트 규칙상 **`id`는 서버가 부여**(클라이언트 생성 금지). 규칙 위반.
     </content>
