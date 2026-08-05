import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols qrcode', () => {
  it('gen renders half blocks by default', async () => {
    const r = await tols(['qr', 'gen', 'HELLO']);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/[▀▄█]/);
  });

  it('--ascii uses only # and spaces', async () => {
    const r = await tols(['qr', 'gen', 'HELLO', '--ascii', '--quiet=0']);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/^[# \n]+$/);
  });

  it('stdin input works', async () => {
    const r = await tols(['qrcode', 'gen'], { stdin: 'HELLO\n' });
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/[▀▄█]/);
  });

  it('unicode input encodes via UTF-8', async () => {
    const r = await tols(['qr', 'gen', 'türkçe']);
    expect(r.code).toBe(0);
    expect(r.err).toBe('');
  });

  it('--json reports version and mode', async () => {
    const r = await tols(['qr', 'gen', '12345', '--json']);
    expect(r.code).toBe(0);
    const p = JSON.parse(r.out);
    expect(p.ok).toBe(true);
    expect(p.result.version).toBe(1);
    expect(p.result.mode).toBe('numeric');
  });

  it('too long input -> exit 1', async () => {
    const r = await tols(['qr', 'gen', 'x'.repeat(3800)]);
    expect(r.code).toBe(1);
    expect(r.err).toContain('text too long');
  });

  it('--quiet=0 removes the margin', async () => {
    const withQ = await tols(['qr', 'gen', 'HI', '--ascii', '--quiet=2']);
    const noQ = await tols(['qr', 'gen', 'HI', '--ascii', '--quiet=0']);
    expect(noQ.out.split('\n').length).toBe(withQ.out.split('\n').length - 4);
  });
});
