import { describe, it, expect } from 'vitest';
import { decode, encode, decodeJWT } from '../../src/core/jwt.js';

describe('jwt core', () => {
  it('roundtrips encode -> decode', async () => {
    const token = await encode({ alg: 'HS256', typ: 'JWT' }, { sub: '1234', name: 'şeker ☃' }, 's3cret');
    expect(token.split('.')).toHaveLength(3);
    const r = decode(token);
    expect(r.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(r.payload).toEqual({ sub: '1234', name: 'şeker ☃' });
  });

  it('same secret produces same signature (deterministic HMAC)', async () => {
    const a = await encode({ alg: 'HS256' }, { x: 1 }, 'key');
    const b = await encode({ alg: 'HS256' }, { x: 1 }, 'key');
    expect(a).toBe(b);
  });

  it('different secrets produce different signatures', async () => {
    const a = await encode({ alg: 'HS256' }, { x: 1 }, 'key1');
    const b = await encode({ alg: 'HS256' }, { x: 1 }, 'key2');
    expect(a.split('.')[2]).not.toBe(b.split('.')[2]);
  });

  it('rejects malformed tokens', () => {
    expect(() => decode('only.two')).toThrow('expected 3 parts');
    expect(() => decode('')).toThrow('Please enter a JWT token');
    expect(() => decode('!!!.@@@.###')).toThrow('Invalid JWT header');
  });

  it('decodeJWT compat shape', async () => {
    const bad = await decodeJWT('nope');
    expect(bad).toMatchObject({ valid: false, error: expect.stringContaining('3 parts') });
    const token = await encode({ alg: 'HS256' }, { a: 1 }, 'k');
    const good = await decodeJWT(token);
    expect(good.valid).toBe(true);
    expect(good.payload).toEqual({ a: 1 });
  });
});
