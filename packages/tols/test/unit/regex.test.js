import { describe, it, expect } from 'vitest';
import * as re from '../../src/core/regex.js';

describe('regex core', () => {
  it('validateFlags dedupes and drops invalid (web parity)', () => {
    expect(re.validateFlags('ggix')).toBe('gi');
    expect(re.validateFlags('')).toBe('');
    expect(re.validateFlags('z')).toBe('');
  });

  it('global match finds all', () => {
    const ms = re.match('\\d+', 'g', 'a1 b22 c333');
    expect(ms.map((m) => m.value)).toEqual(['1', '22', '333']);
    expect(ms.map((m) => m.index)).toEqual([1, 4, 8]);
  });

  it('non-global returns first match only (web parity)', () => {
    const ms = re.match('\\d+', '', 'a1 b2');
    expect(ms).toHaveLength(1);
    expect(ms[0].value).toBe('1');
  });

  it('captures groups and named groups', () => {
    const ms = re.match('(?<year>\\d{4})-(\\d{2})', 'g', '2026-08 and 2025-01');
    // named groups also occupy positional slots
    expect(ms[0].groups).toEqual(['2026', '08']);
    expect(ms[0].named.year).toBe('2026');
    expect(ms[1].value).toBe('2025-01');
  });

  it('no matches -> empty list', () => {
    expect(re.match('z+', 'g', 'abc')).toEqual([]);
  });

  it('invalid pattern throws stable message', () => {
    expect(() => re.match('(', 'g', 'x')).toThrow('Invalid regex pattern');
  });

  it('replace works with backreferences', () => {
    expect(re.replace('(\\w+)@(\\w+)', 'g', 'a@b c@d', '$2:$1')).toBe('b:a d:c');
  });

  it('replace without g only replaces first', () => {
    expect(re.replace('a', '', 'aaa', 'b')).toBe('baa');
  });
});
