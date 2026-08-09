import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols xml', () => {
  it('fmt via stdin', async () => {
    const r = await tols(['xml', 'fmt'], { stdin: '<a><b>x</b></a>\n' });
    expect(r.code).toBe(0);
    expect(r.out).toBe('<a>\n  <b>\n    x\n  </b>\n</a>\n');
  });

  it('fmt preserves quoted > in attributes', async () => {
    const r = await tols(['xml', 'fmt', '<root expr="a > b"><child /></root>']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('<root expr="a > b">\n  <child />\n</root>\n');
  });

  it('defaults to fmt', async () => {
    const r = await tols(['xml', '<a/>']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('<a/>\n');
  });

  it('val succeeds for quoted > in attributes', async () => {
    const r = await tols(['xml', 'val', '<root expr="a > b"><child /></root>']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('valid\n');
  });

  it('val rejects unterminated quoted tag', async () => {
    const r = await tols(['xml', 'val', '<root expr="a > b</root>']);
    expect(r.code).toBe(1);
    expect(r.err).toContain('Unclosed');
  });

  it('val succeeds with internal-subset doctype', async () => {
    const doctype = '<!DOCTYPE root [<!ELEMENT root ANY><!--note > ]--><?pi data?>]><root/>';
    const r = await tols(['xml', 'val', doctype]);
    expect(r.code).toBe(0);
    expect(r.out).toBe('valid\n');
  });

  it('fmt preserves doctype/PI boundary with > and ] in internal subset', async () => {
    const input = '<!DOCTYPE root [<!ELEMENT root ANY><?pi data > ]?>]><root/>';
    const r = await tols(['xml', 'fmt', input]);
    expect(r.code).toBe(0);
    expect(r.out).toBe('<!DOCTYPE root [<!ELEMENT root ANY><?pi data > ]?>]>\n<root/>\n');
  });

  it('val succeeds when doctype PI data includes > and ]', async () => {
    const doctype = '<!DOCTYPE root [<!ELEMENT root ANY><?pi data > ]?>]><root/>';
    const r = await tols(['xml', 'val', doctype]);
    expect(r.code).toBe(0);
    expect(r.out).toBe('valid\n');
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

  it('min keeps self-closing quoted-operator attributes', async () => {
    const r = await tols(['xml', 'min', '<item value="a > < b" />']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('<item value="a > < b" />\n');
  });

  it('--json envelope on val', async () => {
    const r = await tols(['xml', 'val', '<a/>', '--json']);
    expect(r.code).toBe(0);
    expect(JSON.parse(r.out)).toMatchObject({ ok: true, result: true });
  });
});
