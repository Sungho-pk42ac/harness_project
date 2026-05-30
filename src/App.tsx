import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotesProvider } from './context/NotesContext';
import { Layout } from './components/Layout';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { TrashList } from './components/TrashList';
import { LoginPage } from './components/LoginPage';

// 인증 게이트 — 미로그인 시 로그인 화면, 로그인 시 노트 화면 (ADR-0003)
function AppContent() {
  const { user, loading } = useAuth();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  // 휴지통/노트 화면 상태 — 순수 화면 상태이므로 App이 소유 (trash spec-fixed §1-3)
  const [view, setView] = useState<'notes' | 'trash'>('notes');

  const handleSelectNote = (id: string) => {
    setSelectedNoteId(id);
    setIsCreating(false);
  };

  const handleNewNote = () => {
    setSelectedNoteId(null);
    setIsCreating(true);
    setView('notes'); // 새 노트 작성은 노트 화면에서
  };

  // 휴지통/노트 화면 토글
  const handleToggleView = () => {
    setView((prev) => (prev === 'trash' ? 'notes' : 'trash'));
  };

  const handleDone = () => {
    setIsCreating(false);
    // 저장 후 선택 상태는 유지
  };

  // 세션 복원 판정 중에는 가드 — LoginPage 깜빡임 방지 (ADR-0002)
  if (loading) {
    return null;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <NotesProvider>
      <Layout
        onNewNote={handleNewNote}
        view={view}
        onToggleView={handleToggleView}
        sidebar={
          view === 'trash' ? (
            <TrashList />
          ) : (
            <NoteList selectedNoteId={selectedNoteId} onSelect={handleSelectNote} />
          )
        }
        main={
          <NoteEditor selectedNoteId={selectedNoteId} isCreating={isCreating} onDone={handleDone} />
        }
      />
    </NotesProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
