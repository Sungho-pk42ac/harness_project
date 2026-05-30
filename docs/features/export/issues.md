# 노트 내보내기 기능 이슈 분해 (Vertical Slicing)

[`PRD.md`](PRD.md)를 기반으로 한 구현 이슈 목록입니다.

## 분해 원칙 — 수직 슬라이싱

각 이슈는 **데이터 → 변환/헬퍼 → UI를 관통하는, 그 자체로 동작하고 사용자에게 보이는 한 조각**입니다.
PRD의 마일스톤(M1~M4)은 계층/단계 분해라 그대로 쓰지 않고, "사용자가 끝까지 쓸 수 있는 단위"로 재구성했습니다.

- 먼저 **walking skeleton**(EXPORT-1: 현재 노트를 .md로 받으면 파일이 떨어진다)으로 전 계층을 얇게 관통한 뒤,
- 전체 백업(EXPORT-2) → 파일명 견고화(EXPORT-3) → 빈 상태·자원 정리·접근성(EXPORT-4) 순으로 가치를 덧붙입니다.

## 각 이슈의 구성 — AC와 DoD 구분

- **인수 기준(AC, Acceptance Criteria)** = "**올바르게 동작**하는가?" 기능별 행위 기준. **Given/When/Then**으로 표현.
- **완료 정의(DoD, Definition of Done)** = "**정말 끝났는가?**" 품질·프로세스 게이트. 행위를 다시 적지 않고 완료 조건만.

> 행위(무엇이 맞아야 하나)는 AC에서, 품질(무엇이 갖춰져야 끝인가)은 DoD에서 다룹니다. 둘은 겹치지 않습니다.

## 이슈 ↔ 요구사항(FR) 매핑

| 이슈                            | 담는 FR                | 의존               |
| ------------------------------- | ---------------------- | ------------------ |
| EXPORT-1 현재 노트 .md 내보내기 | FR-1, FR-3, FR-4, FR-8 | —                  |
| EXPORT-2 전체 .json 백업        | FR-2, FR-8             | EXPORT-1           |
| EXPORT-3 안전 파일명·날짜       | FR-5, FR-6             | EXPORT-1           |
| EXPORT-4 빈 상태·자원·접근성    | FR-7, FR-9, FR-10      | EXPORT-1, EXPORT-2 |

> EXPORT-1이 모든 이슈의 선행입니다. EXPORT-2·3은 EXPORT-1 이후 병렬 가능, EXPORT-4는 두 내보내기 경로(1·2)가 있어야 의미가 있습니다.

---

## EXPORT-1 — 현재 노트를 마크다운(.md)으로 내보낸다

**라벨**: `feature/export` `P0` `slice:happy-path`
**의존**: 없음 (선행 이슈)

### 설명

내보내기 기능의 **walking skeleton**. 사용자가 편집기에서 "내보내기" 버튼을 누르면, 저장된 현재 노트가 제목·본문·태그를 담은 `.md` 파일로 다운로드된다. 이 한 슬라이스로 **순수 변환 함수(`noteToMarkdown`) → 다운로드 헬퍼(`downloadTextFile`) → `NoteEditor` 버튼**까지 전 계층을 얇게 관통한다. (전체 백업은 EXPORT-2, 파일명 견고화는 EXPORT-3, 빈 상태·자원 정리는 EXPORT-4)

### 범위

- `src/lib/export.ts`(신규): `noteToMarkdown(note)` 순수 함수 — 제목 `#` 헤딩, 본문 원문 유지, 태그 있으면 구분선+`태그:` 줄, 없으면 생략(`note.tags ?? []`).
- `src/lib/download.ts`(신규): `downloadTextFile(filename, text, mime)` — Blob→objectURL→anchor click.
- `src/components/NoteEditor.tsx`: 저장/취소 줄에 "내보내기" 버튼, 클릭 시 **저장된 노트(selectedNote)** 기준으로 변환·다운로드.
- 파일명은 이 슬라이스에선 단순히 `{title}.md` 수준이어도 됨(안전화·날짜는 EXPORT-3).
- `NotesContext`·`api`·`types`는 변경하지 않는다(읽기만).

### 인수 기준 (AC)

