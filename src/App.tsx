import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotesProvider } from './context/NotesContext';
import { Layout } from './components/Layout';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { TrashList } from './components/TrashList';
import { SortControl } from './components/SortControl';
import { SearchBar } from './components/SearchBar';
import { LoginPage } from './components/LoginPage';
import { ChatPanel } from './components/ChatPanel';
import type { SortBy, SortDir } from './utils/sortNotes';

// 인증 게이트 — 미로그인 시 로그인 화면, 로그인 시 노트 화면 (ADR-0003)
function AppContent() {
  const { user, loading } = useAuth();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  // 휴지통/노트 화면 상태 — 순수 화면 상태이므로 App이 소유 (trash spec-fixed §1-3)
  const [view, setView] = useState<'notes' | 'trash'>('notes');
  // 정렬 기준·방향 — 화면 상태(App 소유), 기본 최근 수정 먼저 (sort spec-fixed §1)
  const [sortBy, setSortBy] = useState<SortBy>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  // 검색어 — 화면 상태(App 소유), 원본 불변 필터 (search spec-fixed §1)
  const [searchQuery, setSearchQuery] = useState('');
  // AI 비서 패널 열림 상태 (note-assistant-agent NAA-1). 화면 상태이므로 App 소유
  const [assistantOpen, setAssistantOpen] = useState(false);

  // NAA-1 자리표시자 — 실제 에이전트(runAgent) 연결은 NAA-3에서 교체한다
  const handleAgentSend = async (_text: string): Promise<string> => {
    return '에이전트 연결은 준비 중이에요. 곧 노트를 만들고 찾아드릴게요.';
  };

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
        onToggleAssistant={() => setAssistantOpen((v) => !v)}
        assistant={
          <ChatPanel
            open={assistantOpen}
            onClose={() => setAssistantOpen(false)}
            onSend={handleAgentSend}
          />
        }
        sidebar={
          view === 'trash' ? (
            <TrashList />
          ) : (
            <>
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
              <SortControl
                sortBy={sortBy}
                sortDir={sortDir}
                onSortByChange={setSortBy}
                onSortDirChange={setSortDir}
              />
              <NoteList
                selectedNoteId={selectedNoteId}
                onSelect={handleSelectNote}
                sortBy={sortBy}
                sortDir={sortDir}
                searchQuery={searchQuery}
              />
            </>
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
