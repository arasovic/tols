import { describe, it, expect } from 'vitest';
import * as lorem from '../../src/core/lorem.js';

describe('lorem core', () => {
  it('generates requested paragraphs separated by blank lines', () => {
    const out = lorem.generate({ paragraphs: 3, words: 10 });
    expect(out.split('\n\n')).toHaveLength(3);
  });

  it('each paragraph has exact word count, capitalized start, trailing period', () => {
    const out = lorem.generate({ paragraphs: 1, words: 20, startWithLorem: false });
    expect(out.endsWith('.')).toBe(true);
    expect(out[0]).toBe(out[0].toUpperCase());
    expect(out.slice(0, -1).split(' ')).toHaveLength(20);
  });

  it('prefixes classic opener on first paragraph by default', () => {
    const out = lorem.generate({ paragraphs: 2, words: 5 });
    expect(out.startsWith(lorem.CLASSIC_OPENER)).toBe(true);
    const [, second] = out.split('\n\n');
    expect(second.startsWith(lorem.CLASSIC_OPENER)).toBe(false);
  });

  it('random-start drops the opener', () => {
    const out = lorem.generate({ paragraphs: 1, words: 5, startWithLorem: false });
    expect(out.startsWith(lorem.CLASSIC_OPENER)).toBe(false);
  });

  it('clamps paragraphs and words to web limits', () => {
    const clamped = lorem.generate({ paragraphs: 999, words: 5, startWithLorem: false });
    expect(clamped.split('\n\n')).toHaveLength(50);
    const out = lorem.generate({ paragraphs: 1, words: 9999, startWithLorem: false });
    expect(out.slice(0, -1).split(' ')).toHaveLength(500);
  });

  it('words=0 gives 10..29 words per paragraph (web parity)', () => {
    for (let i = 0; i < 20; i++) {
      const out = lorem.generate({ paragraphs: 1, words: 0, startWithLorem: false });
      const n = out.slice(0, -1).split(' ').length;
      expect(n).toBeGreaterThanOrEqual(10);
      expect(n).toBeLessThanOrEqual(29);
    }
  });

  it('zero paragraphs -> empty string', () => {
    expect(lorem.generate({ paragraphs: 0 })).toBe('');
  });

  it('uses only words from the list', () => {
    const out = lorem.generate({ paragraphs: 1, words: 100, startWithLorem: false });
    for (const w of out.slice(0, -1).toLowerCase().split(' ')) {
      expect(lorem.WORDS).toContain(w);
    }
  });
});