```
시나리오 A: 현재 노트를 .md로 내보내기
  Given 태그 "회의"가 달린 저장된 노트를 편집기에서 보고 있다
  When "내보내기" 버튼을 클릭한다
  Then 제목은 "# {제목}", 본문은 원문 그대로, "태그: 회의" 줄을 담은 .md 파일이 다운로드된다

시나리오 B: 태그 없는 노트
  Given 태그가 없는 노트를 보고 있다
  When "내보내기"를 클릭한다
  Then 태그 줄과 구분선 없이 제목·본문만 담긴 .md가 다운로드된다(에러 없음)

시나리오 C: 구버전(tags 없는) 노트 호환
  Given tags 필드가 없는 기존 노트를 보고 있다
  When "내보내기"를 클릭한다
  Then 에러 없이 태그 없는 .md로 내보내진다

시나리오 D: 변환은 원본을 바꾸지 않는다
  Given 노트를 내보냈다
  When 변환 함수 호출 전후 notes 상태를 비교한다
  Then 원본 notes/note는 변형되지 않는다(파생 문자열만 생성)
```

### 완료 정의 (DoD)

- [ ] 위 AC 시나리오(A~D)가 모두 통과한다.
- [ ] `noteToMarkdown`이 순수 함수로 분리되고, 그에 대한 **단위 테스트가 통과**한다.
- [ ] 다운로드 헬퍼는 브라우저 API를 mock해 호출·인자를 검증한다(jsdom에서 깨지지 않음).
- [ ] 디자인 시스템 토큰 사용(임의 색/그림자/인라인 style 없음), husky 디자인 검사·lint·build 통과.
- [ ] 기존 노트 CRUD·태그·검색에 회귀가 없다.
- [ ] 코드 리뷰 후 머지된다.

---

## EXPORT-2 — 전체 노트를 JSON(.json)으로 백업한다

**라벨**: `feature/export` `P0` `slice:backup-json`
**의존**: EXPORT-1

### 설명

헤더의 "백업" 버튼으로 전체 노트를 손실 없는 `.json` 파일 하나로 다운로드한다. 헤더 전역 액션이므로 `App.tsx`가 핸들러를 소유해 `Layout`에 주입한다.

### 범위

- `src/lib/export.ts`: `notesToJson(notes)` 순수 함수 — `JSON.stringify(notes, null, 2)`(ADR-0002).
- `src/components/Layout.tsx`: 헤더 "+ 새 노트" 옆 "백업" 버튼 + `onExportAll` 콜백 prop.
- `src/App.tsx`: `notes`를 읽어 `notesToJson` → `downloadTextFile`로 다운로드하는 핸들러를 `Layout`에 주입.
- 파일명은 `notes-backup.json` 수준이어도 됨(날짜·안전화는 EXPORT-3).

### 인수 기준 (AC)

```
시나리오 A: 전체 백업 다운로드
  Given 노트가 여러 개 있다
  When 헤더 "백업" 버튼을 클릭한다
  Then 모든 노트를 담은 .json 파일이 다운로드된다

시나리오 B: 무손실 직렬화
  Given 백업 .json을 받았다
  When 그 JSON을 파싱한다
  Then id·title·content·createdAt·updatedAt·tags가 원본 notes와 동일하다

시나리오 C: 사람이 읽을 수 있는 형식
  Given 백업을 내보낸다
  When 파일 내용을 본다
  Then 들여쓰기(2칸)된 읽기 좋은 JSON 배열이다
```

### 완료 정의 (DoD)

- [ ] 위 AC 시나리오(A~C)가 모두 통과한다.
- [ ] `notesToJson`이 순수 함수로 분리되고 **단위 테스트가 통과**한다(빈 배열·다건·형식).
- [ ] 헤더 액션은 `App.tsx`가 소유하고 `Layout`에 콜백으로 주입한다(상태 경계 준수).
- [ ] 디자인 토큰 사용, husky 검사·lint·build 통과.
- [ ] 코드 리뷰 후 머지된다.

---

## EXPORT-3 — 파일명에 제목·날짜를 안전하게 담는다

**라벨**: `feature/export` `P1` `slice:filename`
**의존**: EXPORT-1

### 설명

받은 파일을 식별할 수 있도록 파일명 규칙을 완성한다. 제목의 위험문자를 치환하고, 날짜를 붙이며, 빈 제목을 안전하게 처리한다. 로직은 순수 함수로 분리해 단위 테스트한다.

### 범위

