# ADR-0003 — 의존성 없는 SVG 렌더

- **Status**: Accepted
- **Date**: 2026-06-01

## Context

그래프 렌더 방법: (a) 의존성 없는 SVG 직접 구현, (b) 경량 라이브러리(cytoscape/vis-network/reactflow
등), (c) graphify HTML 재사용. 이 레포는 Vite+Tailwind v4이고, 커밋 게이트가 **인라인 style·임의 hex·
임의 그림자**를 차단하며 Vitest 단위/컴포넌트 테스트를 선호한다.

## Decision

**의존성 없는 SVG**로 렌더한다. 노드=`<circle>`, 엣지=`<line>`, 라벨=`<text>`에 Tailwind 시맨틱 토큰
클래스(`fill-primary`, `stroke-border`, `text-foreground` 등)를 적용한다. 좌표는 순수 레이아웃 함수가
계산해 props로 넘긴다.

## Consequences

- 신규 무거운 의존성 0, 번들 영향 최소. 커밋 게이트(인라인 style 금지)와 충돌 없음.
- 렌더가 단순 SVG라 컴포넌트 테스트로 노드/엣지 수·클릭 콜백 검증 가능.
- 고급 인터랙션(줌/팬/드래그/물리)은 직접 구현 비용 → MVP 제외, 후속에 필요 시 라이브러리 재검토.

## Alternatives Considered

- **경량 그래프 라이브러리**: 인라인 style/캔버스 사용이 많아 커밋 게이트·테스트와 마찰 → MVP 기각.
- **graphify HTML**: 인앱 노트 클릭 연동 어려움 → 기각(후속 참고).
