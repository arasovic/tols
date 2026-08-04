import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols base64', () => {
  it('encodes positional input', async () => {
    const r = await tols(['b64', 'enc', 'merhaba']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('bWVyaGFiYQ==\n');
  });

  it('decodes piped stdin', async () => {
    const r = await tols(['b64', 'dec'], { stdin: 'bWVyaGFiYQ==\n' });
    expect(r.code).toBe(0);
    expect(r.out).toBe('merhaba\n');
  });

  it('defaults to enc', async () => {
    const r = await tols(['base64', 'hi']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('aGk=\n');
  });

  it('invalid decode -> exit 1, stderr message', async () => {
    const r = await tols(['b64', 'dec', '!!!']);
    expect(r.code).toBe(1);
    expect(r.err).toContain('Invalid Base64 string');
  });

  it('invalid decode --json -> envelope on stdout', async () => {
    const r = await tols(['b64', 'dec', '!!!', '--json']);
    expect(r.code).toBe(1);
    expect(JSON.parse(r.out)).toMatchObject({ ok: false, error: expect.stringContaining('Invalid Base64') });
  });
});
