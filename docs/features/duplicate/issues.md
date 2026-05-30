# 노트 복제 기능 이슈 분해 (Vertical Slicing)

[`PRD.md`](PRD.md)를 기반으로 한 구현 이슈 목록입니다.

## 분해 원칙 — 수직 슬라이싱

각 이슈는 **데이터 → API/Context → UI를 관통하는, 그 자체로 동작하고 사용자에게 보이는 한 조각**입니다.
PRD의 마일스톤(M1~M3)은 단계 예고일 뿐이고, 여기서는 "사용자가 끝까지 쓸 수 있는 단위"로 재구성했습니다.

- 먼저 **walking skeleton**(DUP-1: 카드에서 복제하면 새 노트가 생기고 그 노트가 열린다)으로 전 계층을 얇게 관통한 뒤,
- 복제 규칙 견고화(DUP-2) → 실패 처리·접근성 마감(DUP-3) 순으로 가치를 덧붙입니다.

## 각 이슈의 구성 — AC와 DoD 구분

- **인수 기준(AC, Acceptance Criteria)** = "**올바르게 동작**하는가?" 기능별 행위 기준. **Given/When/Then**으로 표현.
- **완료 정의(DoD, Definition of Done)** = "**정말 끝났는가?**" 품질·프로세스 게이트. 행위를 다시 적지 않고 완료 조건만.

> 행위(무엇이 맞아야 하나)는 AC에서, 품질(무엇이 갖춰져야 끝인가)은 DoD에서 다룹니다. 둘은 겹치지 않습니다.

## 이슈 ↔ 요구사항(FR) 매핑

| 이슈                                | 담는 FR                      | 의존  |
| ----------------------------------- | ---------------------------- | ----- |
| DUP-1 복제 & 영속화 & 선택          | FR-1, FR-4, FR-5, FR-6, FR-7 | —     |
| DUP-2 복제 페이로드 규칙(제목·복사) | FR-2, FR-3, FR-9             | DUP-1 |
| DUP-3 실패 처리 & 접근성 마감       | FR-8                         | DUP-1 |

> DUP-1이 모든 이슈의 선행입니다. DUP-2·3은 DUP-1 이후 병렬 진행 가능.

---

## DUP-1 — 목록 카드에서 복제하면 새 노트가 생기고 그 노트가 열린다

**라벨**: `feature/duplicate` `P0` `slice:happy-path`
**의존**: 없음 (선행 이슈)

### 설명

복제 기능의 **walking skeleton**. 사용자가 노트 목록 카드의 **복제 버튼**을 누르면, 그 노트가 복사된 **새 노트**(서버가 새 `id` 부여)가 생성되어 목록에 나타나고, 복제 직후 그 복제본이 선택(편집기에 열림)된다. 이 한 슬라이스로 `lib/duplicate` → `Context(addNote 반환 확장 + duplicateNote)` → `App(선택 이동)` → `NoteList/NoteItem(버튼)`까지 전 계층을 얇게 관통한다. (제목 `(사본)` 등 페이로드 규칙 세부는 DUP-2, 실패·접근성은 DUP-3)

### 범위

- `src/context/NotesContext.tsx`: `addNote` 반환을 `Promise<void> → Promise<Note>`로 확장(`return created`), `duplicateNote(id): Promise<Note>` 추가 (ADR-0001, ADR-0002).
- `src/lib/duplicate.ts` (신규): `buildDuplicatePayload(note)` 최소 구현(제목+본문+태그 복사, id/타임스탬프 제외).
- `src/App.tsx`: `handleDuplicate(id)` — `duplicateNote` 호출 후 반환 `id`로 `setSelectedNoteId`.
- `src/components/NoteList.tsx`: `onDuplicate`를 받아 `NoteItem`에 전달.
- `src/components/NoteItem.tsx`: 삭제 버튼 옆 **복제 버튼**(`stopPropagation`).

### 인수 기준 (AC)

```
시나리오 A: 카드에서 복제하면 새 노트가 생긴다
  Given "회의록" 노트가 목록에 있다
  When 그 카드의 복제 버튼을 클릭한다
  Then 목록에 복제본 노트가 한 개 더 생긴다(노트 개수 +1)

시나리오 B: 복제본은 새 id를 갖는 독립 노트
  Given "회의록" 노트(id=A)를 복제한다
  When 복제가 끝난다
  Then 복제본의 id는 A가 아니며(서버 부여), 원본 "회의록"은 그대로 남아 있다

시나리오 C: 복제 직후 복제본이 열린다
  Given 노트를 복제했다
  When 복제가 끝난다
  Then 편집기에 복제본이 선택되어 열린다(selectedNoteId가 복제본 id)

시나리오 D: 복제는 영속화된다
  Given 노트를 복제했다
  When 목록을 새로고침(다시 fetch)한다
  Then 복제본이 서버에 남아 다시 보인다

시나리오 E: 복제 버튼은 카드 선택과 분리된다
  Given 선택되지 않은 카드가 있다
  When 그 카드의 복제 버튼만 클릭한다
  Then 복제는 실행되되, 원본 카드를 "선택"하는 동작은 트리거되지 않는다
```

### 완료 정의 (DoD)

- [ ] 위 AC 시나리오(A~E)가 모두 통과한다.
- [ ] `addNote` 반환 타입 변경 후 기존 호출부(`NoteEditor`)에 회귀가 없다(`tsc` 통과).
- [ ] 디자인 시스템 토큰만 사용, 임의 색/그림자/인라인 style 없음. husky 디자인 검사·lint·build 통과.
- [ ] 기존 노트 CRUD(생성·조회·수정·삭제)·태그·검색에 회귀가 없다.
- [ ] 코드 리뷰 후 머지된다.

