import { describe, it, expect } from 'vitest';
import * as tz from '../../src/core/timezone.js';

describe('timezone core', () => {
  const fixed = new Date('2026-01-15T12:00:00Z');

  it('converts between zones with correct offset', () => {
    const r = tz.convert(fixed, 'UTC', 'Asia/Tokyo');
    expect(r.offsetHours).toBe(9);
    expect(r.toFormatted).toContain('09:00:00 PM'); // 12:00 UTC = 21:00 Tokyo
  });

  it('negative offsets format with minus', () => {
    const r = tz.convert(fixed, 'Asia/Tokyo', 'UTC');
    expect(r.offset).toBe('-9.0');
  });

  it('respects DST (January: NY is UTC-5)', () => {
    const r = tz.convert(fixed, 'UTC', 'America/New_York');
    expect(r.offsetHours).toBe(-5);
  });

  it('respects DST (July: NY is UTC-4)', () => {
    const summer = new Date('2026-07-15T12:00:00Z');
    const r = tz.convert(summer, 'UTC', 'America/New_York');
    expect(r.offsetHours).toBe(-4);
  });

  it('rejects unknown zones', () => {
    expect(() => tz.convert(fixed, 'UTC', 'Mars/Olympus')).toThrow('unknown time zone: Mars/Olympus');
  });

  it('rejects invalid date', () => {
    expect(() => tz.convert(new Date('nope'), 'UTC', 'UTC')).toThrow('invalid date');
  });

  it('zoneNow returns label/time/date', () => {
    const r = tz.zoneNow('America/New_York', fixed);
    expect(r.name).toBe('New York');
    expect(r.time).toMatch(/\d{2}:\d{2}/);
  });

  it('zoneNow keeps raw name when not in curated list', () => {
    const r = tz.zoneNow('Europe/Istanbul', fixed);
    expect(r.name).toBe('Europe/Istanbul');
  });
});
