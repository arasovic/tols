import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols gzip', () => {
  it('comp via stdin -> base64 on stdout', async () => {
    const r = await tols(['gz', 'comp'], { stdin: 'hello hello hello\n' });
    expect(r.code).toBe(0);
    const r2 = await tols(['gz', 'decomp', r.out.trim()]);
    expect(r2.code).toBe(0);
    expect(r2.out).toBe('hello hello hello\n');
  });

  it('comp --json includes sizes and ratio', async () => {
    const r = await tols(['gzip', 'comp', 'aaaaaaaaaa', '--json']);
    expect(r.code).toBe(0);
    const parsed = JSON.parse(r.out);
    expect(parsed.ok).toBe(true);
    expect(parsed.result.originalBytes).toBe(10);
    expect(parsed.result.compressedBytes).toBeGreaterThan(0);
    expect(typeof parsed.result.base64).toBe('string');
  });

  it('decomp invalid base64 -> exit 1', async () => {
    const r = await tols(['gz', 'decomp', '!!!']);
    expect(r.code).toBe(1);
    expect(r.err).toContain('Invalid Base64');
  });

  it('decomp valid base64 but not gzip -> exit 1', async () => {
    const r = await tols(['gz', 'decomp', 'aGVsbG8=']);
    expect(r.code).toBe(1);
    expect(r.err).toContain('invalid gzip data');
  });
});
