import { describe, it, expect } from 'vitest';
import { encode, decode, isValid } from '../../src/core/base64.js';

describe('base64 core', () => {
  it('encodes ascii', () => expect(encode('merhaba')).toBe('bWVyaGFiYQ=='));

  it('encodes empty string', () => expect(encode('')).toBe(''));

  it('roundtrips unicode', () => expect(decode(encode('héllo ☃ şğı'))).toBe('héllo ☃ şğı'));

  it('decodes without padding', () => expect(decode('bWVyaGFiYQ')).toBe('merhaba'));

  it('strips whitespace before decoding (web parity)', () => {
    expect(decode('bWVy aGFi\nYQ==')).toBe('merhaba');
  });

  it('throws on invalid characters', () => {
    expect(() => decode('invalid-base64!')).toThrow('Invalid Base64 string');
  });

  it('throws on impossible length (len % 4 === 1)', () => {
    expect(() => decode('AAAAA')).toThrow('Invalid Base64 string');
  });

  it('throws on bad padding', () => {
    expect(() => decode('AA=')).toThrow('Invalid Base64 string');
  });

  it('isValid', () => {
    expect(isValid('bWVyaGFiYQ==')).toBe(true);
    expect(isValid('bWVyaGFiYQ')).toBe(true);
    expect(isValid('!!!')).toBe(false);
    expect(isValid('AAAAA')).toBe(false);
  });
});
