# ADR-0002 — 복제는 Context가 생성, App이 선택 이동 (상태 경계 분리)

- **상태(Status)**: Accepted
- **날짜**: 2026-05-31
- **관련**: [PRD §7 NFR](../PRD.md#7-비기능-요구사항-nfr), [PRD §6 FR-6](../PRD.md#6-기능-요구사항-functional-requirements), [ADR-0001](0001-reuse-addnote-return-created.md)

## Context

복제는 두 가지 일을 한 번에 한다: **(1) 새 노트를 만든다(서버 데이터 변경)**, **(2) 그 노트를 연다(화면 선택 변경)**. 이 프로젝트는 두 종류의 상태를 명확히 분리한다.

- **서버 데이터** → `NotesContext`(`notes/loading/error`, `addNote/editNote/removeNote`)가 단일 출처.
- **화면 선택 상태** → `App.tsx`의 `useState`(`selectedNoteId`, `isCreating`).

이 경계를 깨면(예: Context가 `selectedNoteId`까지 들고 있으면) 검색·태그 기능에서 지켜온 아키텍처가 무너진다. 그러나 복제는 "생성"과 "선택"을 **순서대로 묶어야** 자연스럽다(생성 성공 후에만 선택). 어디서 무엇을 책임질지 결정해야 한다.

## Decision

책임을 경계에 맞춰 **둘로 나눈다.**

1. **Context — 생성만 책임.** 얇은 래퍼 `duplicateNote(id)`를 추가한다. 원본을 `notes`에서 찾아 [ADR-0001](0001-reuse-addnote-return-created.md)의 `buildDuplicatePayload`로 `addNote`를 호출하고, **생성된 `Note`를 반환**한다. Context는 선택 상태를 **모른다.**

   ```ts
   // src/context/NotesContext.tsx
   const duplicateNote = async (id: string): Promise<Note> => {
     const original = notes.find((n) => n.id === id);
     if (!original) throw new Error('복제할 노트를 찾을 수 없습니다');
     const { title, content, tags } = buildDuplicatePayload(original);
     return addNote(title, content, tags); // 생성된 Note를 그대로 반환
   };
   ```

2. **App — 선택만 책임.** `handleDuplicate(id)`가 `duplicateNote`를 호출하고, **반환 노트의 `id`로 `setSelectedNoteId`** 한다. 실패는 여기서 `try/catch + alert`(기존 호출부 에러 패턴), 실패 시 선택을 옮기지 않는다.

   ```ts
   // src/App.tsx
   const handleDuplicate = async (id: string) => {
     try {
       const created = await duplicateNote(id);
       setSelectedNoteId(created.id);
       setIsCreating(false);
     } catch (e) {
       console.error(e);
       alert('복제에 실패했습니다');
     }
   };
   ```

3. **버튼 배선**: `App → NoteList(onDuplicate) → NoteItem(복제 버튼)`. `NoteItem`의 복제 버튼은 `e.stopPropagation()`으로 카드 선택과 분리한다(삭제 버튼과 동일 패턴).

## Consequences

**긍정**

- 검색·태그에서 지킨 **상태 경계가 그대로 유지**된다. Context는 서버 데이터, App은 화면 선택.
- "생성 성공 후에만 선택"이 자연스럽게 표현된다(`await` 후 `setSelectedNoteId`).
- `duplicateNote(id)`가 복제 의도를 이름으로 드러내, 호출부(App)는 한 줄로 끝난다.
- 에러 처리가 기존 컨벤션(호출부 try/catch + alert, Context는 자체 catch 없음)과 일치한다.

**부정 / 트레이드오프**

- 복제 한 동작이 Context와 App **두 곳에 걸쳐** 구현된다(생성/선택 분리). 한 곳에 몰면 더 짧지만 경계를 깬다 → 일관성을 위해 분리를 택한다.
- `duplicateNote`가 `addNote`를 감싸는 얇은 래퍼라 중복처럼 보일 수 있으나, 원본 조회·페이로드 생성 책임을 Context에 두는 값이 있다.

## Alternatives Considered

1. **Context가 선택까지 담당**(`duplicateNote`가 `selectedNoteId`도 세팅)
   - 기각 이유: 화면 선택 상태를 Context로 끌어와 **상태 경계 위반**. 태그·검색에서 지켜온 원칙과 충돌.
2. **App에서 `addNote`를 직접 호출**(Context에 `duplicateNote` 없이, App이 `notes`에서 원본 찾고 페이로드 만들어 `addNote`)
   - 기각 이유: 원본 조회·복제 규칙이라는 **데이터 로직이 App(화면 계층)에 샌다**. 데이터 변경 로직은 Context에 두는 게 일관적.
3. **`NoteItem`이 `useNotes()`로 직접 복제**
   - 기각 이유: `NoteItem`은 콜백을 props로 받는 프레젠테이션 컴포넌트. 자체 데이터 변경/선택은 패턴 위반.
     </content>
