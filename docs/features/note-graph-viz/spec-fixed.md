# note-graph-viz — 확정본 (spec-fixed)

> auto-loop 멀티에이전트 합의(Tech Lead · User Advocate · Devil's Advocate)로 확정. 각 결정에 근거.

## 0. 합의 요약

- 별도 Neo4j 서버 없음 — 기존 노트에서 **클라이언트 그래프 빌드**(Tech Lead). Neo4j는 속성그래프 모델 개념 참고만.
- 렌더는 **의존성 없는 SVG + 순수 함수 레이아웃**(Tech Lead) — 신규 무거운 라이브러리·인라인 style 회피, 단위 테스트 가능.
- 진입점은 **헤더 화면 토글 확장**(notes/trash → +graph), 기존 `view` 상태 재사용(User Advocate).
- DA 컷: 물리 애니메이션·줌/팬·드래그·실시간 전부 MVP 제외. 노트 부족 시 빈 상태.

## 1. 데이터 모델

```ts
interface GraphNode {
  id: string;
  label: string;
  tagCount: number;
}
interface GraphEdge {
  source: string;
  target: string;
  weight: number;
} // weight=공유 태그 수
interface NoteGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
// 레이아웃(원형 배치): 노드에 좌표 부여
interface PositionedNode extends GraphNode {
  x: number;
  y: number;
}
```

- 근거: 속성 그래프(노드/엣지+속성=weight)를 최소 형태로. 좌표는 렌더 전 순수 계산.

## 2. 그래프 빌드 규칙 (MVP)

- 노드: **활성 노트**(`activeNotes`)만. label=제목(빈 제목은 "(제목 없음)").
- 엣지: 두 노트가 **공유 태그가 1개 이상**이면 연결, weight=공유 태그 수. 자기 자신 제외, 무방향(중복 쌍 1개).
- 근거: 태그 데이터가 이미 있고(tag 기능) 계산이 결정적·테스트 쉬움. 본문 링크/제목 언급은 후속.

## 3. 레이아웃 (MVP)

- **원형 배치**: N개 노드를 원주에 균등 배치(`angle = 2π·i/N`, 반지름 고정). 결정적 → 순수 함수 단위 테스트.
- 근거: force 시뮬레이션은 비결정·애니메이션 필요 → MVP 제외(DA). 원형은 단순·테스트 가능.

## 4. 렌더 / 상호작용

- SVG: 엣지(`line`, `stroke-border`, weight로 굵기 단계) → 노드(`circle` `fill-primary`, 라벨 `text`).
- 노드 클릭 → `onSelectNote(id)` → 노트 뷰로 전환 + 해당 노트 선택(App 배선).
- 빈 상태: 노드 0~1개면 "그래프로 볼 노트가 아직 적어요" 안내.
- 근거: 색은 시맨틱 토큰 클래스만(커밋 게이트 준수).

## 5. 진입점 / 상태

- 헤더 토글을 `view: 'notes' | 'trash' | 'graph'`로 확장. graph 뷰에서 메인에 그래프 렌더.
- 근거: 기존 trash 토글 패턴 재사용, App이 view 소유.

## 6. 범위

- 포함: buildNoteGraph(공유태그)·원형 레이아웃 순수함수, NoteGraph SVG 컴포넌트, 노드 클릭→노트 열기, graph 뷰 토글, 빈 상태.
- 제외(후속): force 레이아웃·줌/팬/드래그·본문 링크 엣지·필터·성능 대량 최적화·graphify 산출물 연동.

## 7. 테스트 전략

- buildNoteGraph·레이아웃 → Vitest 단위(결정적). NoteGraph → 컴포넌트 테스트(노드/엣지 렌더, 클릭 콜백).
- 사용자 여정(노트 만들고 그래프에서 보기)은 후속 E2E 후보.

## 8. 영향 파일(예상)

- 신규: `src/utils/noteGraph.ts`(+test), `src/components/NoteGraph.tsx`(+test).
- 수정: `src/App.tsx`(view 확장+배선), `src/components/Layout.tsx`(토글 라벨), CLAUDE.md(기능 목록).

## 9. Open Questions (보수적 기본값)

- 태그를 공유하는 노트가 적으면 엣지가 거의 없을 수 있음 → 그래도 노드는 보이고, 후속에서 본문 링크 엣지 추가.
- 대량 노트(수백) 성능 → MVP는 단순 렌더, 필요 시 후속에서 노드 수 캡/샘플링.
