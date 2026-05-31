import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatPanel } from './ChatPanel';

const noop = () => {};

describe('ChatPanel', () => {
  it('should 아무것도 렌더하지 않는다 when open=false', () => {
    const { container } = render(<ChatPanel open={false} onClose={noop} onSend={async () => ''} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should 사용자 메시지를 표시하고 어시스턴트 응답이 이어진다 when 전송한다', async () => {
    const onSend = vi.fn(async () => '반가워요');
    render(<ChatPanel open onClose={noop} onSend={onSend} />);

    fireEvent.change(screen.getByLabelText('메시지 입력'), { target: { value: '안녕' } });
    fireEvent.click(screen.getByRole('button', { name: '전송' }));

    expect(screen.getByText('안녕')).toBeInTheDocument();
    expect(onSend).toHaveBeenCalledWith('안녕');
    expect(await screen.findByText('반가워요')).toBeInTheDocument();
  });

  it('should 메시지를 추가하지 않는다 when 빈 입력으로 전송한다', () => {
    const onSend = vi.fn(async () => 'x');
    render(<ChatPanel open onClose={noop} onSend={onSend} />);
    fireEvent.click(screen.getByRole('button', { name: '전송' }));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('should 타이핑 인디케이터를 보이고 중복 전송을 막는다 when 응답 대기 중이다', async () => {
    let resolve: (v: string) => void = () => {};
    const onSend = vi.fn(
      () =>
        new Promise<string>((r) => {
          resolve = r;
        }),
    );
    render(<ChatPanel open onClose={noop} onSend={onSend} />);

    fireEvent.change(screen.getByLabelText('메시지 입력'), { target: { value: '안녕' } });
    fireEvent.click(screen.getByRole('button', { name: '전송' }));

    expect(await screen.findByTestId('typing-indicator')).toBeInTheDocument();

    // 대기 중 재전송 시도 — onSend는 1회만 호출되어야 한다
    fireEvent.click(screen.getByRole('button', { name: '전송' }));
    expect(onSend).toHaveBeenCalledTimes(1);

    resolve('done');
    expect(await screen.findByText('done')).toBeInTheDocument();
  });

  it('should onClose를 호출한다 when 닫기 버튼을 누른다', () => {
    const onClose = vi.fn();
    render(<ChatPanel open onClose={onClose} onSend={async () => ''} />);
    fireEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('should 삭제 확인 카드를 띄우고 버튼이 콜백을 호출한다 when pendingConfirm', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { rerender } = render(
      <ChatPanel open onClose={noop} onSend={async () => ''} pendingConfirm={null} />,
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    rerender(
      <ChatPanel
        open
        onClose={noop}
        onSend={async () => ''}
        pendingConfirm={{ title: '회의록', onConfirm, onCancel }}
      />,
    );
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('회의록')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
