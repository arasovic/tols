import { describe, it, expect } from 'vitest';
import { validateCron, getDescription, getNextRuns } from '../../src/core/cron.js';

describe('cron core', () => {
  it('accepts valid expressions', () => {
    expect(validateCron('*/5 * * * *')).toBe(null);
    expect(validateCron('0 12 * * 1')).toBe(null);
    expect(validateCron('0 0 1 1 ?')).toBe(null);
  });

  it('rejects invalid expressions', () => {
    expect(validateCron('99 * * * *')).toBe('Value out of range in part 1');
    expect(validateCron('* * * *')).toBe('Cron expression must have exactly 5 parts');
    expect(validateCron('')).toMatch(/enter/i);
    expect(validateCron('*/x * * * *')).toMatch(/step/i);
  });

  it('describes expressions', () => {
    expect(getDescription('*/5 * * * *')).toContain('*/5');
  });

  it('computes deterministic next runs from fixed clock', () => {
    // weekly: single run (cap of 10000 minute-steps cannot reach 2 weeks)
    const weekly = getNextRuns('0 12 * * 1', 1, new Date('2026-08-04T00:00:00Z'));
    expect(weekly.map((d) => d.toISOString())).toEqual(['2026-08-10T12:00:00.000Z']);
    // daily: two consecutive runs
    const daily = getNextRuns('30 9 * * *', 2, new Date('2026-08-04T00:00:00Z'));
    expect(daily.map((d) => d.toISOString())).toEqual([
      '2026-08-04T09:30:00.000Z',
      '2026-08-05T09:30:00.000Z',
    ]);
  });
});
