import { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NotesContext';
import { notesToJson, buildExportFilename } from '../lib/export';
import { downloadTextFile } from '../lib/download';

interface LayoutProps {
  onNewNote: () => void;
  sidebar: ReactNode;
  main: ReactNode;
  // 화면 전환: 노트/휴지통/그래프 (trash spec-fixed §3-2, note-graph-viz §5)
  view: 'notes' | 'trash' | 'graph';
  onToggleView: () => void;
  // 그래프 뷰 토글 (note-graph-viz NGV-2). 옵셔널 — 미주입 시 버튼 미표시
  onToggleGraph?: () => void;
}

export function Layout({
  onNewNote,
  sidebar,
  main,
  view,
  onToggleView,
  onToggleGraph,
}: LayoutProps) {
  const { user, logout } = useAuth();
  const { notes } = useNotes();

  // 전체 노트를 JSON 한 파일로 백업한다 (export spec-fixed §2·§5). 노트 0건이면 버튼 비활성.
  const handleBackup = () => {
    if (notes.length === 0) return;
    try {
      downloadTextFile(
        buildExportFilename('notes-backup', 'json'),
        notesToJson(notes),
        'application/json',
      );
    } catch (e) {
      console.error(e);
      alert('백업에 실패했습니다');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-sm">
        {/* 로고 — 라틴 워드마크는 font-display(Boogaloo), 인디고 포인트 (디자인 시스템 타이포·컬러) */}
        <h1 className="text-3xl font-display tracking-wide text-primary">SLNOTE</h1>
        <div className="flex items-center gap-3">
          {/* 현재 사용자 이메일 */}
          {user && <span className="text-sm text-muted-foreground">{user.email}</span>}
          {/* 그래프 토글 — 노트/그래프 화면 전환 (note-graph-viz) */}
          {onToggleGraph && (
            <button
              onClick={onToggleGraph}
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {view === 'graph' ? '노트로 돌아가기' : '그래프'}
            </button>
          )}
          {/* 휴지통 토글 — 노트/휴지통 화면 전환 */}
          <button
            onClick={onToggleView}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {view === 'trash' ? '노트로 돌아가기' : '휴지통'}
          </button>
          {/* 전체 노트 JSON 백업 — 노트 0건이면 비활성 */}
          <button
            onClick={handleBackup}
            disabled={notes.length === 0}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            백업
          </button>
          <button
            onClick={onNewNote}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors cursor-pointer"
          >
            + 새 노트
          </button>
          {/* 로그아웃 */}
          <button
            onClick={logout}
            className="text-sm font-semibold text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* 바디 */}
      <div className="flex h-[calc(100vh-65px)]">
        {/* 사이드바 */}
        <div className="w-72 border-r border-border overflow-y-auto bg-muted/50 p-3 space-y-2 shrink-0">
          {sidebar}
        </div>

        {/* 메인 */}
        <div className="flex-1 overflow-y-auto p-8">{main}</div>
      </div>
    </div>
  );
}
