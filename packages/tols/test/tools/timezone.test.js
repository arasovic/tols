import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols timezone', () => {
  it('conv with positional date', async () => {
    const r = await tols(['tz', 'conv', '2026-01-15T12:00:00Z', '--from=UTC', '--to=Asia/Tokyo']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('offset: +9.0h');
    expect(r.out).toContain('09:00:00 PM');
  });

  it('missing --from/--to -> exit 2', async () => {
    const r = await tols(['tz', 'conv', '2026-01-15T12:00:00Z', '--from=UTC']);
    expect(r.code).toBe(2);
    expect(r.err).toContain('--from and --to');
  });

  it('invalid date -> exit 2', async () => {
    const r = await tols(['tz', 'conv', 'not-a-date', '--from=UTC', '--to=UTC']);
    expect(r.code).toBe(2);
    expect(r.err).toContain('invalid date');
  });

  it('unknown zone -> exit 1', async () => {
    const r = await tols(['tz', 'conv', '--from=UTC', '--to=Nope/Nope']);
    expect(r.code).toBe(1);
    expect(r.err).toContain('unknown time zone');
  });

  it('defaults to now with no input', async () => {
    const r = await tols(['tz', 'conv', '--from=UTC', '--to=UTC']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('offset: +0.0h');
  });

  it('zones lists curated zones', async () => {
    const r = await tols(['tz', 'zones']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('New York');
    expect(r.out).toContain('Tokyo');
    expect(r.out.trim().split('\n')).toHaveLength(13);
  });

  it('conv --json carries structured result', async () => {
    const r = await tols(['tz', 'conv', '2026-01-15T12:00:00Z', '--from=UTC', '--to=Asia/Tokyo', '--json']);
    expect(r.code).toBe(0);
    const p = JSON.parse(r.out);
    expect(p.result.offsetHours).toBe(9);
  });
});

  it('zone-less input is interpreted as wall time in the --from zone', async () => {
    const r = await tols(['tz', 'conv', '2026-01-15 12:00', '--from=America/New_York', '--to=Asia/Tokyo']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('offset: +14.0h');
    expect(r.out).toContain('Jan 15, 2026, 12:00:00 PM');
    expect(r.out).toContain('Jan 16, 2026, 02:00:00 AM');
  });

  it('offset-qualified input keeps instant semantics', async () => {
    const r = await tols(['tz', 'conv', '2026-01-15T12:00:00+03:00', '--from=UTC', '--to=UTC']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('09:00:00 AM');
  });
