import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('[정상] should 입력값을 바꾸면 onChange가 입력 문자열로 호출된다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);
    await user.type(screen.getByRole('searchbox'), '회');
    expect(onChange).toHaveBeenCalledWith('회');
  });

  it('[정상] should value prop이 입력칸에 반영된다', () => {
    render(<SearchBar value="회의" onChange={vi.fn()} />);
    expect(screen.getByRole('searchbox')).toHaveValue('회의');
  });

  it('[정상] should × 버튼을 누르면 onChange가 빈 문자열로 호출된다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchBar value="회의" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: '검색어 지우기' }));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('[경계] should value가 비면 × 버튼을 표시하지 않는다', () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    expect(screen.queryByRole('button', { name: '검색어 지우기' })).not.toBeInTheDocument();
  });
});
