# NAA-1 (#72) — 시그니처 + 테스트 시나리오

> walking skeleton: 채팅 패널 UI + 메시지 왕복. 에이전트/도구는 NAA-2·3. `onSend`는 주입 경계.

## 확정 시그니처 (계약)

### `src/lib/agent/types.ts`

```ts
export type ChatRole = 'user' | 'assistant';

/** 채팅 한 줄. id는 React 키/중복 방지용 고유값. (NAA-2/3에서 tool 역할·toolCalls로 확장 예정) */
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}
```

### `src/lib/agent/messages.ts` (순수 함수)

```ts
/** role+content로 메시지를 만든다. id 미지정 시 crypto.randomUUID()로 생성(테스트는 id 주입 가능). */
export function makeMessage(role: ChatRole, content: string, id?: string): ChatMessage;

/** 불변 append — 새 배열을 반환한다(원본 유지). */
export function appendMessage(messages: ChatMessage[], message: ChatMessage): ChatMessage[];
```

### `src/components/ChatPanel.tsx`

```ts
interface ChatPanelProps {
  open: boolean; // 열림 여부(닫히면 미렌더)
  onClose: () => void; // 닫기
  onSend: (text: string) => Promise<string>; // 주입 경계 — 사용자 입력→어시스턴트 응답 텍스트
}
export function ChatPanel(props: ChatPanelProps): JSX.Element | null;
```

- 로컬 상태: `messages: ChatMessage[]`, `input: string`, `sending: boolean`.
- 전송: 빈 입력 무시 → 사용자 메시지 append → `sending=true` → `await onSend` → 어시스턴트 메시지 append → `sending=false`.
- `sending` 중 타이핑 인디케이터 표시 + 전송 비활성(중복 차단).

### App/Layout 배선 (최소)

- `Layout`에 옵셔널 `assistant?: ReactNode`(오버레이 슬롯) + `onToggleAssistant?: () => void`(헤더 토글) 추가 — **옵셔널이라 기존 호출부 불변**.
- `App`이 `assistantOpen` 상태를 소유하고, 헤더 "AI 비서" 토글 + `ChatPanel`을 주입. NAA-1의 `onSend`는 자리표시자(NAA-3에서 `runAgent`로 교체).

## 시나리오 (should…when…)

### messages.ts (단위)

- S1 should 고유 id·role·content를 가진 메시지를 만든다 when makeMessage('user','안녕')
- S2 should 주어진 id를 그대로 쓴다 when makeMessage('assistant','hi','x1')
- S3 should 원본을 변형하지 않고 새 배열에 추가한다 when appendMessage(list, msg)

### ChatPanel (컴포넌트, RTL)

- S4 should 닫혀 있으면 아무것도 렌더하지 않는다 when open=false
- S5 should 사용자 메시지 "안녕"이 목록에 보인다 when "안녕" 입력 후 전송
- S6 should 어시스턴트 메시지 "반가워요"가 이어서 렌더된다 when onSend가 "반가워요"를 반환
- S7 should 메시지가 추가되지 않는다 when 빈 입력으로 전송
- S8 should 전송 대기 중 타이핑 인디케이터가 보이고 중복 전송이 차단된다 when onSend가 미해결 상태
- S9 should onClose가 호출된다 when 닫기 버튼 클릭

## 디자인 AC (브랜드)

- 전송 버튼은 핵심 액션 → `bg-primary text-primary-foreground`. 입력은 디자인 시스템 input 패턴.
- 임의 hex/그림자/인라인 style 0. 시맨틱 토큰만.
