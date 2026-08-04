import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols url', () => {
  it('encodes positional input', async () => {
    const r = await tols(['url', 'enc', 'a b']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('a%20b\n');
  });

  it('decodes piped input', async () => {
    const r = await tols(['url', 'dec'], { stdin: 'a%20b\n' });
    expect(r.code).toBe(0);
    expect(r.out).toBe('a b\n');
  });

  it('malformed decode -> exit 1', async () => {
    const r = await tols(['url', 'dec', '%E0%A4%A']);
    expect(r.code).toBe(1);
    expect(r.err).toContain('Invalid input for URL decoding');
  });

  it('analyze prints structured text', async () => {
    const r = await tols(['url', 'analyze', 'https://example.com/p?x=1']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('host: example.com');
    expect(r.out).toContain('x = 1');
  });

  it('analyze --json returns object', async () => {
    const r = await tols(['url', 'analyze', 'https://example.com/p?x=1', '--json']);
    expect(r.code).toBe(0);
    const j = JSON.parse(r.out);
    expect(j.ok).toBe(true);
    expect(j.result.params).toEqual([{ key: 'x', value: '1' }]);
  });

  it('analyze invalid URL -> exit 1', async () => {
    const r = await tols(['url', 'analyze', 'nope']);
    expect(r.code).toBe(1);
    expect(r.err).toContain('Invalid URL format');
  });
});
