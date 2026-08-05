import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols base', () => {
  it('conv default prints all bases', async () => {
    const r = await tols(['base', 'conv', '255']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('dec: 255\nbin: 11111111\nhex: FF\noct: 377\n');
  });

  it('defaults to conv with prefix auto-detect', async () => {
    const r = await tols(['base', '0xff']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('dec: 255');
  });

  it('--to=bin prints single value', async () => {
    const r = await tols(['base', 'conv', '255', '--to=bin']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('11111111\n');
  });

  it('--from overrides detection', async () => {
    const r = await tols(['base', 'conv', '10', '--from=bin', '--to=dec']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('2\n');
  });

  it('stdin input works', async () => {
    const r = await tols(['base', 'conv'], { stdin: '0b1010\n' });
    expect(r.code).toBe(0);
    expect(r.out).toContain('dec: 10');
  });

  it('invalid input -> exit 1', async () => {
    const r = await tols(['base', 'conv', 'nope']);
    expect(r.code).toBe(1);
    expect(r.err).toContain('Invalid decimal number');
  });

  it('--json envelope carries all bases', async () => {
    const r = await tols(['base', 'conv', '255', '--json']);
    expect(r.code).toBe(0);
    const p = JSON.parse(r.out);
    expect(p.ok).toBe(true);
    expect(p.result).toMatchObject({ dec: '255', bin: '11111111', hex: 'FF', oct: '377', from: 'dec' });
  });

  it('unknown --to -> exit 1', async () => {
    const r = await tols(['base', 'conv', '255', '--to=roman']);
    expect(r.code).toBe(1);
    expect(r.err).toContain('unknown --to');
  });
});

  it('explicit --from tolerates prefixes', async () => {
    const r = await tols(['base', 'conv', '0xff', '--from=hex']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('dec: 255');
  });
