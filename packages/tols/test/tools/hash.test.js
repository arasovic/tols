import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols hash', () => {
  it('sha256 is the default action', async () => {
    const r = await tols(['hash', 'abc']);
    expect(r.code).toBe(0);
    expect(r.out.trim()).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('md5 action', async () => {
    const r = await tols(['hs', 'md5', 'abc']);
    expect(r.code).toBe(0);
    expect(r.out.trim()).toBe('900150983cd24fb0d6963f7d28e17f72');
  });

  it('reads piped stdin', async () => {
    const r = await tols(['hs', 'sha1'], { stdin: 'abc\n' });
    expect(r.code).toBe(0);
    expect(r.out.trim()).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
  });
});
