# 휴지통 기능 이슈 분해 (Vertical Slicing)

[`PRD.md`](PRD.md)를 기반으로 한 구현 이슈 목록입니다.

## 분해 원칙 — 수직 슬라이싱

각 이슈는 **데이터 → API/Context → UI를 관통하는, 그 자체로 동작하고 사용자에게 보이는 한 조각**입니다.
PRD의 마일스톤(M1~M4)은 그대로 "사용자가 끝까지 쓸 수 있는 단위"로 재구성했습니다.

- 먼저 **walking skeleton**(TRASH-1: 삭제하면 영구 제거 대신 사라지고 영속화)으로 전 계층을 얇게 관통한 뒤,
- 휴지통 조회(TRASH-2) → 복원(TRASH-3) → 영구삭제(TRASH-4) 순으로 가치를 덧붙입니다.

## 각 이슈의 구성 — AC와 DoD 구분

- **인수 기준(AC)** = "**올바르게 동작**하는가?" 기능별 행위 기준. **Given/When/Then**으로 표현.
- **완료 정의(DoD)** = "**정말 끝났는가?**" 품질·프로세스 게이트. 행위를 다시 적지 않고 완료 조건만.

> 행위(무엇이 맞아야 하나)는 AC에서, 품질(무엇이 갖춰져야 끝인가)은 DoD에서 다룹니다. 둘은 겹치지 않습니다.

## 이슈 ↔ 요구사항(FR) 매핑

| 이슈                            | 담는 FR                      | 의존    |
| ------------------------------- | ---------------------------- | ------- |
| TRASH-1 소프트 삭제 & 활성 목록 | FR-1, FR-2, FR-6, FR-8, FR-9 | —       |
| TRASH-2 휴지통 조회             | FR-3, FR-7                   | TRASH-1 |
| TRASH-3 복원                    | FR-4, FR-8, FR-11            | TRASH-2 |
| TRASH-4 영구 삭제               | FR-5, FR-8, FR-10, FR-11     | TRASH-2 |

> TRASH-1이 모든 이슈의 선행입니다. TRASH-2 이후 TRASH-3·4는 병렬 진행 가능.

---

## TRASH-1 — 노트를 삭제하면 영구 제거 대신 사라지고(소프트 삭제) 영속화된다

**라벨**: `feature/trash` `P0` `slice:happy-path`
**의존**: 없음 (선행 이슈)

### 설명

휴지통 기능의 **walking skeleton**. "삭제" 동작을 HTTP DELETE(영구 제거)에서 **`deletedAt` 마킹(소프트 삭제)** 으로 바꾼다. 삭제하면 일반 목록에서 사라지지만 DB에는 남고, 재조회해도 유지된다. 이 한 슬라이스로 `Note` 타입 → `utils/trash` → `api`/`Context` → `NoteList`까지 전 계층을 얇게 관통한다. (휴지통 화면은 TRASH-2, 복원은 TRASH-3, 영구삭제는 TRASH-4)

### 범위

- `src/types/note.ts`: `deletedAt?: string` 추가 (ADR-0001).
- `src/utils/trash.ts`(신규): `isTrashed`/`activeNotes`/`trashedNotes` 순수 함수 + 단위 테스트 (ADR-0002).
- `NotesContext.removeNote`: HTTP DELETE 대신 `updateNote(id, { deletedAt: now })` 호출로 전환, 응답으로 항목 **교체(map)**.
- `NoteList`: `activeNotes(notes)`만 렌더(삭제 노트 비표시).
- 읽기 호환: 기존 노트는 `deletedAt` falsy → 활성 취급.
- 실패 시 기존 `try/catch`+`alert` 패턴 유지.

### 인수 기준 (AC)

