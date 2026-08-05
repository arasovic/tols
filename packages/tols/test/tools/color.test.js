import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols color', () => {
  it('conv from hex prints all formats', async () => {
    const r = await tols(['clr', 'conv', '#ff6b35']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('hex: #ff6b35\nrgb: rgb(255, 107, 53)\nhsl: hsl(16, 100%, 60%)\n');
  });

  it('conv from rgb via stdin', async () => {
    const r = await tols(['color', 'conv'], { stdin: 'rgb(0, 128, 255)\n' });
    expect(r.code).toBe(0);
    expect(r.out).toContain('hex: #0080ff');
  });

  it('defaults to conv', async () => {
    const r = await tols(['color', 'hsl(120, 50%, 50%)']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('hex: #40bf40');
  });

  it('invalid -> exit 1', async () => {
    const r = await tols(['clr', 'conv', 'nope']);
    expect(r.code).toBe(1);
    expect(r.err).toContain('Invalid color format');
  });

  it('--json envelope', async () => {
    const r = await tols(['clr', 'conv', '#000', '--json']);
    expect(r.code).toBe(0);
    const p = JSON.parse(r.out);
    expect(p.ok).toBe(true);
    expect(p.result.rgb).toEqual({ r: 0, g: 0, b: 0 });
  });
});
