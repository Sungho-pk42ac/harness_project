import { createSupabaseClient } from './supabaseClient';

describe('createSupabaseClient', () => {
  it('[정상] should 클라이언트 객체(.from 메서드 보유)를 반환한다 when url·anonKey가 모두 주어진다', () => {
    // Arrange & Act
    const client = createSupabaseClient('https://example.supabase.co', 'anon-key');
    // Assert: Supabase 클라이언트는 .from 메서드를 가진다
    expect(typeof client.from).toBe('function');
  });

  it('[예외] should Error를 throw한다 when url이 빈 문자열이다', () => {
    expect(() => createSupabaseClient('', 'anon-key')).toThrow('환경변수가 설정되지 않았습니다');
  });

  it('[예외] should Error를 throw한다 when anonKey가 빈 문자열이다', () => {
    expect(() => createSupabaseClient('https://example.supabase.co', '')).toThrow(
      '환경변수가 설정되지 않았습니다',
    );
  });
});
