import { describe, it, expect } from 'vitest';
import { hash } from '../../src/core/hash.js';

describe('hash core', () => {
  it('md5 known vectors', async () => {
    expect(await hash('', 'md5')).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(await hash('abc', 'md5')).toBe('900150983cd24fb0d6963f7d28e17f72');
  });

  it('sha256 known vector', async () => {
    expect(await hash('abc', 'sha256')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('sha1 and sha512', async () => {
    expect(await hash('abc', 'sha1')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
    expect((await hash('abc', 'sha512')).length).toBe(128);
  });

  it('unicode is deterministic', async () => {
    const a = await hash('şeker ☃', 'sha256');
    const b = await hash('şeker ☃', 'sha256');
    expect(a).toBe(b);
  });

  it('rejects unknown algorithm', async () => {
    await expect(hash('x', 'crc32')).rejects.toThrow(/unknown algorithm/);
  });
});
