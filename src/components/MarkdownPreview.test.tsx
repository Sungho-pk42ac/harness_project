import { render, screen } from '@testing-library/react';
import { MarkdownPreview } from './MarkdownPreview';

// 마크다운 렌더 컴포넌트 테스트 (markdown-preview spec-fixed §4·§8)
describe('MarkdownPreview', () => {
  it('[정상] should # 제목을 h1로 렌더한다', () => {
    render(<MarkdownPreview content="# 큰제목" />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('큰제목');
  });

  it('[정상] should 비순서 리스트를 ul>li로 렌더한다', () => {
    render(<MarkdownPreview content={'- 사과\n- 바나나'} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('[정상] should 순서 리스트를 ol>li로 렌더한다', () => {
    const { container } = render(<MarkdownPreview content={'1. 첫째\n2. 둘째'} />);
    expect(container.querySelector('ol')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('[정상] should **굵게**를 strong으로, *기울임*을 em으로 렌더한다', () => {
    const { container } = render(<MarkdownPreview content="**굵게** *기울임*" />);
    expect(container.querySelector('strong')).toHaveTextContent('굵게');
    expect(container.querySelector('em')).toHaveTextContent('기울임');
  });

  it('[정상] should 인라인 코드와 코드블록을 code로 렌더한다', () => {
    const { container } = render(<MarkdownPreview content={'`inline`\n\n```\nblock\n```'} />);
    const codes = container.querySelectorAll('code');
    expect(codes.length).toBeGreaterThanOrEqual(2);
  });

  it('[보안] should raw HTML을 실행/렌더하지 않고 텍스트로 취급한다 (XSS 차단)', () => {
    const { container } = render(
      <MarkdownPreview content={'<img src=x onerror="alert(1)"> <b>bold</b>'} />,
    );
    // raw HTML 태그가 실제 DOM 요소로 생성되지 않아야 한다
    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('b')).not.toBeInTheDocument();
  });
});
