import { useMemo, useState } from 'react';
import { ChatPanel, type PendingConfirm } from './ChatPanel';
import { useNotes } from '../context/NotesContext';
import { createAgentSend } from '../lib/agent/agentClient';
import { filterNotes } from '../utils/filterNotes';
import { activeNotes } from '../utils/trash';

interface AssistantContainerProps {
  open: boolean;
  onClose: () => void;
}

interface PendingState {
  title: string;
  resolve: (approved: boolean) => void;
}

/**
 * AI 비서 컨테이너 (note-assistant-agent). NotesProvider 안에서 렌더되어 useNotes로 도구 의존성을
 * 구성하고, runAgent+OpenAI(프록시)를 ChatPanel의 onSend로 주입한다. 도구가 NotesContext를 거치므로
 * 결과가 좌측 목록/에디터에 자동 반영되고 RLS도 자동 준수된다(ADR-0003).
 *
 * 삭제는 confirmDelete를 통해 확인 카드를 띄우고, 사용자가 [확인]할 때만 실제 삭제된다(ADR-0004).
 */
export function AssistantContainer({ open, onClose }: AssistantContainerProps) {
  const { notes, addNote, editNote, removeNote } = useNotes();
  const [pending, setPending] = useState<PendingState | null>(null);

  const onSend = useMemo(
    () =>
      createAgentSend({
        addNote,
        editNote,
        removeNote,
        getNotes: () => activeNotes(notes),
        searchNotes: (query: string) => filterNotes(activeNotes(notes), query),
        // 삭제 확인 게이트 — 확인 카드를 띄우고 사용자의 선택을 Promise로 resolve한다(ADR-0004)
        confirmDelete: (id: string) =>
          new Promise<boolean>((resolve) => {
            const note = notes.find((n) => n.id === id);
            setPending({ title: note?.title ?? id, resolve });
          }),
      }),
    [notes, addNote, editNote, removeNote],
  );

  const pendingConfirm: PendingConfirm | null = pending
    ? {
        title: pending.title,
        onConfirm: () => {
          pending.resolve(true);
          setPending(null);
        },
        onCancel: () => {
          pending.resolve(false);
          setPending(null);
        },
      }
    : null;

  return (
    <ChatPanel open={open} onClose={onClose} onSend={onSend} pendingConfirm={pendingConfirm} />
  );
}
