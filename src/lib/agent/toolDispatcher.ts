import type { Note } from '../../types/note';
import type { ToolCall, ToolResult } from './types';

/**
 * 도구가 호출하는 노트 동작 의존성. 브라우저의 NotesContext 액션/utils를 주입한다(ADR-0003).
 * 모두 사용자 세션을 통하므로 RLS가 자동 준수된다.
 */
export interface ToolDeps {
  addNote: (title: string, content: string, tags: string[]) => Promise<Note>;
  editNote: (id: string, updates: Partial<Note>) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
  getNotes: () => Note[]; // 활성 노트 스냅샷
  searchNotes: (query: string) => Note[]; // filterNotes 위임
  // 삭제 실행 전 사용자 확인 (ADR-0004). 미주입 시(테스트 등) 확인 없이 진행하지 않고 차단한다.
  confirmDelete?: (id: string) => Promise<boolean>;
}

const ok = (toolCallId: string, data: unknown): ToolResult => ({ toolCallId, ok: true, data });
const err = (toolCallId: string, error: string): ToolResult => ({ toolCallId, ok: false, error });

/** 노트 요약 메타(LLM 컨텍스트용 — 본문 전체 대신 id/제목). */
const summarize = (n: Note) => ({ id: n.id, title: n.title });

const asString = (v: unknown): string => (typeof v === 'string' ? v : '');
const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

/**
 * 도구 호출 1건을 실행한다. 검증 실패·미지원 도구·내부 예외는 모두 throw하지 않고
 * ok=false 결과로 회신해 에이전트 루프가 모델에 전달할 수 있게 한다.
 */
export async function dispatchTool(call: ToolCall, deps: ToolDeps): Promise<ToolResult> {
  const { id, name, args } = call;
  try {
    switch (name) {
      case 'createNote': {
        const title = asString(args.title).trim();
        if (!title) return err(id, 'title은 비어 있을 수 없습니다');
        const note = await deps.addNote(title, asString(args.content), asStringArray(args.tags));
        return ok(id, summarize(note));
      }
      case 'updateNote': {
        const noteId = asString(args.id);
        if (!noteId) return err(id, 'id가 필요합니다');
        const updates: Partial<Note> = {};
        if (typeof args.title === 'string') updates.title = args.title;
        if (typeof args.content === 'string') updates.content = args.content;
        if (Array.isArray(args.tags)) updates.tags = asStringArray(args.tags);
        if (typeof args.isPinned === 'boolean') updates.isPinned = args.isPinned;
        if (Object.keys(updates).length === 0) return err(id, '변경할 필드가 없습니다');
        await deps.editNote(noteId, updates);
        return ok(id, { id: noteId, updated: Object.keys(updates) });
      }
      case 'deleteNote': {
        const noteId = asString(args.id);
        if (!noteId) return err(id, 'id가 필요합니다');
        // 확인 게이트(ADR-0004) — 콜백이 없거나 사용자가 취소하면 삭제하지 않는다.
        const approved = deps.confirmDelete ? await deps.confirmDelete(noteId) : false;
        if (!approved) {
          return ok(id, { id: noteId, deleted: false, cancelled: true });
        }
        await deps.removeNote(noteId);
        return ok(id, { id: noteId, deleted: true });
      }
      case 'searchNotes': {
        const query = asString(args.query).trim();
        if (!query) return err(id, 'query가 필요합니다');
        return ok(id, deps.searchNotes(query).map(summarize));
      }
      case 'listNotes': {
        return ok(id, deps.getNotes().map(summarize));
      }
      default:
        return err(id, `알 수 없는 도구: ${name}`);
    }
  } catch (e) {
    return err(id, e instanceof Error ? e.message : '도구 실행 실패');
  }
}
