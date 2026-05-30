import { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  onNewNote: () => void;
  sidebar: ReactNode;
  main: ReactNode;
  // 휴지통/노트 화면 전환 (trash spec-fixed §3-2)
  view: 'notes' | 'trash';
  onToggleView: () => void;
}

export function Layout({ onNewNote, sidebar, main, view, onToggleView }: LayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-2xl font-bold text-foreground font-['Boogaloo',_sans-serif]">
          📝 Notes
        </h1>
        <div className="flex items-center gap-3">
          {/* 현재 사용자 이메일 */}
          {user && <span className="text-sm text-muted-foreground">{user.email}</span>}
          {/* 휴지통 토글 — 노트/휴지통 화면 전환 */}
          <button
            onClick={onToggleView}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {view === 'trash' ? '노트로 돌아가기' : '휴지통'}
          </button>
          <button
            onClick={onNewNote}
            className="bg-foreground text-card px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-75 transition-opacity cursor-pointer"
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
