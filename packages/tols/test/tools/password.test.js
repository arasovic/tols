import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols password', () => {
  it('gen defaults: 16 chars, letters+digits', async () => {
    const r = await tols(['pw', 'gen']);
    expect(r.code).toBe(0);
    expect(r.out.trim()).toMatch(/^[A-Za-z0-9]{16}$/);
  });

  it('--length and --symbols', async () => {
    const r = await tols(['password', 'gen', '--length=32', '--symbols']);
    expect(r.code).toBe(0);
    expect(r.out.trim()).toHaveLength(32);
  });

  it('disable charsets with =false', async () => {
    const r = await tols(['pw', 'gen', '--upper=false', '--numbers=false']);
    expect(r.code).toBe(0);
    expect(r.out.trim()).toMatch(/^[a-z]{16}$/);
  });

  it('all charsets off -> exit 1 with web message', async () => {
    const r = await tols(['pw', 'gen', '--upper=false', '--lower=false', '--numbers=false', '--symbols=false']);
    expect(r.code).toBe(1);
    expect(r.err).toContain('Please select at least one character type');
  });

  it('--length out of range -> exit 2 (usage)', async () => {
    const r = await tols(['pw', 'gen', '--length=4']);
    expect(r.code).toBe(2);
    expect(r.err).toContain('--length');
  });

  it('--json includes entropy', async () => {
    const r = await tols(['pw', 'gen', '--json']);
    expect(r.code).toBe(0);
    const p = JSON.parse(r.out);
    expect(p.ok).toBe(true);
    expect(p.result.entropyLabel).toBe('Strong');
    expect(p.result.charsetSize).toBe(62);
  });
});
