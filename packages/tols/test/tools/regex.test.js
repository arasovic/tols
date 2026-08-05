import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols regex', () => {
  it('match prints one match per line', async () => {
    const r = await tols(['re', 'match', 'a1 b22', '--pattern=\\d+']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('1\n22\n');
  });

  it('match via stdin', async () => {
    const r = await tols(['regex', 'match', '--pattern=^\\w+'], { stdin: 'hello world\n' });
    expect(r.code).toBe(0);
    expect(r.out).toBe('hello\n');
  });

  it('missing --pattern -> exit 2', async () => {
    const r = await tols(['re', 'match', 'abc']);
    expect(r.code).toBe(2);
    expect(r.err).toContain('--pattern is required');
  });

  it('invalid pattern -> exit 1', async () => {
    const r = await tols(['re', 'match', 'abc', '--pattern=(']);
    expect(r.code).toBe(1);
    expect(r.err).toContain('Invalid regex pattern');
  });

  it('--json includes indexes and groups', async () => {
    const r = await tols(['re', 'match', 'x42', '--pattern=(\\d+)', '--json']);
    expect(r.code).toBe(0);
    const p = JSON.parse(r.out);
    expect(p.result[0]).toMatchObject({ value: '42', index: 1, groups: ['42'] });
  });

  it('replace with backrefs', async () => {
    const r = await tols(['re', 'replace', 'john smith', '--pattern=(\\w+) (\\w+)', '--replacement=$2 $1']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('smith john\n');
  });

  it('replace defaults to empty replacement', async () => {
    const r = await tols(['re', 'replace', 'a1b2', '--pattern=\\d']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('ab\n');
  });

  it('case-insensitive flag', async () => {
    const r = await tols(['re', 'match', 'ABC', '--pattern=abc', '--flags=i']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('ABC\n');
  });
});
