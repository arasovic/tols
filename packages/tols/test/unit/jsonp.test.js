import { describe, it, expect } from 'vitest';
import * as jsonp from '../../src/core/jsonp.js';

describe('jsonp core', () => {
  it('wraps payload in callback', () => {
    expect(jsonp.wrapResponse('cb', '{"a": 1}')).toBe('cb({"a":1})');
  });

  it('re-serializes the payload (normalizes whitespace)', () => {
    expect(jsonp.wrapResponse('handler', '{ "x" : [ 1 , 2 ] }')).toBe('handler({"x":[1,2]})');
  });

  it('invalid JSON -> web error message', () => {
    expect(() => jsonp.wrapResponse('cb', '{nope')).toThrow('Invalid JSON response');
  });

  it('callback validation (JS identifier)', () => {
    expect(jsonp.isValidCallback('callback')).toBe(true);
    expect(jsonp.isValidCallback('_cb$2')).toBe(true);
    expect(jsonp.isValidCallback('2cb')).toBe(false);
    expect(jsonp.isValidCallback('a-b')).toBe(false);
    expect(jsonp.isValidCallback('')).toBe(true);
  });

  it('url validation', () => {
    expect(jsonp.isValidUrl('https://api.example.com/data')).toBe(true);
    expect(jsonp.isValidUrl('not a url')).toBe(false);
    expect(jsonp.isValidUrl('')).toBe(true);
  });

  it('script tag shape', () => {
    expect(jsonp.scriptTag('https://x.test/api', 'cb')).toBe('<script src="https://x.test/api?callback=cb"></script>');
  });
});
