import { describe, it, expect } from 'vitest';
import { parse, stringify } from '../../src/core/yaml.js';

describe('yaml core', () => {
  it('parses scalars with types', () => {
    expect(parse('a: 1\nb: 1.5\nc: true\nd: null\ne: ~\nf: hello')).toEqual({
      a: 1,
      b: 1.5,
      c: true,
      d: null,
      e: null,
      f: 'hello',
    });
  });

  it('parses nested maps and arrays', () => {
    const v = parse('items:\n  - name: item1\n    value: 1\n  - name: item2\n    value: 2');
    expect(v.items).toEqual([
      { name: 'item1', value: 1 },
      { name: 'item2', value: 2 },
    ]);
  });

  it('parses inline objects and arrays', () => {
    expect(parse('c: {d: true, e: 2}')).toEqual({ c: { d: true, e: 2 } });
    expect(parse('l: [1, 2, 3]')).toEqual({ l: [1, 2, 3] });
  });

  it('ignores comments and empty lines', () => {
    expect(parse('# comment\na: 1\n\nb: 2')).toEqual({ a: 1, b: 2 });
  });

  it('handles quoted strings', () => {
    expect(parse('a: "true"\nb: \'1\'')).toEqual({ a: 'true', b: '1' });
  });

  it('parses empty input as empty object', () => {
    expect(parse('   ')).toEqual({});
  });

  it('stringify matches web output format', () => {
    const v = { a: 1, b: ['x', 'y'], c: { d: true } };
    expect(stringify(v)).toBe('a: 1\nb:\n- x\n- y\nc:\n  d: true\n');
  });

  it('stringify quotes strings that look like other types', () => {
    expect(stringify({ a: 'true' })).toBe('a: "true"\n');
  });
});
