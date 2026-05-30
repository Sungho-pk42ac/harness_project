# 마크다운 미리보기 기능 이슈 분해 (Vertical Slicing)

[`PRD.md`](PRD.md)를 기반으로 한 구현 이슈 목록입니다.

## 분해 원칙 — 수직 슬라이싱

각 이슈는 **의존성 추가 → 컴포넌트 → 편집기 배선 → UI를 관통하는, 그 자체로 동작하고 사용자에게 보이는 한 조각**입니다.
PRD의 마일스톤(M1~M3)은 그대로 쓰지 않고, "사용자가 끝까지 쓸 수 있는 단위"로 재구성했습니다.

- 먼저 **walking skeleton**(MDPREV-1: 토글로 본문 마크다운 미리보기가 화면 끝까지 동작)으로 전 계층을 얇게 관통한 뒤,
- 지원 문법 보장(MDPREV-2) → 보안(MDPREV-3) → 스타일·접근성(MDPREV-4) 순으로 가치를 덧붙입니다.

## 각 이슈의 구성 — AC와 DoD 구분

- **인수 기준(AC, Acceptance Criteria)** = "**올바르게 동작**하는가?" 기능별 행위 기준. **Given/When/Then**으로 표현.
- **완료 정의(DoD, Definition of Done)** = "**정말 끝났는가?**" 품질·프로세스 게이트. 행위를 다시 적지 않고 완료 조건만.

> 행위(무엇이 맞아야 하나)는 AC에서, 품질(무엇이 갖춰져야 끝인가)은 DoD에서 다룹니다. 둘은 겹치지 않습니다.

## 이슈 ↔ 요구사항(FR) 매핑

| 이슈                              | 담는 FR                       | 의존     |
| --------------------------------- | ----------------------------- | -------- |
| MDPREV-1 미리보기 토글 (skeleton) | FR-1, FR-2, FR-7, FR-9, FR-10 | —        |
| MDPREV-2 지원 문법 렌더           | FR-3, FR-4, FR-5, FR-6        | MDPREV-1 |
| MDPREV-3 보안(raw HTML 차단)      | FR-11                         | MDPREV-1 |
| MDPREV-4 스타일·접근성·리셋       | FR-8, FR-12                   | MDPREV-1 |

> MDPREV-1이 모든 이슈의 선행입니다. MDPREV-2·3·4는 MDPREV-1 이후 병렬 진행 가능.

---

## MDPREV-1 — 토글로 본문을 마크다운 미리보기로 볼 수 있다

**라벨**: `feature/markdown-preview` `P0` `slice:happy-path`
**의존**: 없음 (선행 이슈)

### 설명

마크다운 미리보기의 **walking skeleton**. `react-markdown` 의존성을 추가하고, 본문을 렌더하는 `MarkdownPreview` 프레젠테이션 컴포넌트를 만든 뒤, `NoteEditor`에 **편집/미리보기 토글**을 배선한다. 이 한 슬라이스로 의존성 → 컴포넌트 → 편집기까지 전 계층을 얇게 관통한다. (문법 보장은 MDPREV-2, 보안은 MDPREV-3, 스타일·접근성·리셋은 MDPREV-4)

### 범위

- `package.json`: `react-markdown` 의존성 추가.
- `src/components/MarkdownPreview.tsx`(신규): `content: string`을 받아 `react-markdown`으로 렌더하는 프레젠테이션 컴포넌트(named export, props 인터페이스를 컴포넌트 바로 위에 정의).
- `src/components/NoteEditor.tsx`: `view: 'edit' | 'preview'` 로컬 상태(기본 `edit`), 토글 버튼, 본문 영역만 분기 렌더(`<textarea>` ↔ `MarkdownPreview`).
- 저장 흐름은 **변경 없음** — `content` 원문 그대로 저장(ADR-0001).

### 인수 기준 (AC)