---

## DUP-2 — 복제본 제목에 `(사본)`이 붙고 본문·태그가 그대로 복사된다

**라벨**: `feature/duplicate` `P0` `slice:payload-rule`
**의존**: DUP-1

### 설명

DUP-1의 복제 페이로드 생성을 **규칙대로 견고화**한다. 제목은 `원본 + " (사본)"`(빈 제목이면 `"(사본)"`), 본문은 그대로, 태그는 얕은 복사(원본 배열과 참조 분리)한다. `id`/타임스탬프는 복사하지 않는다. 페이로드 생성은 순수 함수 `buildDuplicatePayload`로 분리해 단위 테스트한다(ADR-0001).

### 범위

- `src/lib/duplicate.ts`: `buildDuplicatePayload`의 제목 규칙·빈 제목·태그 얕은 복사·`tags ?? []` 방어를 완성.
- Vitest 단위 테스트 추가(`src/lib/duplicate.test.ts`).

### 인수 기준 (AC)

```
시나리오 A: 제목에 (사본) 부착
  Given 제목이 "주간 회의록"인 노트
  When 복제 페이로드를 만든다
  Then 복제본 제목은 "주간 회의록 (사본)"이다

시나리오 B: 빈 제목 처리
  Given 제목이 빈 문자열("")인 노트
  When 복제 페이로드를 만든다
  Then 복제본 제목은 "(사본)"이다(앞에 공백이 붙지 않는다)

시나리오 C: 본문 복사
  Given 본문이 "안건 1, 안건 2"인 노트
  When 복제 페이로드를 만든다
  Then 복제본 content가 "안건 1, 안건 2"로 동일하다

시나리오 D: 태그 복사 + 참조 분리
  Given 태그가 ["work","회의"]인 노트
  When 복제 페이로드를 만든다
  Then 복제본 tags가 ["work","회의"]로 같고, 원본 tags 배열과 다른 인스턴스다(원본 변경 영향 없음)

시나리오 E: 구버전 노트(tags 없음) 호환
  Given tags 필드가 없는 노트
  When 복제 페이로드를 만든다
  Then 에러 없이 tags가 빈 배열 []로 만들어진다

시나리오 F: id·타임스탬프 미복사
  Given id·createdAt·updatedAt이 있는 노트
  When 복제 페이로드를 만든다
  Then 페이로드에 id·createdAt·updatedAt이 포함되지 않는다(서버/createNote가 부여)
```

### 완료 정의 (DoD)

- [ ] 위 AC 시나리오(A~F)가 모두 통과한다.
- [ ] `buildDuplicatePayload`가 순수 함수로 분리되고, 그에 대한 **단위 테스트가 통과**한다.
- [ ] 원본 노트 객체가 복제 과정에서 변형되지 않음을 테스트로 보장한다(FR-9).
- [ ] lint·build·`tsc` 통과.
- [ ] 코드 리뷰 후 머지된다.

---

## DUP-3 — 복제 실패를 알리고 복제 버튼이 접근 가능하다

**라벨**: `feature/duplicate` `P1` `slice:error-a11y`
**의존**: DUP-1

### 설명

복제의 **예외·접근성**을 마감한다. 생성이 실패하면 기존 패턴(`try/catch` + `alert`)으로 알리고, 실패 시 선택을 옮기지 않는다(원본·화면 그대로 유지). 원본을 찾을 수 없는 경우(이미 삭제 등)도 안전하게 처리한다. 복제 버튼은 키보드 포커스·클릭이 모두 가능하고 명확한 라벨을 갖는다.

### 범위

- `src/App.tsx`: `handleDuplicate`의 `try/catch` + `alert('복제에 실패했습니다')`, 실패 시 `setSelectedNoteId` 미실행.
- `src/context/NotesContext.tsx`: `duplicateNote`에서 원본 미존재 시 throw(또는 명시적 처리).
- `src/components/NoteItem.tsx`: 복제 버튼 `aria-label`/포커스 가능, 디자인 토큰 hover 스타일.

### 인수 기준 (AC)

```
시나리오 A: 생성 실패 알림
  Given 서버가 응답하지 않는다
  When 노트 복제를 시도한다
  Then "복제에 실패했습니다" 알림이 뜨고, 선택은 바뀌지 않는다(복제본이 열리지 않는다)

시나리오 B: 원본 부재 안전 처리
  Given 어떤 이유로 복제 대상 노트가 목록에 없다
  When 그 id로 복제를 시도한다
  Then 앱이 깨지지 않고(실패로 처리), 사용자에게 알림이 표시된다

시나리오 C: 복제 버튼 접근성
  Given 복제 버튼에 키보드 포커스가 있다
  When 키보드로 버튼을 활성화한다
  Then 복제가 실행된다(클릭과 동일)
```

### 완료 정의 (DoD)

- [ ] 위 AC 시나리오(A~C)가 모두 통과한다.
- [ ] 실패 경로에서 `selectedNoteId`가 바뀌지 않음을 검증한다.
- [ ] 복제 버튼이 키보드 포커스·클릭 모두 가능하고 `aria-label`을 갖는다.
- [ ] 디자인 토큰 사용, husky 검사·lint·build·`tsc` 통과.
- [ ] 코드 리뷰 후 머지된다.
      </content>
