import { useState, type KeyboardEvent } from 'react';
import { makeMessage, appendMessage } from '../lib/agent/messages';
import type { ChatMessage } from '../lib/agent/types';

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  // 주입 경계 — 사용자 입력을 받아 어시스턴트 응답 텍스트를 돌려준다(NAA-3에서 runAgent로 교체)
  onSend: (text: string) => Promise<string>;
}

/**
 * AI 비서 채팅 패널 (note-assistant-agent NAA-1, walking skeleton).
 * 입력→전송 시 사용자 메시지를 표시하고 주입된 onSend의 응답을 어시스턴트 메시지로 렌더한다.
 * 에이전트/도구 연결은 후속 슬라이스(NAA-2·3)에서 더한다.
 */
export function ChatPanel({ open, onClose, onSend }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  if (!open) return null;

  // 사용자 입력 전송 — 빈 입력·전송 중에는 무시(중복 차단)
  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setMessages((prev) => appendMessage(prev, makeMessage('user', text)));
    setInput('');
    setSending(true);
    try {
      const reply = await onSend(text);
      setMessages((prev) => appendMessage(prev, makeMessage('assistant', reply)));
    } catch {
      setMessages((prev) =>
        appendMessage(
          prev,
          makeMessage('assistant', '문제가 생겼어요. 잠시 후 다시 시도해 주세요.'),
        ),
      );
    } finally {
      setSending(false);
    }
  };

  // Enter 전송(Shift+Enter는 줄바꿈)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const canSend = input.trim().length > 0 && !sending;

  return (
    <aside
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-border bg-card shadow-lg"
      aria-label="AI 비서"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold text-foreground">AI 비서</h2>
        <button
          onClick={onClose}
          aria-label="닫기"
          className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-muted-foreground text-center py-8 text-sm">
            노트를 만들거나 찾아달라고 말해 보세요.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === 'user'
                ? 'ml-auto max-w-[85%] rounded-2xl bg-primary px-3 py-2 text-sm text-primary-foreground'
                : 'mr-auto max-w-[85%] rounded-2xl bg-muted px-3 py-2 text-sm text-foreground'
            }
          >
            {m.content}
          </div>
        ))}
        {sending && (
          <div
            data-testid="typing-indicator"
            aria-label="응답 작성 중"
            className="mr-auto rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground"
          >
            …
          </div>
        )}
      </div>

      {/* 입력 */}
      <div className="border-t border-border p-3 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="메시지를 입력하세요…"
          aria-label="메시지 입력"
          className="flex-1 resize-none px-3 py-2 bg-card border border-border rounded-xl text-sm
            text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2
            focus:ring-ring focus:border-transparent transition-all"
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold
            hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed
            cursor-pointer"
        >
          전송
        </button>
      </div>
    </aside>
  );
}
