# 검색 기능 이슈 분해 (Vertical Slicing)

[`PRD.md`](PRD.md)를 기반으로 한 구현 이슈 목록입니다.

## 분해 원칙 — 수직 슬라이싱

각 이슈는 **데이터(원본 notes) → 필터(filterNotes) → UI(SearchBar/NoteList)를 관통하는, 그 자체로 동작하고 사용자에게 보이는 한 조각**입니다.

- 먼저 **walking skeleton**(SEARCH-1: 제목으로 검색하면 목록이 걸러진다)으로 전 계층을 얇게 관통한 뒤,
- 검색 대상 확장·매칭 규칙(SEARCH-2) → 빈 결과 안내(SEARCH-3) → 지우기·접근성(SEARCH-4) 순으로 가치를 덧붙입니다.

## 각 이슈의 구성 — AC와 DoD 구분

- **인수 기준(AC)** = "**올바르게 동작**하는가?" 기능별 행위 기준. **Given/When/Then**으로 표현.
- **완료 정의(DoD)** = "**정말 끝났는가?**" 품질·프로세스 게이트.

## 이슈 ↔ 요구사항(FR) 매핑

| 이슈                                        | 담는 FR                | 의존     |
| ------------------------------------------- | ---------------------- | -------- |
| SEARCH-1 제목 검색 & 배선(walking skeleton) | FR-1, FR-5             | —        |
| SEARCH-2 본문·태그 확장 + 매칭 규칙         | FR-2, FR-3, FR-4, FR-9 | SEARCH-1 |
| SEARCH-3 검색 결과 0건 전용 안내            | FR-7                   | SEARCH-1 |
| SEARCH-4 검색어 지우기(×) & 접근성·유지     | FR-6, FR-8             | SEARCH-1 |

> SEARCH-1이 모든 이슈의 선행입니다. SEARCH-2·3·4는 SEARCH-1 이후 병렬 진행 가능.

---

## SEARCH-1 — 제목으로 검색하면 노트 목록이 걸러진다 (walking skeleton)

**라벨**: `feature/search` `P0` `slice:happy-path`
**의존**: 없음 (선행 이슈)

### 설명

검색 기능의 **walking skeleton**. 노트 목록 위 검색창에 글자를 입력하면, **제목**에 그 글자가 들어간 노트만 실시간으로 걸러져 보인다. 검색어를 지우면 전체가 다시 보인다. 이 한 슬라이스로 `App.searchQuery` → `filterNotes` → `SearchBar`/`NoteList`까지 전 계층을 얇게 관통한다. (본문·태그 확장은 SEARCH-2, 빈 결과 안내는 SEARCH-3, × 버튼은 SEARCH-4)

### 범위

- `src/utils/filterNotes.ts`(신규): `filterNotes(notes, query)` — **제목** 부분 포함·대소문자 무시·앞뒤 trim, 빈 검색어면 원본 반환. 원본 불변 (ADR-0002).
- `src/components/SearchBar.tsx`(신규): `value`/`onChange` props만 받는 프레젠테이션 입력 컴포넌트.
- `src/App.tsx`: `searchQuery` `useState` 추가, `SearchBar`에 value/onChange 주입, `NoteList`에 검색어 전달 (ADR-0001).
- `src/components/NoteList.tsx`: `filterNotes(notes, searchQuery)`로 걸러 렌더.

### 인수 기준 (AC)

```
시나리오 A: 제목으로 거르기
  Given "주간회의록"과 "장보기" 노트가 있다
  When 검색창에 "회의"를 입력한다
  Then "주간회의록"만 목록에 보이고 "장보기"는 사라진다

시나리오 B: 대소문자 무시
  Given 제목이 "Roadmap"인 노트가 있다
  When 검색창에 "road"를 입력한다
  Then "Roadmap" 노트가 보인다

시나리오 C: 검색어를 지우면 전체 복귀
  Given 검색어 "회의"로 목록이 걸러져 있다
  When 검색창을 비운다
  Then 전체 노트가 다시 보인다

시나리오 D: 원본 불변
  Given 노트 목록이 있다
  When 검색으로 일부만 보이게 한 뒤 검색어를 지운다
  Then 원본 노트 목록이 손실 없이 그대로 복구된다
```

### 완료 정의 (DoD)

- [ ] 위 AC 시나리오(A~D)가 모두 통과한다.
- [ ] `filterNotes` 순수 함수에 단위 테스트가 있다(제목 부분포함·대소문자·빈검색=전체·원본 불변).
- [ ] `SearchBar`는 디자인 시스템 토큰만 사용(임의 색/그림자/인라인 style 없음), `aria-label`/`type="search"` 부여, husky 디자인 검사·lint·build 통과.
- [ ] 기존 노트 CRUD·태그·로그인 동작에 회귀가 없다.
- [ ] 코드 리뷰 후 머지된다.

---

## SEARCH-2 — 제목뿐 아니라 본문·태그로도 검색된다

**라벨**: `feature/search` `P0` `slice:matching`
**의존**: SEARCH-1

### 설명

SEARCH-1의 제목 검색을 **본문(content)과 태그(tags)** 까지 확장하고 매칭 규칙을 완성한다. 검색어가 제목·본문·태그 **어디에 들어 있어도** 매치되며, 모든 규칙은 순수 함수 `filterNotes` 안에서 처리한다.

