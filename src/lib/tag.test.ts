import { normalizeTag, canAddTag, MAX_TAGS } from './tag';

describe('normalizeTag', () => {
  it('[정상] normalizeTag — should 앞뒤 공백을 제거하고 영문을 소문자화한다 when "  Work  "를 정규화한다', () => {
    expect(normalizeTag('  Work  ')).toBe('work');
  });

  it('[경계] normalizeTag — should 빈 문자열을 반환한다 when 공백만 있는 문자열을 정규화한다', () => {
    expect(normalizeTag('   ')).toBe('');
  });

  it('[경계] normalizeTag — should 한글은 그대로 둔다 when "  회의 "를 정규화한다', () => {
    expect(normalizeTag('  회의 ')).toBe('회의');
  });
});

describe('canAddTag', () => {
  it('[정상] canAddTag — should { ok: true, value: 정규화값 }을 반환한다 when 새롭고 비어있지 않은 태그다', () => {
    expect(canAddTag(['alpha'], '  Work  ')).toEqual({ ok: true, value: 'work' });
  });

  it("[예외] canAddTag — should { ok: false, reason: 'empty' }를 반환한다 when 정규화 결과가 빈 문자열이다", () => {
    expect(canAddTag([], '   ')).toEqual({ ok: false, reason: 'empty' });
  });

  it("[예외] canAddTag — should { ok: false, reason: 'duplicate' }를 반환한다 when 정규화값이 기존 목록에 이미 있다(대소문자 무시)", () => {
    expect(canAddTag(['work'], 'Work')).toEqual({ ok: false, reason: 'duplicate' });
  });

  it("[예외] canAddTag — should { ok: false, reason: 'max' }를 반환한다 when 기존 태그가 이미 5개다", () => {
    const five = ['a', 'b', 'c', 'd', 'e'];
    expect(five).toHaveLength(MAX_TAGS);
    expect(canAddTag(five, 'f')).toEqual({ ok: false, reason: 'max' });
  });
});
