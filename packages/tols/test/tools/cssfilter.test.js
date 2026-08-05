import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols cssfilter', () => {
  it('no flags -> none', async () => {
    const r = await tols(['cssfilter', 'gen']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('none\n');
  });

  it('builds filter string', async () => {
    const r = await tols(['cssfilter', 'gen', '--blur=3', '--brightness=150', '--hue-rotate=180']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('blur(3px) brightness(150%) hue-rotate(180deg)\n');
  });

  it('clamps out-of-range values', async () => {
    const r = await tols(['cssfilter', 'gen', '--blur=999']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('blur(20px)\n');
  });

  it('non-numeric flag value -> exit 1', async () => {
    const r = await tols(['cssfilter', 'gen', '--blur=abc']);
    expect(r.code).toBe(1);
    expect(r.err).toContain('invalid value for --blur');
  });

  it('--json envelope', async () => {
    const r = await tols(['cssfilter', 'gen', '--sepia=50', '--json']);
    expect(r.code).toBe(0);
    const p = JSON.parse(r.out);
    expect(p.result.filter).toBe('sepia(50%)');
    expect(p.result.values.sepia).toBe(50);
  });
});
