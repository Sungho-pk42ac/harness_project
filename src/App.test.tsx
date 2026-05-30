import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import * as authApi from './api/auth';
import * as notesApi from './api/notes';
import type { User } from './types/user';

// 네트워크 경계(api 모듈)를 모킹해 인증 게이트 동작만 검증한다.
vi.mock('./api/auth');
vi.mock('./api/notes');

const seededUser: User = { id: 'u1', email: 'test@test.com' };

describe('App (인증 게이트)', () => {
  beforeEach(() => {
    vi.mocked(notesApi.fetchNotes).mockResolvedValue([]);
    localStorage.clear();
  });

  it('[경계] App — should 로그인 화면(이메일·비밀번호·로그인 버튼)을 보여준다 when 미로그인 상태로 앱을 연다', () => {
    render(<App />);
    // 로그인 폼 요소가 보인다
    expect(screen.getByPlaceholderText('이메일')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('비밀번호')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
    // 노트 화면(+ 새 노트)은 보이지 않는다
    expect(screen.queryByRole('button', { name: '+ 새 노트' })).not.toBeInTheDocument();
  });

  it('[정상] App — should 노트 화면(+ 새 노트)으로 전환된다 when 올바른 계정으로 로그인한다', async () => {
    vi.mocked(authApi.login).mockResolvedValue(seededUser);
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByPlaceholderText('이메일'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('비밀번호'), '1234');
    await user.click(screen.getByRole('button', { name: '로그인' }));
    // 노트 화면으로 전환 — Layout의 "+ 새 노트"가 보인다
    expect(await screen.findByRole('button', { name: '+ 새 노트' })).toBeInTheDocument();
  });

  it('[예외] App — should 로그인 화면에 머문다 when 잘못된 계정으로 로그인을 시도한다', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid credentials'));
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByPlaceholderText('이메일'), 'no@no.com');
    await user.type(screen.getByPlaceholderText('비밀번호'), 'wrong');
    await user.click(screen.getByRole('button', { name: '로그인' }));
    // 노트 화면으로 전환되지 않고 로그인 폼이 유지된다
    expect(await screen.findByPlaceholderText('이메일')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ 새 노트' })).not.toBeInTheDocument();
  });
});
