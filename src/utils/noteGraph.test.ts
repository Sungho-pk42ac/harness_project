import { describe, it, expect } from 'vitest';
import { buildNoteGraph, layoutCircle } from './noteGraph';
import type { Note } from '../types/note';

function makeNote(over: Partial<Note> = {}): Note {
  return {
    id: 'n1',
    title: '노트',
    content: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    tags: [],
    isPinned: false,
    deletedAt: null,
    ...over,
  };
}

describe('utils/noteGraph buildNoteGraph', () => {
  it('should 공유 태그가 있으면 weight=공유수 엣지로 잇는다', () => {
    const a = makeNote({ id: 'a', tags: ['work'] });
    const b = makeNote({ id: 'b', tags: ['work'] });
    const g = buildNoteGraph([a, b]);
    expect(g.nodes).toHaveLength(2);
    expect(g.edges).toHaveLength(1);
    expect(g.edges[0]).toMatchObject({ source: 'a', target: 'b', weight: 1 });
  });

  it('should 공유 태그 수만큼 weight를 매긴다', () => {
    const a = makeNote({ id: 'a', tags: ['work', 'urgent'] });
    const b = makeNote({ id: 'b', tags: ['work', 'urgent', 'x'] });
    const g = buildNoteGraph([a, b]);
    expect(g.edges[0].weight).toBe(2);
  });

  it('should 공유 태그가 없으면 엣지 없이 노드만 반환한다', () => {
    const a = makeNote({ id: 'a', tags: ['work'] });
    const b = makeNote({ id: 'b', tags: ['home'] });
    const g = buildNoteGraph([a, b]);
    expect(g.nodes).toHaveLength(2);
    expect(g.edges).toHaveLength(0);
  });

  it('should 활성 노트만 노드로 만든다 (휴지통 제외)', () => {
    const a = makeNote({ id: 'a', tags: ['work'] });
    const trashed = makeNote({ id: 't', tags: ['work'], deletedAt: '2026-02-01T00:00:00.000Z' });
    const g = buildNoteGraph([a, trashed]);
    expect(g.nodes.map((n) => n.id)).toEqual(['a']);
    expect(g.edges).toHaveLength(0);
  });

  it('should 같은 쌍을 중복 엣지로 만들지 않는다', () => {
    const a = makeNote({ id: 'a', tags: ['x', 'y'] });
    const b = makeNote({ id: 'b', tags: ['x', 'y'] });
    const c = makeNote({ id: 'c', tags: ['x'] });
    const g = buildNoteGraph([a, b, c]);
    // a-b(2), a-c(1), b-c(1) = 3개, 중복 없음
    expect(g.edges).toHaveLength(3);
  });

  it('should tagCount를 노드 속성으로 담는다', () => {
    const a = makeNote({ id: 'a', tags: ['x', 'y'] });
    const g = buildNoteGraph([a]);
    expect(g.nodes[0]).toMatchObject({ id: 'a', label: '노트', tagCount: 2 });
  });
});

describe('utils/noteGraph layoutCircle', () => {
  it('should 모든 노드에 좌표를 부여하고 개수를 보존한다', () => {
    const g = buildNoteGraph([
      makeNote({ id: 'a', tags: ['x'] }),
      makeNote({ id: 'b', tags: ['x'] }),
      makeNote({ id: 'c', tags: ['x'] }),
    ]);
    const positioned = layoutCircle(g.nodes, { width: 200, height: 200 });
    expect(positioned).toHaveLength(3);
    positioned.forEach((p) => {
      expect(typeof p.x).toBe('number');
      expect(typeof p.y).toBe('number');
    });
  });

  it('should 결정적이다 (같은 입력→같은 좌표)', () => {
    const nodes = buildNoteGraph([makeNote({ id: 'a' }), makeNote({ id: 'b' })]).nodes;
    const a = layoutCircle(nodes, { width: 100, height: 100 });
    const b = layoutCircle(nodes, { width: 100, height: 100 });
    expect(a).toEqual(b);
  });

  it('should 단일 노드는 중앙에 둔다', () => {
    const nodes = buildNoteGraph([makeNote({ id: 'a' })]).nodes;
    const [p] = layoutCircle(nodes, { width: 200, height: 200 });
    expect(p.x).toBeCloseTo(100);
    expect(p.y).toBeCloseTo(100);
  });
});
