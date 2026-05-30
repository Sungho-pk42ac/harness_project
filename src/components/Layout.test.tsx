import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Layout } from './Layout';
import type { Note } from '../types/note';

let mockNotes: Note[] = [];

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'test@test.com' }, logout: vi.fn() }),
}));
vi.mock('../context/NotesContext', () => ({
  useNotes: () => ({ notes: mockNotes }),
}));
vi.mock('../lib/download', () => ({ downloadTextFile: vi.fn() }));
import { downloadTextFile } from '../lib/download';
const mockedDownload = vi.mocked(downloadTextFile);

const makeNote = (id: string): Note => ({
  id,
  title: `t${id}`,
  content: 'c',
  tags: [],
  isPinned: false,
  createdAt: 'now',
  updatedAt: 'now',
});

const noop = () => {};
const renderLayout = () =>
  render(
    <Layout onNewNote={noop} view="notes" onToggleView={noop} sidebar={<div />} main={<div />} />,
  );

describe('Layout 백업 버튼 (EXPORT-2)', () => {
  beforeEach(() => {
    mockedDownload.mockClear();
    mockNotes = [];
  });

  it('[정상] should 노트가 있으면 백업 클릭 시 .json 파일명·JSON으로 downloadTextFile을 호출한다', async () => {
    const user = userEvent.setup();
    mockNotes = [makeNote('1'), makeNote('2')];
    renderLayout();
    await user.click(screen.getByRole('button', { name: '백업' }));
    expect(mockedDownload).toHaveBeenCalledTimes(1);
    const [filename, text, mime] = mockedDownload.mock.calls[0];
    expect(filename).toMatch(/^notes-backup-\d{4}-\d{2}-\d{2}\.json$/);
    expect(JSON.parse(text)).toHaveLength(2);
    expect(mime).toBe('application/json');
  });

  it('[경계] should 노트가 0건이면 백업 버튼이 비활성이다', () => {
    mockNotes = [];
    renderLayout();
    expect(screen.getByRole('button', { name: '백업' })).toBeDisabled();
  });
});
