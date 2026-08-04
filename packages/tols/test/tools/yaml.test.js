import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols yaml', () => {
  it('converts YAML to JSON', async () => {
    const r = await tols(['yml', 'json'], { stdin: 'a: 1\nb:\n  - x\n  - y\n' });
    expect(r.code).toBe(0);
    expect(JSON.parse(r.out)).toEqual({ a: 1, b: ['x', 'y'] });
  });

  it('fmt normalizes YAML', async () => {
    const r = await tols(['yaml', 'fmt'], { stdin: 'a:    1\nb: {c: true}\n' });
    expect(r.code).toBe(0);
    expect(r.out).toBe('a: 1\nb:\n  c: true\n');
  });

  it('defaults to fmt', async () => {
    const r = await tols(['yml', 'a: 1'], {});
    // positional arg joined without newline; single-line YAML still parses
    expect(r.code).toBe(0);
    expect(r.out).toBe('a: 1\n');
  });
});
