import { describe, it, expect } from 'vitest';
import * as gzip from '../../src/core/gzip.js';

describe('gzip core', () => {
  it('round-trips text', async () => {
    const z = await gzip.gzip('merhaba dünya');
    expect(await gzip.toText(await gzip.gunzip(z))).toBe('merhaba dünya');
  });

  it('compresses repetitive text below original size', async () => {
    const text = 'a'.repeat(1000);
    const z = await gzip.gzip(text);
    expect(z.length).toBeLessThan(100);
    expect(gzip.ratio(1000, z.length)).toBeGreaterThan(90);
  });

  it('empty input still produces a valid gzip stream (20 bytes min)', async () => {
    const z = await gzip.gzip('');
    expect(z.length).toBeGreaterThanOrEqual(20);
    expect(await gzip.toText(await gzip.gunzip(z))).toBe('');
  });

  it('base64 helpers round-trip', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 255]);
    expect(gzip.base64ToBytes(gzip.bytesToBase64(bytes))).toEqual(bytes);
  });

  it('base64ToBytes rejects invalid input', () => {
    expect(() => gzip.base64ToBytes('!!!')).toThrow('Invalid Base64');
  });

  it('gunzip rejects non-gzip data', async () => {
    await expect(gzip.gunzip(new Uint8Array([1, 2, 3, 4]))).rejects.toThrow('invalid gzip data');
  });

  it('ratio handles zero original size', () => {
    expect(gzip.ratio(0, 10)).toBe(0);
  });
});