- `src/lib/export.ts`: `buildExportFilename(base, ext, date?)` 순수 함수.
- 위험문자(`\ / : * ? " < > |`·제어문자)를 `-`로 치환, 빈/공백 제목은 `untitled`.
- 날짜는 `date.toISOString().slice(0, 10)`로 `YYYY-MM-DD`.
- EXPORT-1(md)·EXPORT-2(json)의 파일명 생성을 이 함수로 교체.
- 결과: md=`{안전제목}-{YYYY-MM-DD}.md`, json=`notes-backup-{YYYY-MM-DD}.json`.

### 인수 기준 (AC)

```
시나리오 A: 제목+날짜 파일명
  Given 제목 "회의록"인 노트를 2026-05-31에 내보낸다
  When 파일명을 만든다
  Then "회의록-2026-05-31.md"가 된다

시나리오 B: 위험문자 치환
  Given 제목이 "a/b:c?"인 노트를 내보낸다
  When 파일명을 만든다
  Then 위험문자가 "-"로 치환된 안전한 파일명이 된다(경로 분리·확장자 깨짐 없음)

시나리오 C: 빈 제목 대체
  Given 제목이 비었거나 공백뿐이다
  When 파일명을 만든다
  Then "untitled-{YYYY-MM-DD}.md"가 된다

시나리오 D: 백업 파일명
  Given 전체 백업을 2026-05-31에 내보낸다
  When 파일명을 만든다
  Then "notes-backup-2026-05-31.json"이 된다
```

### 완료 정의 (DoD)

- [ ] 위 AC 시나리오(A~D)가 모두 통과한다.
- [ ] `buildExportFilename`이 순수 함수로 분리되고 **단위 테스트가 통과**한다(위험문자·빈 제목·날짜·확장자).
- [ ] EXPORT-1·2의 파일명이 이 함수로 일원화된다(중복 로직 없음).
- [ ] husky 검사·lint·build 통과.
- [ ] 코드 리뷰 후 머지된다.

---

## EXPORT-4 — 내보낼 게 없으면 막고, 자원·접근성을 마무리한다

**라벨**: `feature/export` `P1` `slice:guard-a11y`
**의존**: EXPORT-1, EXPORT-2

### 설명

내보낼 데이터가 없을 때 버튼을 비활성화해 잘못된 내보내기를 예방하고, 객체 URL 자원을 정리하며, 버튼 접근성과 실패 알림을 마무리한다.

### 범위

- `NoteEditor`: **미저장 새 노트(`isCreating`)** 일 때 "내보내기" 버튼 비활성(영속 데이터 없음).
- `Layout`/`App`: **노트 0건**이면 "백업" 버튼 비활성.
- `download.ts`: 클릭 직후 `URL.revokeObjectURL`로 객체 URL 해제(메모리 누수 방지).
- 다운로드 부수효과에 `try/catch` + 기존 패턴 `alert`로 실패 알림.
- 버튼에 명확한 텍스트 라벨·키보드 포커스, 비활성 시 `disabled` 표현.

### 인수 기준 (AC)

```
시나리오 A: 미저장 새 노트는 내보내기 비활성
  Given "새 노트" 작성 중이고 아직 저장하지 않았다
  When 편집기를 본다
  Then "내보내기" 버튼이 비활성이라 클릭되지 않는다

시나리오 B: 노트 0건이면 백업 비활성
  Given 노트가 한 개도 없다
  When 헤더를 본다
  Then "백업" 버튼이 비활성이라 클릭되지 않는다

시나리오 C: 자원 정리
  Given 파일을 내보냈다
  When 다운로드가 끝난다
  Then 생성된 객체 URL이 revokeObjectURL로 해제된다

시나리오 D: 내보내기 실패 알림
  Given 다운로드 도중 Blob/URL 생성이 예외를 던진다
  When 내보내기를 시도한다
  Then 사용자에게 실패 알림(alert)이 표시된다(앱이 깨지지 않음)
```

### 완료 정의 (DoD)

- [ ] 위 AC 시나리오(A~D)가 모두 통과한다.
- [ ] 비활성 조건(미저장·0건)이 테스트로 검증된다.
- [ ] `revokeObjectURL` 호출이 테스트(mock)로 검증된다.
- [ ] 버튼이 키보드 포커스·클릭 모두 가능하다(접근성), 디자인 토큰 사용.
- [ ] husky 검사·lint·build 통과, 기존 동작 회귀 없음.
- [ ] 코드 리뷰 후 머지된다.
