import { describe, it, expect, vi } from 'vitest';
import { createOpenAiLlmClient, type OpenAiRequestBody } from './openaiClient';

describe('agent/openaiClient', () => {
  it('should 텍스트 응답을 LlmResponse로 파싱한다 when tool_calls 없음', async () => {
    const transport = vi.fn(async () => ({
      choices: [{ message: { content: '안녕하세요' } }],
    }));
    const client = createOpenAiLlmClient(transport);
    const res = await client.complete([{ role: 'user', content: '안녕' }]);
    expect(res.content).toBe('안녕하세요');
    expect(res.toolCalls).toEqual([]);
  });

  it('should tool_calls를 ToolCall[]로 파싱한다(arguments JSON 파싱 포함)', async () => {
    const transport = vi.fn(async () => ({
      choices: [
        {
          message: {
            content: null,
            tool_calls: [
              { id: 'c1', function: { name: 'createNote', arguments: '{"title":"회의"}' } },
            ],
          },
        },
      ],
    }));
    const client = createOpenAiLlmClient(transport);
    const res = await client.complete([{ role: 'user', content: '만들어줘' }]);
    expect(res.toolCalls).toEqual([{ id: 'c1', name: 'createNote', args: { title: '회의' } }]);
    expect(res.content).toBe('');
  });

  it('should 손상된 arguments를 빈 객체로 안전 처리한다', async () => {
    const transport = vi.fn(async () => ({
      choices: [
        {
          message: { tool_calls: [{ id: 'c2', function: { name: 'listNotes', arguments: '{' } }] },
        },
      ],
    }));
    const client = createOpenAiLlmClient(transport);
    const res = await client.complete([{ role: 'user', content: '목록' }]);
    expect(res.toolCalls[0]).toEqual({ id: 'c2', name: 'listNotes', args: {} });
  });

  it('should model·messages·tools를 transport에 전달한다', async () => {
    let captured: OpenAiRequestBody | null = null;
    const transport = vi.fn(async (body: OpenAiRequestBody) => {
      captured = body;
      return { choices: [{ message: { content: 'ok' } }] };
    });
    const client = createOpenAiLlmClient(transport, 'gpt-4o');
    await client.complete([
      {
        role: 'assistant',
        content: '',
        toolCalls: [{ id: 'c1', name: 'createNote', args: { title: 'x' } }],
      },
      { role: 'tool', toolCallId: 'c1', content: '{"ok":true}' },
    ]);
    expect(captured!.model).toBe('gpt-4o');
    expect(Array.isArray(captured!.tools)).toBe(true);
    // assistant tool_calls 매핑 + tool 메시지 매핑 확인
    const msgs = captured!.messages as Array<Record<string, unknown>>;
    expect(msgs[0]).toMatchObject({ role: 'assistant' });
    expect(msgs[1]).toMatchObject({ role: 'tool', tool_call_id: 'c1' });
  });
});
