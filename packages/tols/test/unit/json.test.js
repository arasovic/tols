import { describe, it, expect } from 'vitest';
import { format, minify, validate } from '../../src/core/json.js';

describe('json core', () => {
  it('formats with 2-space indent', () => {
    expect(format('{"a":1,"b":{"c":[1,2]}}')).toBe('{\n  "a": 1,\n  "b": {\n    "c": [\n      1,\n      2\n    ]\n  }\n}');
  });

  it('minifies', () => {
    expect(minify('{ "a" : 1 }')).toBe('{"a":1}');
  });

  it('handles unicode and null', () => {
    expect(minify('{"ş":"🎈","n":null}')).toBe('{"ş":"🎈","n":null}');
  });

  it('reports line/column for syntax errors', () => {
    const input = ['{', '  "name": "test",', '  "value": 123', '  "broken": "string"', '}'].join('\n');
    expect(() => format(input)).toThrow('Invalid JSON at line 4, column 3');
  });

  it('falls back to native message when no position hint', () => {
    const input = ['{', '  "a": ', '}'].join('\n');
    expect(() => format(input)).toThrow(/^Invalid JSON: /);
  });

  it('validate ok', () => {
    expect(validate('{"a":1}')).toEqual({ valid: true });
  });

  it('validate bad returns error message', () => {
    const r = validate('{bad');
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/^Invalid JSON/);
  });
});
