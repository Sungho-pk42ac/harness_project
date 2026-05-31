# NAA-2 (#73) — 시그니처 + 테스트 시나리오

> 도구 계약 + 순수 디스패처. LLM 무관, 결정적 단위 테스트(ADR-0003/0005).

## 확정 시그니처

### `src/lib/agent/types.ts` (확장)

```ts
export type ToolName = 'createNote' | 'searchNotes' | 'listNotes' | 'updateNote' | 'deleteNote';
export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}
export interface ToolResult {
  toolCallId: string;
  ok: boolean;
  data?: unknown;
  error?: string;
}
```

### `src/lib/agent/tools.ts`

```ts
export interface ToolSchema {
  name: ToolName;
  description: string;
  parameters: Record<string, unknown>;
}
export const TOOL_SCHEMAS: ToolSchema[]; // OpenAI function-calling 스키마 5종
export const TOOLS_REQUIRING_CONFIRMATION: ReadonlySet<string>; // {'deleteNote'} (ADR-0004)
```

### `src/lib/agent/toolDispatcher.ts`

```ts
export interface ToolDeps {
  addNote: (title: string, content: string, tags: string[]) => Promise<Note>;
  editNote: (id: string, updates: Partial<Note>) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
  getNotes: () => Note[];
  searchNotes: (query: string) => Note[];
}
export function dispatchTool(call: ToolCall, deps: ToolDeps): Promise<ToolResult>;
```

- 검증 실패·미지원 도구·내부 예외는 throw하지 않고 ok=false로 회신(루프가 모델에 전달).

## 시나리오 (should…when…)

- should addNote를 매핑 인자로 호출하고 생성 노트를 반환 when createNote(정상)
- should 검증 에러 반환 + addNote 미호출 when title이 빈 createNote
- should 에러 결과 반환(throw 아님) when 알 수 없는 도구
- should editNote 호출 when updateNote / should 변경 필드 없으면 에러 when updateNote
- should removeNote 호출 when deleteNote
- should searchNotes 위임 결과 반환 when searchNotes / should 전체 활성 노트 반환 when listNotes
- should 액션 throw를 ok=false로 회신 when 도구 내부 에러