```
시나리오 A: 미리보기로 전환
  Given 편집기에서 본문에 "# 안녕"을 입력했다 (기본 편집 모드)
  When 미리보기 토글을 클릭한다
  Then 본문 영역이 textarea 대신 렌더된 마크다운(제목)으로 바뀐다

시나리오 B: 편집으로 복귀
  Given 미리보기 모드를 보고 있다
  When 토글을 다시 클릭한다
  Then 본문 영역이 다시 textarea(편집)로 돌아오고 원문이 그대로 있다

시나리오 C: 기본은 편집 모드
  Given 노트를 열거나 새 노트를 만든다
  When 편집기가 처음 보인다
  Then 본문 영역은 편집(textarea) 모드로 시작한다

시나리오 D: 미저장 변경 반영
  Given 본문을 "## 메모"로 수정했고 아직 저장하지 않았다
  When 미리보기로 전환한다
  Then 저장 전 현재 편집 내용이 렌더되어 보인다

시나리오 E: 저장 포맷 불변
  Given 본문에 마크다운을 적었다
  When 저장한다
  Then 서버에는 content 원문(plain text)이 그대로 전송된다(렌더 결과 아님)
```

### 완료 정의 (DoD)

- [ ] 위 AC 시나리오(A~E)가 모두 통과한다.
- [ ] `react-markdown`이 dependencies에 추가되고 빌드(`npm run build`)가 통과한다.
- [ ] 디자인 시스템 토큰 사용, 디자인 검사·lint·build 통과(임의 색/그림자/인라인 style 없음).
- [ ] 기존 노트 CRUD·태그·검색에 회귀가 없다(저장 포맷 불변).
- [ ] 코드 리뷰 후 머지된다.

---

## MDPREV-2 — 헤딩·리스트·강조·코드가 올바르게 렌더된다

**라벨**: `feature/markdown-preview` `P0` `slice:render-syntax`
**의존**: MDPREV-1

### 설명

미리보기가 보장하는 **지원 문법**을 못박는다. 헤딩·순서/비순서 리스트·강조(굵게/기울임)·코드(인라인/블록)가 기대 DOM 태그로 렌더되는지 컴포넌트 테스트로 고정한다(`@testing-library/react`).

### 범위

- `MarkdownPreview`가 헤딩·리스트·강조·코드를 표준대로 렌더함을 검증.
- `src/components/MarkdownPreview.test.tsx`(신규): 각 문법 → 기대 태그 매핑 단위 테스트.
- 필요 시 렌더 매핑 미세 조정(이번 범위는 기본 CommonMark, GFM 미포함).

### 인수 기준 (AC)

