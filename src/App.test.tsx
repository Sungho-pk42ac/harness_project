import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import * as authApi from './api/auth';
import * as notesApi from './api/notes';
import type { User } from './types/user';

// 네트워크 경계(api 모듈)를 모킹해 인증 게이트 동작만 검증한다.
// 세션의 단일 출처는 supabase(api/auth)다 — localStorage가 아니라 getSessionUser/onAuthChange를 제어한다.
vi.mock('./api/auth');
vi.mock('./api/notes');

const seededUser: User = { id: 'u1', email: 'test@test.com' };

/** 공통 기본 모킹: 로그아웃 상태(세션 없음) + 노트 빈 목록 + onAuthChange no-op. */
function resetAuthMocks(sessionUser: User | null = null) {
  vi.mocked(notesApi.fetchNotes).mockResolvedValue([]);
  vi.mocked(authApi.getSessionUser).mockResolvedValue(sessionUser);
  vi.mocked(authApi.onAuthChange).mockReturnValue(() => {});
  vi.mocked(authApi.logout).mockResolvedValue();
}

describe('App (인증 게이트)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAuthMocks(null);
  });

  it('[경계] App — should 로그인 화면(이메일·비밀번호·로그인 버튼)을 보여준다 when 미로그인 상태로 앱을 연다', async () => {
    render(<App />);
    expect(await screen.findByPlaceholderText('이메일')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('비밀번호')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ 새 노트' })).not.toBeInTheDocument();
  });

  it('[정상] App — should 노트 화면(+ 새 노트)으로 전환된다 when 올바른 계정으로 로그인한다', async () => {
    vi.mocked(authApi.login).mockResolvedValue(seededUser);
    const user = userEvent.setup();
    render(<App />);
    await user.type(await screen.findByPlaceholderText('이메일'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('비밀번호'), '1234');
    await user.click(screen.getByRole('button', { name: '로그인' }));
    expect(await screen.findByRole('button', { name: '+ 새 노트' })).toBeInTheDocument();
  });

  it('[예외] App — should 로그인 화면에 머문다 when 잘못된 계정으로 로그인을 시도한다', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid credentials'));
    const user = userEvent.setup();
    render(<App />);
    await user.type(await screen.findByPlaceholderText('이메일'), 'no@no.com');
    await user.type(screen.getByPlaceholderText('비밀번호'), 'wrong');
    await user.click(screen.getByRole('button', { name: '로그인' }));
    expect(await screen.findByPlaceholderText('이메일')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ 새 노트' })).not.toBeInTheDocument();
  });
});

describe('App (세션 유지)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('[정상] App — should 다시 로그인하지 않아도 노트 화면이 보인다 when Supabase 세션이 복원된다', async () => {
    resetAuthMocks(seededUser); // getSessionUser가 기존 세션을 반환
    render(<App />);
    expect(await screen.findByRole('button', { name: '+ 새 노트' })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('이메일')).not.toBeInTheDocument();
  });

  it('[정상] App — should login에 입력한 이메일·비밀번호를 그대로 전달한다 when 로그인한다', async () => {
    resetAuthMocks(null);
    vi.mocked(authApi.login).mockResolvedValue(seededUser);
    const user = userEvent.setup();
    render(<App />);
    await user.type(await screen.findByPlaceholderText('이메일'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('비밀번호'), '1234');
    await user.click(screen.getByRole('button', { name: '로그인' }));
    await screen.findByRole('button', { name: '+ 새 노트' });
    expect(authApi.login).toHaveBeenCalledWith('test@test.com', '1234');
  });

  it('[경계] App — should 로그인 화면이 깜빡이지 않는다 when 저장된 세션을 복원하며 시작한다', async () => {
    resetAuthMocks(seededUser);
    render(<App />);
    await screen.findByRole('button', { name: '+ 새 노트' });
    expect(screen.queryByPlaceholderText('이메일')).not.toBeInTheDocument();
  });
});

describe('App (로그아웃·사용자 표시)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAuthMocks(seededUser); // 로그인된 상태로 시작
  });

  it('[정상] App — should 로그인 화면으로 돌아간다 when 헤더의 로그아웃 버튼을 누른다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('button', { name: '+ 새 노트' });
    await user.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(await screen.findByPlaceholderText('이메일')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ 새 노트' })).not.toBeInTheDocument();
  });

  it('[정상] App — should Supabase signOut(api.logout)을 호출한다 when 로그아웃한다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('button', { name: '+ 새 노트' });
    await user.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(authApi.logout).toHaveBeenCalled();
  });

  it('[정상] Layout — should 헤더에 현재 사용자 이메일이 표시된다 when test@test.com으로 로그인돼 있다', async () => {
    render(<App />);
    await screen.findByRole('button', { name: '+ 새 노트' });
    expect(screen.getByText('test@test.com')).toBeInTheDocument();
  });
});

describe('App (로그인 실패 에러)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAuthMocks(null);
  });

  const submitLogin = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(await screen.findByPlaceholderText('이메일'), 'x@x.com');
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

  it('[예외] LoginPage — should 사용자 친화적 에러 메시지를 보여준다 when 비-자격증명 오류로 실패한다', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error('Failed to logout'));
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
    vi.mocked(authApi.login).mockResolvedValue(seededUser);
    await user.click(screen.getByRole('button', { name: '로그인' }));
    expect(await screen.findByRole('button', { name: '+ 새 노트' })).toBeInTheDocument();
    expect(screen.queryByText('이메일 또는 비밀번호가 올바르지 않습니다.')).not.toBeInTheDocument();
  });
});
