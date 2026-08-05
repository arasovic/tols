import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols lorem', () => {
  it('gen defaults: 3 paragraphs with opener', async () => {
    const r = await tols(['lorem', 'gen']);
    expect(r.code).toBe(0);
    expect(r.out.startsWith('Lorem ipsum dolor sit amet')).toBe(true);
    expect(r.out.split('\n\n')).toHaveLength(3);
  });

  it('--paragraphs and --words', async () => {
    const r = await tols(['lorem', 'gen', '--paragraphs=1', '--words=7', '--random-start']);
    expect(r.code).toBe(0);
    expect(r.out.trim().slice(0, -1).split(' ')).toHaveLength(7);
  });

  it('--paragraphs=0 -> exit 2', async () => {
    const r = await tols(['lorem', 'gen', '--paragraphs=0']);
    expect(r.code).toBe(2);
    expect(r.err).toContain('--paragraphs');
  });

  it('--json envelope', async () => {
    const r = await tols(['lorem', 'gen', '--paragraphs=1', '--words=5', '--json']);
    expect(r.code).toBe(0);
    const p = JSON.parse(r.out);
    expect(p.ok).toBe(true);
    expect(p.result.paragraphs).toBe(1);
    expect(p.result.text.length).toBeGreaterThan(0);
  });
});
