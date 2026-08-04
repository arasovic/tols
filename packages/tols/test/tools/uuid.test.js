import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols uuid', () => {
  it('generates one uuid by default', async () => {
    const r = await tols(['uuid', 'gen']);
    expect(r.code).toBe(0);
    expect(r.out.trim()).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('alias id works', async () => {
    const r = await tols(['id']);
    expect(r.code).toBe(0);
    expect(r.out.trim()).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('--count produces N lines', async () => {
    const r = await tols(['id', '--count=5']);
    expect(r.code).toBe(0);
    expect(r.out.trim().split('\n')).toHaveLength(5);
  });

  it('count out of range -> exit 2', async () => {
    const r = await tols(['id', '--count=200']);
    expect(r.code).toBe(2);
    expect(r.err).toContain('between 1 and 100');
  });

  it('--json returns array', async () => {
    const r = await tols(['id', '--count=2', '--json']);
    const j = JSON.parse(r.out);
    expect(j.result).toHaveLength(2);
  });
});
