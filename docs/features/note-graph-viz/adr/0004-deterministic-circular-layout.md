# ADR-0004 — 결정적 원형 레이아웃(순수 함수)

- **Status**: Accepted
- **Date**: 2026-06-01

## Context

노드 좌표 배치가 필요하다. force-directed 시뮬레이션은 자연스럽지만 **비결정적**(매번 다른 좌표)이고
애니메이션 루프가 필요해 단위 테스트가 어렵다. 이 레포는 결정적 단위 테스트를 강하게 선호한다.

## Decision

MVP는 **원형 배치**: N개 노드를 원주에 균등 배치한다(`angle = 2π·i/N`, 고정 반지름·중심). 입력이 같으면
출력 좌표가 같은 **순수 함수**(`layoutCircle(nodes): PositionedNode[]`)로 둔다.

## Consequences

- 좌표가 결정적 → 단위 테스트로 위치·개수 검증 가능. 애니메이션 루프 불필요.
- 클러스터 구조가 force만큼 드러나지 않음 → 후속에 force 레이아웃 옵션 추가 가능(인터페이스 유지).

## Alternatives Considered

- **force-directed**: 비결정·애니메이션·테스트 곤란 → MVP 기각, 후속 옵션.
- **격자(grid) 배치**: 관계 표현이 약함 → 원형이 엣지 가독성 더 나음.
