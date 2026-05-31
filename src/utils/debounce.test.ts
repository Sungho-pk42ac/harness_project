import { debounce } from './debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('[정상] debounce — should ms 후 마지막 호출 1회만 실행한다 when 연속 호출된다', () => {
    const fn = vi.fn();
    const d = debounce(fn, 800);
    d('a');
    d('b');
    d('c');
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(800);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('c');
  });

  it('[정상] debounce.flush — should 대기 중 호출을 즉시 실행한다 when flush한다', () => {
    const fn = vi.fn();
    const d = debounce(fn, 800);
    d('x');
    d.flush();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('x');
  });

  it('[경계] debounce.flush — should 아무것도 하지 않는다 when 대기 중인 호출이 없다', () => {
    const fn = vi.fn();
    const d = debounce(fn, 800);
    d.flush();
    expect(fn).not.toHaveBeenCalled();
  });

  it('[정상] debounce.cancel — should 대기 중 호출을 취소한다 when cancel한다', () => {
    const fn = vi.fn();
    const d = debounce(fn, 800);
    d('y');
    d.cancel();
    vi.advanceTimersByTime(800);
    expect(fn).not.toHaveBeenCalled();
  });
});
