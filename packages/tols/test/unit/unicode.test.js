import { describe, it, expect } from 'vitest';
import * as uni from '../../src/core/unicode.js';

describe('unicode core', () => {
  it('analyzes a BMP char with web-parity fields', () => {
    expect(uni.analyzeChar('é')).toMatchObject({
      char: 'é',
      codepoint: 'U+00E9',
      decimal: 233,
      hex: '0xE9',
      html: '&#233;',
      css: '\\E9',
      js: '\\u00E9',
    });
  });

  it('is surrogate-pair aware and uses \\u{...} for astral chars', () => {
    const a = uni.analyzeChar('😀');
    expect(a.codepoint).toBe('U+1F600');
    expect(a.js).toBe('\\u{1F600}');
    expect(a.decimal).toBe(128512);
  });

  it('takes only the first codepoint', () => {
    expect(uni.analyzeChar('ab').char).toBe('a');
  });

  it('returns null for empty input', () => {
    expect(uni.analyzeChar('')).toBeNull();
  });

  it('pads codepoint to 4 hex digits', () => {
    expect(uni.analyzeChar('\n').codepoint).toBe('U+000A');
  });

  it('searchCommon filters by name and category, case-insensitive', () => {
    expect(uni.searchCommon('arrow')).toHaveLength(4);
    expect(uni.searchCommon('MATH').length).toBeGreaterThan(3);
    expect(uni.searchCommon('zzz-nope')).toHaveLength(0);
    expect(uni.searchCommon('')).toHaveLength(0);
  });

  it('common table entries are well-formed', () => {
    for (const c of uni.COMMON_CHARS) {
      expect(c.codepoint).toMatch(/^U\+[0-9A-F]{4,}$/);
      expect(c.char.length).toBeGreaterThan(0);
    }
  });
});
