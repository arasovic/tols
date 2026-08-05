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

describe('yaml review fixes', () => {
  it('nested list inside array object survives', () => {
    const doc = parse('users:\n  - name: a\n    roles:\n      - admin\n      - dev\n  - name: b\n    roles: []');
    expect(doc).toEqual({
      users: [
        { name: 'a', roles: ['admin', 'dev'] },
        { name: 'b', roles: [] },
      ],
    });
  });

  it('nested object inside array object survives', () => {
    const doc = parse('users:\n  - name: a\n    addr:\n      city: x\n  - name: b');
    expect(doc.users[0].addr).toEqual({ city: 'x' });
    expect(doc.users[1]).toEqual({ name: 'b' });
  });

  it('scalar after a nested container attaches to the same item', () => {
    const doc = parse('users:\n  - name: a\n    roles:\n      - admin\n    port: 80');
    expect(doc.users[0]).toEqual({ name: 'a', roles: ['admin'], port: 80 });
  });

  it('sequences flush with their parent key parse (top-level and in items)', () => {
    expect(parse('items:\n- one\n- two')).toEqual({ items: ['one', 'two'] });
    const doc = parse('users:\n  - name: a\n    roles:\n    - admin\n    port: 80');
    expect(doc.users[0]).toEqual({ name: 'a', roles: ['admin'], port: 80 });
  });

  it('inline arrays keep quoted commas intact', () => {
    expect(parse('tags: ["a,b", c]').tags).toEqual(['a,b', 'c']);
  });

  it('trailing comments are stripped from unquoted values', () => {
    expect(parse('key: value # trailing')).toEqual({ key: 'value' });
    expect(parse('n: 5 # five')).toEqual({ n: 5 });
    expect(parse('color: #fff')).toEqual({ color: null });
  });

  it('a bare key parses as null, not empty string', () => {
    expect(parse('c:')).toEqual({ c: null });
  });
});

describe('yaml deep-review fixes', () => {
  it('parses top-level sequences', () => {
    expect(parse('- a\n- b')).toEqual(['a', 'b']);
    expect(parse('# c\n- 1\n- 2')).toEqual([1, 2]);
    expect(stringify(['x', { a: 1 }])).toBe('- x\n- a: 1\n');
  });

  it('parses nested sequences', () => {
    expect(parse('- - a\n  - b\n- c')).toEqual([['a', 'b'], 'c']);
    expect(parse('- - 1\n  - 2\n- - 3\n  - 4')).toEqual([[1, 2], [3, 4]]);
    expect(parse('m:\n  - - a\n    - b\n  - - c')).toEqual({ m: [['a', 'b'], ['c']] });
  });

  it('unescapes quoted scalars', () => {
    expect(parse('a: "x \\"y\\" z"')).toEqual({ a: 'x "y" z' });
    expect(parse("a: 'it''s'")).toEqual({ a: "it's" });
    expect(parse('a: "tab\\there"')).toEqual({ a: 'tab\there' });
    expect(parse('a: "x # y"')).toEqual({ a: 'x # y' });
    expect(parse('a: "x" # trailing')).toEqual({ a: 'x' });
  });

  it('honors block-scalar indicators', () => {
    expect(parse('a: |\n  x\nb: 2')).toEqual({ a: 'x', b: 2 });
    expect(parse('a: |-\n  x\n  y')).toEqual({ a: 'x\ny' });
    expect(parse('a: |+\n  x\n\n')).toEqual({ a: 'x\n\n' });
    expect(parse('a: >\n  one\n  two\n  three')).toEqual({ a: 'one two three' });
    expect(parse('a: >\n  one\n\n  two')).toEqual({ a: 'one\ntwo' });
  });

  it('block scalars inside array items survive', () => {
    const doc = parse('items:\n  - name: a\n    desc: |\n      line1\n      line2\n  - name: b');
    expect(doc.items[0].desc).toBe('line1\nline2');
    expect(doc.items[1]).toEqual({ name: 'b' });
  });
});