```
시나리오 A: 삭제는 영구 제거가 아니다
  Given 활성 노트 "회의록"이 목록에 있다
  When 그 노트의 "삭제" 버튼을 누른다
  Then "회의록"이 일반 목록에서 사라지지만 DB에서는 제거되지 않고 deletedAt이 채워진다

시나리오 B: 활성 목록 필터링
  Given deletedAt이 있는 노트와 없는 노트가 섞여 있다
  When 일반 노트 목록을 본다
  Then deletedAt이 없는 노트만 보인다

시나리오 C: 영속화
  Given 노트를 삭제한 직후다
  When 노트 목록을 다시 불러온다(재조회)
  Then 그 노트는 여전히 활성 목록에 없고(삭제 상태 유지) DB에는 존재한다

시나리오 D: 기존(deletedAt 없는) 노트 호환
  Given deletedAt 필드가 없는 기존 노트가 있다
  When 목록을 본다
  Then 에러 없이 활성 노트로 표시된다

시나리오 E: 삭제 실패 알림
  Given 서버가 응답하지 않는다
  When 삭제를 시도한다
  Then 삭제 실패 알림이 사용자에게 표시된다
```

### 완료 정의 (DoD)

- [ ] 위 AC 시나리오(A~E)가 모두 통과한다.
- [ ] `isTrashed`/`activeNotes`/`trashedNotes`가 순수 함수로 분리되고 **단위 테스트가 통과**한다.
- [ ] 디자인 토큰 사용, husky 디자인 검사·lint·build(`tsc`) 통과(임의 색/그림자/인라인 style 없음).
- [ ] 기존 노트 CRUD(생성·조회·수정)에 회귀가 없다.
- [ ] 코드 리뷰 후 머지된다.

---

## TRASH-2 — 휴지통 화면에서 삭제된 노트를 모아 본다

**라벨**: `feature/trash` `P0` `slice:trash-view`
**의존**: TRASH-1

### 설명

헤더의 **휴지통 토글**로 화면을 전환해, 삭제된 노트(`deletedAt` 있는 것)만 모인 **휴지통 목록**을 본다. 휴지통 보기 여부는 `App`의 화면 상태(`view`)로 둔다 (ADR-0002). 복원·영구삭제 버튼 동작은 TRASH-3·4에서 붙인다(여기서는 조회와 빈 상태까지).

### 범위

- `App.tsx`: `view: 'notes' | 'trash'` 화면 상태 추가, 사이드바 슬롯을 view에 따라 전환.
- `Layout.tsx`: 헤더에 휴지통 토글 버튼(노트↔휴지통).
- `src/components/TrashList.tsx`(신규): `trashedNotes(notes)`만 렌더, 빈 상태 "휴지통이 비어 있습니다".
- 디자인 토큰 사용, 기존 목록 카드 스타일 재사용.

### 인수 기준 (AC)

```
시나리오 A: 휴지통 진입
  Given 삭제된 노트 "회의록"이 있다
  When 헤더의 휴지통 토글을 누른다
  Then 휴지통 화면이 열리고 "회의록"이 거기에 보인다

시나리오 B: 휴지통엔 삭제 노트만
  Given 활성 노트와 삭제 노트가 섞여 있다
  When 휴지통 화면을 본다
  Then 삭제된 노트만 보이고 활성 노트는 보이지 않는다

시나리오 C: 휴지통 빈 상태
  Given 삭제된 노트가 하나도 없다
  When 휴지통 화면을 본다
  Then "휴지통이 비어 있습니다" 전용 문구가 보인다(활성 0건 문구와 구분)

시나리오 D: 노트 화면으로 복귀
  Given 휴지통 화면을 보고 있다
  When 토글을 다시 눌러 노트 화면으로 돌아간다
  Then 활성 노트 목록이 보인다
```

### 완료 정의 (DoD)

- [ ] 위 AC 시나리오(A~D)가 모두 통과한다.
- [ ] 휴지통 토글이 키보드 포커스·클릭 모두 가능하고 `aria-label`을 가진다(접근성).
- [ ] `view`가 `App` 화면 상태로 분리되어 Context를 오염시키지 않는다(상태 경계 준수).
- [ ] 디자인 토큰 사용, husky 검사·lint·build 통과.
- [ ] 코드 리뷰 후 머지된다.

---

## TRASH-3 — 휴지통의 노트를 복원해 일반 목록으로 되돌린다

**라벨**: `feature/trash` `P0` `slice:restore`
**의존**: TRASH-2

### 설명

휴지통 목록 각 항목의 **"복원"** 버튼으로 `deletedAt`을 비워(소프트 삭제 해제) 노트를 일반 목록으로 되돌린다. 복원은 기존 `updateNote(id, { deletedAt: null })` 경로를 재사용한다 (ADR-0001).

