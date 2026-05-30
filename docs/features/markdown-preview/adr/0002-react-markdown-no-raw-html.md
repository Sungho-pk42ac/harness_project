# ADR-0002 — `react-markdown` 채택 + raw HTML 미허용(XSS 차단)

- **상태(Status)**: Accepted
- **날짜**: 2026-05-31
- **관련**: [PRD §7 NFR](../PRD.md#7-비기능-요구사항-nfr), [PRD FR-11](../PRD.md#6-기능-요구사항-functional-requirements), [ADR-0001](0001-render-layer-only.md)

## Context

마크다운 원문(`content`)을 안전하게 렌더할 방법을 정해야 한다. 제약·맥락은 다음과 같다.

- 본문은 사용자가 자유롭게 입력하는 문자열이며, `<script>`·`<img onerror=…>` 같은 **raw HTML이 섞일 수 있다**(XSS 위험).
- 가장 단순한 구현은 마크다운→HTML 변환 후 `dangerouslySetInnerHTML`로 주입하는 것이지만, 이는 **XSS 표면을 직접 연다**.
- 이번 범위가 보장할 문법은 **헤딩·리스트·강조·코드(인라인/블록)** 로 한정된다. GFM·이미지·syntax highlighting은 범위 밖(ADR-0001 / PRD Non-Goals).
- React 19 환경이며, 컴포넌트는 함수 선언 + named export 컨벤션을 따른다.

## Decision

**`react-markdown`을 채택하고, raw HTML은 허용하지 않는다.**

- 렌더는 전용 프레젠테이션 컴포넌트 `MarkdownPreview`로 캡슐화한다.

  ```tsx
  // src/components/MarkdownPreview.tsx
  import Markdown from 'react-markdown';

  interface MarkdownPreviewProps {
    content: string;
  }

  /** content(마크다운 원문)를 안전하게 React 엘리먼트로 렌더한다. raw HTML은 허용하지 않는다. */
  export function MarkdownPreview({ content }: MarkdownPreviewProps) {
    return <Markdown>{content}</Markdown>;
  }
  ```

- `react-markdown`은 문자열을 **AST로 파싱해 React 엘리먼트로 직접 생성**한다 → `dangerouslySetInnerHTML`을 쓰지 않는다.
- **raw HTML을 허용하는 플러그인(`rehype-raw`)을 도입하지 않는다.** 기본값(HTML 미허용)을 유지해 `<script>` 등은 텍스트로 처리되거나 무시된다.
- 이번 범위는 **플러그인 없이** 기본 마크다운(CommonMark)만 사용한다. GFM이 필요해지면 `remark-gfm`을 **별도 슬라이스**에서 추가한다.

## Consequences

**긍정**

- **XSS 표면이 닫힌다** — raw HTML 미허용 + `dangerouslySetInnerHTML` 미사용으로 본문에 섞인 스크립트가 실행되지 않는다(FR-11).
- 헤딩·리스트·강조·코드를 **추가 코드 없이** 표준대로 렌더한다.
- 렌더 책임이 `MarkdownPreview` 한 곳에 모여 편집기(`NoteEditor`)는 토글·배치만 담당한다(관심사 분리).

**부정 / 트레이드오프**

- 런타임 의존성이 하나 늘어난다(`react-markdown` + remark/rehype 트랜지티브 의존성). 번들 크기 소폭 증가 — 학습 프로젝트 규모에서 수용 가능.
- 의도적으로 raw HTML을 쓰려는 고급 사용자는 막힌다. 현재 페르소나·범위에선 필요 없음(보안 우선).
- 기본 렌더 태그에 스타일이 없어, 컨테이너에 **최소 타이포 스타일**(Tailwind 토큰)을 별도로 입혀야 한다.

## Alternatives Considered

1. **마크다운 라이브러리(marked/markdown-it) → `dangerouslySetInnerHTML`**
   - 기각 이유: HTML 문자열 주입은 XSS 표면을 직접 연다. 안전하게 하려면 `DOMPurify` 등 sanitizer를 또 붙여야 해 오히려 복잡. `react-markdown`이 같은 안전성을 기본 제공.
2. **직접 정규식 파서 작성**
   - 기각 이유: 마크다운 엣지 케이스(중첩 리스트·코드펜스 등)를 직접 처리하는 비용이 크고 버그 위험. 바퀴 재발명. YAGNI.
3. **`react-markdown` + `rehype-raw`로 raw HTML 허용**
   - 기각 이유: XSS 표면을 다시 여는 선택. 범위에 raw HTML 요구가 없으므로 기본값(미허용)이 안전하고 충분.
