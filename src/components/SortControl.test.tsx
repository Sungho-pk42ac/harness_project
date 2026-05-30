import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SortControl } from './SortControl';

describe('SortControl', () => {
  it('[정상] should 드롭다운에서 기준을 바꾸면 onSortByChange가 선택값으로 호출된다', async () => {
    const user = userEvent.setup();
    const onSortByChange = vi.fn();
    render(
      <SortControl
        sortBy="updatedAt"
        sortDir="desc"
        onSortByChange={onSortByChange}
        onSortDirChange={vi.fn()}
      />,
    );
    await user.selectOptions(screen.getByRole('combobox', { name: '정렬 기준' }), 'title');
    expect(onSortByChange).toHaveBeenCalledWith('title');
  });

  it('[정상] should 방향 토글을 누르면 onSortDirChange가 반대 방향으로 호출된다', async () => {
    const user = userEvent.setup();
    const onSortDirChange = vi.fn();
    render(
      <SortControl
        sortBy="updatedAt"
        sortDir="desc"
        onSortByChange={vi.fn()}
        onSortDirChange={onSortDirChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: /정렬 방향/ }));
    expect(onSortDirChange).toHaveBeenCalledWith('asc');
  });

  it('[정상] should sortBy prop이 드롭다운 선택값에 반영된다', () => {
    render(
      <SortControl
        sortBy="createdAt"
        sortDir="asc"
        onSortByChange={vi.fn()}
        onSortDirChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('combobox', { name: '정렬 기준' })).toHaveValue('createdAt');
  });
});