````
시나리오 A: 헤딩
  Given 본문이 "# 제목"이다
  When 미리보기로 렌더한다
  Then <h1>으로 "제목"이 렌더된다 (하위 레벨 ##→<h2> 등 동일)

시나리오 B: 리스트
  Given 본문이 "- 사과\n- 배"이다
  When 미리보기로 렌더한다
  Then <ul> 안에 <li>가 2개 렌더된다 (그리고 "1. 항목"은 <ol><li>)

시나리오 C: 강조
  Given 본문이 "**굵게** 그리고 *기울임*"이다
  When 미리보기로 렌더한다
  Then "굵게"는 <strong>, "기울임"은 <em>으로 렌더된다

시나리오 D: 코드
  Given 본문에 인라인 `code`와 ``` 코드 블록 ```이 있다
  When 미리보기로 렌더한다
  Then 인라인은 <code>, 블록은 <pre><code>으로 렌더된다
````

### 완료 정의 (DoD)

- [ ] 위 AC 시나리오(A~D)가 모두 통과한다.
- [ ] 헤딩·리스트·강조·코드 각각에 대한 **컴포넌트 단위 테스트가 통과**한다.
- [ ] 디자인 토큰 사용, 디자인 검사·lint·build 통과.
- [ ] 코드 리뷰 후 머지된다.

---

## MDPREV-3 — raw HTML이 실행되지 않는다 (XSS 차단)

**라벨**: `feature/markdown-preview` `P0` `slice:security`
**의존**: MDPREV-1

### 설명

본문에 섞인 raw HTML(`<script>`, `<img onerror=…>` 등)이 **실행되지 않도록** 보장한다. `react-markdown` 기본값(HTML 미허용)을 유지하고 `rehype-raw` 같은 raw HTML 허용 플러그인을 도입하지 않음을 테스트로 고정한다(ADR-0002).

### 범위

- `MarkdownPreview`가 raw HTML을 활성 마크업으로 렌더하지 않음을 검증.
- `src/components/MarkdownPreview.test.tsx`: 보안 케이스(스크립트·이벤트 핸들러) 테스트 추가.
- `dangerouslySetInnerHTML`·`rehype-raw`를 쓰지 않음을 코드/리뷰로 확인.

### 인수 기준 (AC)

```
시나리오 A: 스크립트 미실행
  Given 본문이 "<script>alert(1)</script>"이다
  When 미리보기로 렌더한다
  Then <script> 요소가 활성 마크업으로 DOM에 주입되지 않는다(텍스트로 처리되거나 무시)

시나리오 B: 이벤트 핸들러 미주입
  Given 본문이 "<img src=x onerror=alert(1)>"이다
  When 미리보기로 렌더한다
  Then onerror 핸들러가 달린 활성 img 요소가 만들어지지 않는다

시나리오 C: 일반 텍스트는 정상
  Given 본문이 "그냥 평범한 문장"이다
  When 미리보기로 렌더한다
  Then 텍스트가 그대로 안전하게 보인다
```

### 완료 정의 (DoD)

- [ ] 위 AC 시나리오(A~C)가 모두 통과한다.
- [ ] raw HTML 차단에 대한 **보안 단위 테스트가 통과**한다.
- [ ] `dangerouslySetInnerHTML`·`rehype-raw` 미사용이 코드에서 확인된다.
- [ ] 디자인 검사·lint·build 통과, 코드 리뷰 후 머지된다.

---

## MDPREV-4 — 미리보기가 보기 좋고 접근 가능하며 노트 전환 시 리셋된다

**라벨**: `feature/markdown-preview` `P1` `slice:polish`
**의존**: MDPREV-1

### 설명

미리보기 영역에 **디자인 토큰 기반 최소 타이포 스타일**을 입혀 읽기 좋게 하고, 토글 버튼의 **접근성**(키보드·`aria-pressed`)을 갖춘다. 또한 노트를 전환하면 토글이 **편집 모드로 리셋**되고, 미리보기 모드에서도 저장/취소가 동작함을 보장한다.

### 범위

- `MarkdownPreview` 컨테이너에 Tailwind 타이포 유틸리티(토큰 기반) 부여(헤딩 굵기·여백, 코드 배경 `bg-muted` 등).
- 토글 버튼: 키보드 포커스·클릭 가능, `aria-pressed`로 현재 모드 표시.
- `NoteEditor` 폼 동기화 `useEffect`에 `view='edit'` 리셋 추가(노트 전환 시).
- 미리보기 모드에서도 저장/취소 버튼이 동일하게 동작.

### 인수 기준 (AC)

```
시나리오 A: 노트 전환 시 편집 리셋
  Given 노트 A를 미리보기로 보고 있다
  When 다른 노트 B를 선택한다
  Then 본문 영역이 편집(textarea) 모드로 시작한다

시나리오 B: 키보드 접근성
  Given 토글 버튼에 포커스가 있다
  When 키보드로 토글을 활성화한다
  Then 편집/미리보기가 전환되고 현재 모드가 aria-pressed로 노출된다

시나리오 C: 미리보기 중 저장
  Given 미리보기 모드로 본문을 확인하고 있다
  When 저장 버튼을 누른다
  Then 본문이 정상 저장된다(모드와 무관)

시나리오 D: 스타일 적용
  Given 헤딩·리스트·코드가 포함된 본문을 미리본다
  When 미리보기 영역을 본다
  Then 헤딩·코드 등이 디자인 토큰 기반으로 구분되어 읽기 좋게 보인다(임의 색/그림자 없음)
```

### 완료 정의 (DoD)

- [ ] 위 AC 시나리오(A~D)가 모두 통과한다.
- [ ] 토글 버튼이 키보드 포커스·클릭 모두 가능하고 `aria-pressed`를 노출한다(접근성).
- [ ] 미리보기 스타일이 디자인 시스템 토큰만 사용한다, 디자인 검사·lint·build 통과.
- [ ] 레이아웃·렌더에 회귀가 없다(편집 경험 보존).
- [ ] 코드 리뷰 후 머지된다.
