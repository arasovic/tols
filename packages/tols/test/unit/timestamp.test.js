import { describe, it, expect } from 'vitest';
import { toHuman, toUnix, now } from '../../src/core/timestamp.js';

describe('timestamp core', () => {
  it('converts unix seconds to human forms (UTC)', () => {
    const r = toHuman('1700000000', 'UTC');
    expect(r.iso).toBe('2023-11-14T22:13:20.000Z');
    expect(r.utc).toContain('2023');
    expect(r.relative).toContain('Tuesday');
  });

  it('autodetects milliseconds', () => {
    const r = toHuman('1700000000000', 'UTC');
    expect(r.iso).toBe('2023-11-14T22:13:20.000Z');
  });

  it('accepts ISO input in toHuman', () => {
    const r = toHuman('2023-11-14T22:13:20Z', 'UTC');
    expect(r.iso).toBe('2023-11-14T22:13:20.000Z');
  });

  it('throws on garbage', () => {
    expect(() => toHuman('not-a-date')).toThrow('Invalid timestamp format');
  });

  it('handles negative and 2038+ timestamps', () => {
    expect(toHuman('-86400', 'UTC').iso).toBe('1969-12-31T00:00:00.000Z');
    expect(toHuman('2147483648', 'UTC').iso).toBe('2038-01-19T03:14:08.000Z');
  });

  it('toUnix converts date strings', () => {
    const r = toUnix('2023-11-14T22:13:20Z');
    expect(r.unix).toBe(1700000000);
    expect(r.unixMs).toBe(1700000000000);
    expect(r.iso).toBe('2023-11-14T22:13:20.000Z');
  });

  it('toUnix throws on invalid date', () => {
    expect(() => toUnix('garbage')).toThrow('Invalid date format');
  });

  it('now returns consistent triple', () => {
    const r = now();
    expect(r.unix).toBe(Math.floor(r.unixMs / 1000));
    expect(new Date(r.unixMs).toISOString()).toBe(r.iso);
  });
});