### 범위

- `NotesContext.restoreNote(id)`(신규): `updateNote(id, { deletedAt: null })` 호출, 응답으로 항목 교체(map).
- `TrashList`: 각 항목에 "복원" 버튼.
- 복원되어 편집 중이던 선택 상태가 어긋나지 않도록 처리(필요 시 `selectedNoteId` 정리).
- 실패 시 기존 `try/catch`+`alert`.

### 인수 기준 (AC)

```
시나리오 A: 복원
  Given 휴지통에 "회의록"이 있다
  When 그 항목의 "복원" 버튼을 누른다
  Then "회의록"이 휴지통에서 사라지고 일반 노트 목록에 다시 나타난다

시나리오 B: 복원의 영속화
  Given "회의록"을 복원한 직후다
  When 노트 목록을 다시 불러온다(재조회)
  Then "회의록"은 활성 노트로 유지되고 휴지통에는 없다

시나리오 C: 복원 실패 알림
  Given 서버가 응답하지 않는다
  When 복원을 시도한다
  Then 복원 실패 알림이 사용자에게 표시된다
```

### 완료 정의 (DoD)

- [ ] 위 AC 시나리오(A~C)가 모두 통과한다.
- [ ] `restoreNote`가 Context에 추가되고 응답 기반 교체(map) 패턴을 따른다.
- [ ] "복원" 버튼이 키보드 포커스·클릭 가능하다(접근성).
- [ ] 디자인 토큰 사용, husky 검사·lint·build 통과.
- [ ] 기존 삭제·휴지통 조회(TRASH-1·2)에 회귀가 없다.
- [ ] 코드 리뷰 후 머지된다.

---

## TRASH-4 — 휴지통의 노트를 영구 삭제한다(되돌릴 수 없음)

**라벨**: `feature/trash` `P0` `slice:purge`
**의존**: TRASH-2

### 설명

휴지통 목록 각 항목의 **"영구 삭제"** 버튼으로 노트를 DB에서 실제로 제거한다. 되돌릴 수 없으므로 **확인(confirm)** 후 실행한다. 기존 `deleteNote`(HTTP DELETE) 경로를 재사용한다.

### 범위

- `NotesContext.purgeNote(id)`(신규): `api.deleteNote(id)` 호출, 성공 시 로컬 `notes`에서 제거(filter).
- `TrashList`: 각 항목에 "영구 삭제" 버튼, 클릭 시 `confirm` 후 실행.
- 편집 중 노트가 영구삭제되면 선택 해제(`selectedNoteId` → null)로 편집기 정리.
- 실패 시 기존 `try/catch`+`alert`.

### 인수 기준 (AC)

```
시나리오 A: 영구 삭제
  Given 휴지통에 "회의록"이 있다
  When "영구 삭제"를 누르고 확인 대화를 수락한다
  Then "회의록"이 휴지통과 DB 양쪽에서 제거되어 어디에도 보이지 않는다

시나리오 B: 영구 삭제 취소
  Given 휴지통에 "회의록"이 있다
  When "영구 삭제"를 누르고 확인 대화를 거절한다
  Then "회의록"은 휴지통에 그대로 남는다

시나리오 C: 영구 삭제의 영속화
  Given "회의록"을 영구 삭제한 직후다
  When 노트 목록을 다시 불러온다(재조회)
  Then "회의록"은 활성·휴지통 어디에도 없다

시나리오 D: 영구 삭제 실패 알림
  Given 서버가 응답하지 않는다
  When 영구 삭제를 시도한다
  Then 영구 삭제 실패 알림이 사용자에게 표시된다
```

### 완료 정의 (DoD)

- [ ] 위 AC 시나리오(A~D)가 모두 통과한다.
- [ ] 영구 삭제 전 `confirm`을 거쳐 오작동을 막는다.
- [ ] `purgeNote`가 Context에 추가되고 성공 시 로컬에서 제거(filter)한다.
- [ ] "영구 삭제" 버튼이 키보드 포커스·클릭 가능하고 `text-destructive` 등 토큰을 따른다.
- [ ] 디자인 토큰 사용, husky 검사·lint·build 통과.
- [ ] 코드 리뷰 후 머지된다.
