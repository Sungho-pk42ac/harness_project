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

describe('App (세션 유지)', () => {
  beforeEach(() => {
    vi.mocked(notesApi.fetchNotes).mockResolvedValue([]);
    localStorage.clear();
  });

  it('[정상] App — should 다시 로그인하지 않아도 노트 화면(+ 새 노트)이 보인다 when localStorage에 user가 저장돼 있고 앱을 연다', async () => {
    // Arrange: 이전 세션이 localStorage에 남아 있다
    localStorage.setItem('auth.user', JSON.stringify(seededUser));
    // Act
    render(<App />);
    // Assert: 로그인 없이 노트 화면 복원
    expect(await screen.findByRole('button', { name: '+ 새 노트' })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('이메일')).not.toBeInTheDocument();
  });

  it('[정상] AuthContext — should localStorage에 비밀번호 없이 {id,email}만 저장한다 when 로그인에 성공한다', async () => {
    vi.mocked(authApi.login).mockResolvedValue(seededUser);
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByPlaceholderText('이메일'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('비밀번호'), '1234');
    await user.click(screen.getByRole('button', { name: '로그인' }));
    await screen.findByRole('button', { name: '+ 새 노트' });
    // Assert: 저장된 세션에 비밀번호가 없다
    const stored = JSON.parse(localStorage.getItem('auth.user') ?? '{}');
    expect(stored).toEqual({ id: 'u1', email: 'test@test.com' });
    expect(stored).not.toHaveProperty('password');
  });

  it('[경계] App — should 로그인 화면이 깜빡이지 않는다 when 저장된 세션을 복원하며 시작한다', async () => {
    localStorage.setItem('auth.user', JSON.stringify(seededUser));
    render(<App />);
    // 복원 중 loading 가드로 LoginPage가 렌더되지 않아 이메일 입력칸이 끝까지 나타나지 않는다
    await screen.findByRole('button', { name: '+ 새 노트' });
    expect(screen.queryByPlaceholderText('이메일')).not.toBeInTheDocument();
  });
});

describe('App (로그아웃·사용자 표시)', () => {
  beforeEach(() => {
    vi.mocked(notesApi.fetchNotes).mockResolvedValue([]);
    localStorage.clear();
  });

  it('[정상] App — should 로그인 화면으로 돌아간다 when 로그인 상태에서 헤더의 로그아웃 버튼을 누른다', async () => {
    localStorage.setItem('auth.user', JSON.stringify(seededUser));
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('button', { name: '+ 새 노트' });
    // Act: 로그아웃
    await user.click(screen.getByRole('button', { name: '로그아웃' }));
    // Assert: 로그인 화면 복귀
    expect(await screen.findByPlaceholderText('이메일')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ 새 노트' })).not.toBeInTheDocument();
  });

  it('[정상] App — should localStorage 세션이 제거된다 when 로그아웃한다', async () => {
    localStorage.setItem('auth.user', JSON.stringify(seededUser));
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('button', { name: '+ 새 노트' });
    await user.click(screen.getByRole('button', { name: '로그아웃' }));
    // Assert: 세션 제거 → 자동 재로그인 불가
    expect(localStorage.getItem('auth.user')).toBeNull();
  });

  it('[정상] Layout — should 헤더에 현재 사용자 이메일이 표시된다 when test@test.com으로 로그인돼 있다', async () => {
    localStorage.setItem('auth.user', JSON.stringify(seededUser));
    render(<App />);
    await screen.findByRole('button', { name: '+ 새 노트' });
    // Assert: 헤더에 이메일 표시
    expect(screen.getByText('test@test.com')).toBeInTheDocument();
  });
});

describe('App (로그인 실패 에러)', () => {
  beforeEach(() => {
    vi.mocked(notesApi.fetchNotes).mockResolvedValue([]);
    localStorage.clear();
  });

  const submitLogin = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByPlaceholderText('이메일'), 'x@x.com');
    await user.type(screen.getByPlaceholderText('비밀번호'), 'pw');
    await user.click(screen.getByRole('button', { name: '로그인' }));
  };

  it('[예외] LoginPage — should "이메일 또는 비밀번호가 올바르지 않습니다." 인라인 메시지를 보여준다 when 잘못된 자격증명으로 실패한다', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid credentials'));
    const user = userEvent.setup();
    render(<App />);
    await submitLogin(user);
    expect(
      await screen.findByText('이메일 또는 비밀번호가 올바르지 않습니다.'),
    ).toBeInTheDocument();
  });

  it('[예외] LoginPage — should alert를 호출하지 않는다 when 로그인이 실패한다', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid credentials'));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const user = userEvent.setup();
    render(<App />);
    await submitLogin(user);
    await screen.findByText('이메일 또는 비밀번호가 올바르지 않습니다.');
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('[예외] LoginPage — should 사용자 친화적 에러 메시지를 보여준다 when 네트워크 오류로 실패한다', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error('Failed to login'));
    const user = userEvent.setup();
    render(<App />);
    await submitLogin(user);
    expect(
      await screen.findByText('로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'),
    ).toBeInTheDocument();
  });

  it('[정상] LoginPage — should 에러가 사라지고 노트 화면으로 전환된다 when 실패 후 올바른 계정으로 재시도한다', async () => {
    vi.mocked(authApi.login).mockRejectedValueOnce(new Error('Invalid credentials'));
    const user = userEvent.setup();
    render(<App />);
    await submitLogin(user);
    expect(
      await screen.findByText('이메일 또는 비밀번호가 올바르지 않습니다.'),
    ).toBeInTheDocument();
    // 재시도: 이번엔 성공
    vi.mocked(authApi.login).mockResolvedValue(seededUser);
    await user.click(screen.getByRole('button', { name: '로그인' }));
    // 노트 화면 전환 + 에러 사라짐
    expect(await screen.findByRole('button', { name: '+ 새 노트' })).toBeInTheDocument();
    expect(screen.queryByText('이메일 또는 비밀번호가 올바르지 않습니다.')).not.toBeInTheDocument();
  });
});
