import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols placeholder', () => {
  it('gen default emits 400x300 SVG', async () => {
    const r = await tols(['ph', 'gen']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"');
  });

  it('honors --width/--height/--text', async () => {
    const r = await tols(['placeholder', 'gen', '--width=800', '--height=200', '--text=hello']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('width="800"');
    expect(r.out).toContain('>hello<');
  });

  it('accepts colors without #', async () => {
    const r = await tols(['ph', 'gen', '--bg=ff0000', '--text-color=00ff00']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('fill="#ff0000"');
  });

  it('invalid color -> exit 2', async () => {
    const r = await tols(['ph', 'gen', '--bg=zzz']);
    expect(r.code).toBe(2);
    expect(r.err).toContain('invalid --bg');
  });

  it('--json reports contrast', async () => {
    const r = await tols(['ph', 'gen', '--json']);
    expect(r.code).toBe(0);
    const p = JSON.parse(r.out);
    expect(p.ok).toBe(true);
    expect(p.result.contrastRatio).toBeGreaterThan(4.5);
    expect(p.result.svg).toContain('<svg');
  });
});
