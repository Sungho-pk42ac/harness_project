# note-graph-viz — 수직 슬라이스 이슈 (issues)

walking skeleton(NGV-1·2) 먼저. AC(Given/When/Then) ≠ DoD(품질 게이트).

## 공통 DoD

- [ ] `npm test` 그린(새 로직 단위/컴포넌트 테스트), `npm run build`(tsc) 0, `npm run lint` 통과
- [ ] UI는 디자인 시스템 준수(시맨틱 토큰, 임의 hex/그림자/인라인 style 0 — 커밋 게이트)
- [ ] 한국어 주석·camelCase·JSDoc, 회귀 0, `tdd-review` Blocker 0

---

## NGV-1 — 그래프 빌드 + 레이아웃 순수 함수 (walking skeleton 1/2) · P0 · slice:logic

**설명**: 노트[]→`{nodes,edges}`(공유 태그 엣지) + 원형 레이아웃 좌표. `src/utils/noteGraph.ts`.
**AC**

- Given 같은 태그 'work'를 가진 노트 A·B, When buildNoteGraph([A,B]), Then weight=1 엣지 1개와 노드 2개를 반환한다.
- Given 태그가 겹치지 않는 노트들, When buildNoteGraph, Then 엣지가 없고 노드만 반환한다.
- Given 노드 N개, When layoutCircle, Then 각 노드에 결정적 (x,y)가 부여되고 개수가 보존된다.
- Given 휴지통 노트 포함, When 빌드, Then 활성 노트만 노드가 된다.
  **DoD**: 공통 + buildNoteGraph·layoutCircle 단위 테스트.

## NGV-2 — 그래프 SVG 렌더 + graph 뷰 토글 + 노드 클릭 (walking skeleton 2/2) · P0 · slice:ui

**설명**: `NoteGraph.tsx`(SVG 노드/엣지, 토큰 색), 헤더 `view`에 graph 추가, 노드 클릭→노트 열기.
**AC**

- Given 노드 2·엣지 1 그래프, When graph 뷰를 열면, Then circle 2개·line 1개가 렌더된다.
- Given 그래프에서 노드 클릭, When 클릭하면, Then onSelectNote(id)가 호출되고 노트 뷰로 전환된다.
- Given 노드 0~1개, When graph 뷰, Then "그래프로 볼 노트가 아직 적어요" 빈 상태를 보여준다.
  **DoD**: 공통 + NoteGraph 컴포넌트 테스트 + 디자인 시스템 게이트.

## NGV-3 — 엣지 가중치 표현 + 노드 라벨/접근성 다듬기 · P1 · slice:polish

**설명**: weight로 엣지 굵기 단계, 노드 라벨(제목) 표시, 빈 제목 "(제목 없음)", SVG `role`/aria 라벨.
**AC**

- Given weight 2인 엣지, When 렌더, Then weight 1보다 굵게(다른 stroke-width 단계) 표시된다.
- Given 빈 제목 노트, When 렌더, Then "(제목 없음)"으로 라벨링된다.
  **DoD**: 공통 + 굵기/라벨 단위·컴포넌트 테스트.

## 의존 순서

NGV-1 → NGV-2 (walking skeleton) → NGV-3.

## GitHub 이슈 역링크 (등록 완료)

| 이슈  | GitHub |
| ----- | ------ |
| NGV-1 | #85    |
| NGV-2 | #86    |
| NGV-3 | #87    |
