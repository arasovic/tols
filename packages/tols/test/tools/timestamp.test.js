import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols timestamp', () => {
  it('conv converts seconds to human', async () => {
    const r = await tols(['ts', 'conv', '1700000000']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('iso: 2023-11-14T22:13:20.000Z');
  });

  it('conv converts date string to unix', async () => {
    const r = await tols(['ts', 'conv', '2023-11-14T22:13:20Z']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('unix: 1700000000');
  });

  it('respects --tz', async () => {
    const r = await tols(['ts', 'conv', '1700000000', '--tz=America/New_York']);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/formatted: 11\/14\/2023, 17:13:20/);
  });

  it('now works without input', async () => {
    const r = await tols(['ts', 'now']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('unix:');
    expect(r.out).toContain('iso:');
  });

  it('now --json returns envelope', async () => {
    const r = await tols(['ts', 'now', '--json']);
    const j = JSON.parse(r.out);
    expect(j.ok).toBe(true);
    expect(typeof j.result.unix).toBe('number');
  });

  it('parse invalid -> exit 1', async () => {
    const r = await tols(['ts', 'parse', 'garbage']);
    expect(r.code).toBe(1);
    expect(r.err).toContain('Invalid date format');
  });
});
