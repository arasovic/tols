import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols jwt', () => {
  it('enc then dec roundtrip', async () => {
    const enc = await tols(['jwt', 'enc', '{"sub":"42"}', '--secret=k']);
    expect(enc.code).toBe(0);
    const token = enc.out.trim();
    expect(token.split('.')).toHaveLength(3);

    const dec = await tols(['jwt', 'dec', token]);
    expect(dec.code).toBe(0);
    expect(dec.out).toContain('"sub": "42"');
    expect(dec.out).toContain('header:');
  });

  it('dec via stdin', async () => {
    const enc = await tols(['jwt', 'enc', '{"a":1}', '--secret=k']);
    const dec = await tols(['jwt', 'dec'], { stdin: enc.out });
    expect(dec.code).toBe(0);
    expect(dec.out).toContain('"a": 1');
  });

  it('dec --json returns structured parts', async () => {
    const enc = await tols(['jwt', 'enc', '{"a":1}', '--secret=k']);
    const dec = await tols(['jwt', 'dec', enc.out.trim(), '--json']);
    const j = JSON.parse(dec.out);
    expect(j.result.payload).toEqual({ a: 1 });
    expect(j.result.header.alg).toBe('HS256');
  });

  it('enc without --secret -> usage error', async () => {
    const r = await tols(['jwt', 'enc', '{"a":1}']);
    expect(r.code).toBe(2);
    expect(r.err).toContain('--secret');
  });

  it('enc with invalid payload JSON -> exit 1', async () => {
    const r = await tols(['jwt', 'enc', '{bad', '--secret=k']);
    expect(r.code).toBe(1);
    expect(r.err).toContain('Invalid payload JSON');
  });

  it('dec garbage -> exit 1', async () => {
    const r = await tols(['jwt', 'dec', 'garbage']);
    expect(r.code).toBe(1);
    expect(r.err).toContain('expected 3 parts');
  });
});
