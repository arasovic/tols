import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols cron', () => {
  it('parse describes valid expression', async () => {
    const r = await tols(['cr', 'parse', '*/5 * * * *']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('*/5');
  });

  it('next prints ISO runs', async () => {
    const r = await tols(['cron', 'next', '30 9 * * *', '--count=2']);
    expect(r.code).toBe(0);
    expect(r.out.trim().split('\n')).toHaveLength(2);
    expect(r.out).toMatch(/\d{4}-\d{2}-\d{2}T09:30:00/);
  });

  it('val passes', async () => {
    const r = await tols(['cr', 'val', '0 0 1 1 *']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('valid\n');
  });

  it('invalid -> exit 1 with message', async () => {
    const r = await tols(['cr', 'val', '99 * * * *']);
    expect(r.code).toBe(1);
    expect(r.err).toContain('Value out of range in part 1');
  });
});
