import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols xml', () => {
  it('fmt via stdin', async () => {
    const r = await tols(['xml', 'fmt'], { stdin: '<a><b>x</b></a>\n' });
    expect(r.code).toBe(0);
    expect(r.out).toBe('<a>\n  <b>\n    x\n  </b>\n</a>\n');
  });

  it('defaults to fmt', async () => {
    const r = await tols(['xml', '<a/>']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('<a/>\n');
  });

  it('invalid structure -> exit 1', async () => {
    const r = await tols(['xml', 'fmt', '<a><b></a>']);
    expect(r.code).toBe(1);
    expect(r.err).toContain('XML structure error');
  });

  it('val success', async () => {
    const r = await tols(['xml', 'val', '<a><b/></a>']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('valid\n');
  });

  it('val failure -> exit 1', async () => {
    const r = await tols(['xml', 'val', '<a><b></a>']);
    expect(r.code).toBe(1);
    expect(r.err).toContain('Tag mismatch');
  });

  it('min collapses whitespace', async () => {
    const r = await tols(['xml', 'min', '<a>\n  <b/>\n</a>']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('<a><b/></a>\n');
  });

  it('--json envelope on val', async () => {
    const r = await tols(['xml', 'val', '<a/>', '--json']);
    expect(r.code).toBe(0);
    expect(JSON.parse(r.out)).toMatchObject({ ok: true, result: true });
  });
});
