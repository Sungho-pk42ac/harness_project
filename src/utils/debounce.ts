export interface Debounced<A extends unknown[]> {
  (...args: A): void;
  /** 대기 중 호출이 있으면 즉시 실행한다(없으면 아무것도 안 함). */
  flush: () => void;
  /** 대기 중 호출을 취소한다. */
  cancel: () => void;
}

/**
 * fn 호출을 ms만큼 지연·합쳐, 마지막 1회만 실행하는 디바운스를 만든다 (auto-save spec-fixed §2).
 * flush로 대기 호출을 즉시 실행(노트 전환/언마운트 시 손실 방지), cancel로 취소할 수 있다.
 * @param fn 지연 실행할 함수
 * @param ms 지연 시간(밀리초)
 */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number): Debounced<A> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: A | null = null;

  const run = () => {
    timer = null;
    if (pendingArgs) {
      const args = pendingArgs;
      pendingArgs = null;
      fn(...args);
    }
  };

  const debounced = ((...args: A) => {
    pendingArgs = args;
    if (timer) clearTimeout(timer);
    timer = setTimeout(run, ms);
  }) as Debounced<A>;

  debounced.flush = () => {
    if (timer) {
      clearTimeout(timer);
      run();
    }
  };

  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    pendingArgs = null;
  };

  return debounced;
}
