import { describe, it, expect } from 'vitest';
import { encode, decode, analyze } from '../../src/core/url.js';

describe('url core', () => {
  it('encodes spaces and special chars', () => {
    expect(encode('a b&c=d')).toBe('a%20b%26c%3Dd');
  });

  it('encodes unicode', () => {
    expect(encode('şeker')).toBe('%C5%9Feker');
  });

  it('decodes', () => {
    expect(decode('hello%20world')).toBe('hello world');
  });

  it('throws on malformed percent encoding', () => {
    expect(() => decode('%E0%A4%A')).toThrow('Invalid input for URL decoding');
  });

  it('analyzes a URL', () => {
    const r = analyze('https://example.com/p/a?x=1&y=a%20b#frag');
    expect(r.protocol).toBe('https');
    expect(r.host).toBe('example.com');
    expect(r.pathname).toBe('/p/a');
    expect(r.params).toEqual([
      { key: 'x', value: '1' },
      { key: 'y', value: 'a b' },
    ]);
    expect(r.hash).toBe('#frag');
  });

  it('analyze throws on invalid URL', () => {
    expect(() => analyze('not a url')).toThrow('Invalid URL format');
  });
});
