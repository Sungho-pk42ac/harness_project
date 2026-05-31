import { useNotes } from '../context/NotesContext';
import { buildNoteGraph, layoutCircle, type PositionedNode } from '../utils/noteGraph';

interface NoteGraphProps {
  onSelectNote: (id: string) => void;
}

const SIZE = { width: 640, height: 480 };

/** weight를 stroke-width 단계로 (1→1.5, 2→2.5, …). NGV-3에서 시각 다듬음. */
function edgeWidth(weight: number): number {
  return 1 + weight * 0.5;
}

/**
 * 노트 관계 그래프 (note-graph-viz NGV-2). 활성 노트를 노드로, 공유 태그를 엣지로 SVG 렌더한다.
 * 노드 클릭 시 onSelectNote로 해당 노트를 연다. 색은 디자인 시스템 시맨틱 토큰 클래스만 사용(ADR-0003).
 */
export function NoteGraph({ onSelectNote }: NoteGraphProps) {
  const { notes } = useNotes();
  const graph = buildNoteGraph(notes);

  // 노드가 너무 적으면 그래프가 무의미 — 친화 빈 상태(spec-fixed §4)
  if (graph.nodes.length < 2) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground text-sm">
          그래프로 볼 노트가 아직 적어요. 태그가 있는 노트를 2개 이상 만들어 보세요.
        </p>
      </div>
    );
  }

  const positioned = layoutCircle(graph.nodes, SIZE);
  const byId = new Map<string, PositionedNode>(positioned.map((p) => [p.id, p]));

  return (
    <div className="h-full w-full overflow-auto">
      <svg
        viewBox={`0 0 ${SIZE.width} ${SIZE.height}`}
        className="mx-auto h-auto w-full max-w-3xl"
        role="img"
        aria-label="노트 관계 그래프"
      >
        {/* 엣지 먼저(노드 아래로) */}
        {graph.edges.map((e) => {
          const s = byId.get(e.source);
          const t = byId.get(e.target);
          if (!s || !t) return null;
          return (
            <line
              key={`${e.source}-${e.target}`}
              x1={s.x}
              y1={s.y}
              x2={t.x}
              y2={t.y}
              className="stroke-border"
              strokeWidth={edgeWidth(e.weight)}
            />
          );
        })}
        {/* 노드 */}
        {positioned.map((n) => (
          <g
            key={n.id}
            transform={`translate(${n.x}, ${n.y})`}
            className="cursor-pointer"
            role="button"
            aria-label={`노트: ${n.label || '(제목 없음)'}`}
            onClick={() => onSelectNote(n.id)}
          >
            <circle r={10} className="fill-primary" />
            <text y={24} textAnchor="middle" className="fill-foreground text-xs">
              {n.label || '(제목 없음)'}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
