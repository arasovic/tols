import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols barcode', () => {
  it('gen emits SVG', async () => {
    const r = await tols(['bc', 'gen', 'HELLO']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(r.out).toContain('>HELLO</text>');
  });

  it('stdin input', async () => {
    const r = await tols(['barcode', 'gen'], { stdin: '12345\n' });
    expect(r.code).toBe(0);
    expect(r.out).toContain('<svg');
  });

  it('invalid chars -> exit 1 with details', async () => {
    const r = await tols(['bc', 'gen', 'tölge']);
    expect(r.code).toBe(1);
    expect(r.err).toContain('Invalid characters');
  });

  it('empty input -> exit 1', async () => {
    const r = await tols(['bc', 'gen', '   ']);
    expect(r.code).toBe(1);
    expect(r.err).toContain('Please enter text');
  });

  it('--json includes set and values', async () => {
    const r = await tols(['bc', 'gen', '1234', '--json']);
    expect(r.code).toBe(0);
    const p = JSON.parse(r.out);
    expect(p.result.set).toBe('C');
    expect(p.result.values[0]).toBe(105);
  });
});
