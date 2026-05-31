import { describe, it, expect } from 'vitest';
import { makeMessage, appendMessage } from './messages';

describe('agent/messages', () => {
  it('should 고유 id·role·content를 가진 메시지를 만든다 when makeMessage', () => {
    const m = makeMessage('user', '안녕');
    expect(m.role).toBe('user');
    expect(m.content).toBe('안녕');
    expect(typeof m.id).toBe('string');
    expect(m.id.length).toBeGreaterThan(0);
  });

  it('should 주어진 id를 그대로 쓴다 when id를 명시한다', () => {
    expect(makeMessage('assistant', 'hi', 'x1').id).toBe('x1');
  });

  it('should 원본을 변형하지 않고 새 배열에 추가한다 when appendMessage', () => {
    const list = [makeMessage('user', 'a', 'a1')];
    const m = makeMessage('assistant', 'b', 'b1');
    const next = appendMessage(list, m);
    expect(next).toHaveLength(2);
    expect(list).toHaveLength(1); // 원본 불변
    expect(next[1]).toBe(m);
  });
});
