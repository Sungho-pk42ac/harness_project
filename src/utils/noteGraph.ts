import { Note } from '../types/note';
import { activeNotes } from './trash';

// 노트 관계 그래프 모델 (note-graph-viz ADR-0001/0002). Neo4j 속성 그래프(노드/관계/속성)를 개념 참고.

export interface GraphNode {
  id: string;
  label: string; // 노트 제목(빈 제목은 NGV-3에서 다듬음)
  tagCount: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number; // 공유 태그 수
}

export interface NoteGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface PositionedNode extends GraphNode {
  x: number;
  y: number;
}

export interface LayoutSize {
  width: number;
  height: number;
}

/**
 * 노트 배열에서 관계 그래프를 만든다 (ADR-0002). 노드=활성 노트, 엣지=공유 태그(weight=공유 수).
 * 무방향·중복 없음·자기 자신 제외. 원본 불변·결정적.
 * @param notes 전체 노트(휴지통 포함 가능 — 내부에서 활성만 사용)
 */
export function buildNoteGraph(notes: Note[]): NoteGraph {
  const active = activeNotes(notes);
  const nodes: GraphNode[] = active.map((n) => ({
    id: n.id,
    label: n.title,
    tagCount: (n.tags ?? []).length,
  }));

  const edges: GraphEdge[] = [];
  for (let i = 0; i < active.length; i += 1) {
    for (let j = i + 1; j < active.length; j += 1) {
      const tagsA = new Set(active[i].tags ?? []);
      const shared = (active[j].tags ?? []).filter((t) => tagsA.has(t));
      if (shared.length > 0) {
        edges.push({ source: active[i].id, target: active[j].id, weight: shared.length });
      }
    }
  }

  return { nodes, edges };
}

/**
 * 노드를 원주에 균등 배치한다 (ADR-0004). 결정적·순수 — 같은 입력은 같은 좌표.
 * 단일 노드는 중앙. 반지름은 캔버스 짧은 변의 40%.
 * @param nodes 배치할 노드
 * @param size 캔버스 크기
 */
export function layoutCircle(nodes: GraphNode[], size: LayoutSize): PositionedNode[] {
  const cx = size.width / 2;
  const cy = size.height / 2;
  if (nodes.length === 1) {
    return [{ ...nodes[0], x: cx, y: cy }];
  }
  const radius = Math.min(size.width, size.height) * 0.4;
  return nodes.map((node, i) => {
    const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2; // 12시 방향부터 시계방향
    return {
      ...node,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });
}