### 범위

- `filterNotes`: 매칭 대상에 `content`와 `tags`를 추가. 태그는 `note.tags ?? []`로 안전 처리하고, **태그 중 하나라도** 부분 포함하면 매치.
- 앞뒤 `trim`·대소문자 무시 규칙을 본문·태그에도 일관 적용.
- `filterNotes` 단위 테스트 확장.

### 인수 기준 (AC)

```
시나리오 A: 본문으로 거르기
  Given 본문에만 "예산"이 들어간 노트가 있다
  When 검색창에 "예산"을 입력한다
  Then 그 노트가 보인다

시나리오 B: 태그로 거르기
  Given 태그 ["주간회의"]가 달린 노트가 있다
  When 검색창에 "회의"를 입력한다
  Then 그 노트가 보인다

시나리오 C: 통합 매칭
  Given 검색어가 제목·본문·태그 중 한 곳에만 있어도 된다
  When 각 위치에만 검색어가 있는 노트들을 검색한다
  Then 세 경우 모두 매치된다

시나리오 D: 태그 없는 노트 안전 처리
  Given tags 필드가 없는 기존 노트가 있다
  When 검색한다
  Then 에러 없이 제목·본문 기준으로만 평가된다
```

### 완료 정의 (DoD)

- [ ] 위 AC 시나리오(A~D)가 모두 통과한다.
- [ ] `filterNotes`의 본문·태그·trim 동작에 단위 테스트가 추가되어 통과한다.
- [ ] lint·build·husky 검사 통과, 회귀 없음.
- [ ] 코드 리뷰 후 머지된다.

---

## SEARCH-3 — 검색 결과가 없으면 전용 안내를 보여준다

**라벨**: `feature/search` `P0` `slice:empty-state`
**의존**: SEARCH-1

### 설명

검색했는데 일치하는 노트가 하나도 없을 때, **"검색 결과가 없습니다"** 라는 검색 전용 안내를 표시한다. 데이터가 없어서 비어 있는 상태("노트가 없습니다")와 명확히 구분한다.

### 범위

- `NoteList`: 빈 상태 분기에 "검색 결과 0건"을 추가. 우선순위 `loading → error → 원본 0건 → 검색 0건 → 목록`.

### 인수 기준 (AC)

```
시나리오 A: 검색 결과 없음 안내
  Given 노트가 여러 개 있다
  When 어떤 노트에도 없는 검색어를 입력한다
  Then "검색 결과가 없습니다" 안내가 보인다

시나리오 B: 데이터 없음과 구분
  Given 노트가 0개다
  When 목록을 본다
  Then "노트가 없습니다"(기존 빈 상태)가 보인다 — 검색 안내와 다른 문구

시나리오 C: 결과가 생기면 안내 사라짐
  Given "검색 결과가 없습니다"가 보이는 상태다
  When 검색어를 일치하는 값으로 바꾼다
  Then 안내가 사라지고 걸러진 목록이 보인다
```

### 완료 정의 (DoD)

- [ ] 위 AC 시나리오(A~C)가 모두 통과한다.
- [ ] (선택) `NoteList` 빈 결과 분기 컴포넌트 테스트가 있다.
- [ ] 안내 문구가 디자인 토큰을 따른다, husky 검사·lint·build 통과.
- [ ] 코드 리뷰 후 머지된다.

---

## SEARCH-4 — 검색어를 한 번에 지우고, 검색 상태가 유지된다

**라벨**: `feature/search` `P1` `slice:clear-a11y`
**의존**: SEARCH-1

### 설명

검색창 안의 **× 버튼**으로 검색어를 한 번에 비울 수 있고(클릭 후 입력 포커스 유지), 검색 중 노트를 선택·생성해도 검색어가 유지된다. 접근성 속성을 보강한다.

### 범위

- `SearchBar`: 입력값이 있을 때 `×`(지우기) 버튼 표시, 클릭 시 `onChange('')` + 입력 포커스 유지. `aria-label` 부여.
- 검색어는 `App.searchQuery`라 노트 선택/생성과 독립 유지(ADR-0001) — 회귀로만 확인.

### 인수 기준 (AC)

```
시나리오 A: × 버튼으로 지우기
  Given 검색창에 "회의"가 입력돼 있다
  When × 버튼을 클릭한다
  Then 검색어가 비워지고 전체 노트가 다시 보인다

시나리오 B: 빈 입력엔 × 미표시
  Given 검색창이 비어 있다
  When 검색창을 본다
  Then × 버튼이 보이지 않는다

시나리오 C: 선택해도 검색어 유지
  Given 검색어 "회의"로 목록이 걸러져 있다
  When 결과 중 한 노트를 클릭해 연다
  Then 검색어와 걸러진 목록이 그대로 유지된다
```

### 완료 정의 (DoD)

- [ ] 위 AC 시나리오(A~C)가 모두 통과한다.
- [ ] × 버튼이 키보드 포커스·클릭 가능하고 `aria-label`을 가진다.
- [ ] `SearchBar` clear 동작에 컴포넌트 테스트가 있다.
- [ ] 디자인 토큰 사용, husky 검사·lint·build 통과, 회귀 없음.
- [ ] 코드 리뷰 후 머지된다.
