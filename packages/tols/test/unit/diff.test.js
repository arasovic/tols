import { describe, it, expect, beforeEach } from 'vitest';
import { diffLines, toPlainText, myersDiff, computeWordDiff, similarityScore, resetCache } from '../../src/core/diff.js';

describe('diff core', () => {
  beforeEach(() => resetCache());

  it('myers produces minimal consistent edit script', () => {
    const ops = myersDiff(['a', 'b', 'c'], ['a', 'x', 'c', 'd']);
    expect(ops.map((o) => o.type)).toEqual(['equal', 'delete', 'insert', 'equal', 'insert']);
  });

  it('identical texts -> no differences', () => {
    const r = diffLines('same\ntext', 'same\ntext');
    expect(r.differ).toBe(false);
    expect(r.items.every((i) => i.type === 'same')).toBe(true);
  });

  it('detects added/removed/modified lines', () => {
    const r = diffLines(['a', 'hello world', 'c'].join('\n'), ['a', 'hello there', 'c', 'd'].join('\n'));
    const types = r.items.map((i) => i.type);
    expect(types).toEqual(['same', 'modified', 'same', 'added']);
    expect(r.differ).toBe(true);
  });

  it('plain text uses git-like markers', () => {
    const r = diffLines('a\nb', 'a\nc');
    const text = toPlainText(r);
    expect(text).toContain('  a');
    expect(text).toContain('- b');
    expect(text).toContain('+ c');
  });

  it('word-level diff finds changed words', () => {
    const wd = computeWordDiff('hello world', 'hello there');
    const inserted = wd.filter((w) => w.type === 'insert').map((w) => w.text);
    const deleted = wd.filter((w) => w.type === 'delete').map((w) => w.text);
    expect(inserted.join(' ')).toContain('there');
    expect(deleted.join(' ')).toContain('world');
  });

  it('similarityScore symmetric and bounded', () => {
    expect(similarityScore('abc', 'abc')).toBe(1);
    expect(similarityScore('abc', 'xyz')).toBe(0);
    const s = similarityScore('hello world', 'hello there');
    expect(s).toBeGreaterThan(0.3);
    expect(s).toBeLessThan(1);
  });

  it('handles unicode lines', () => {
    const r = diffLines(['şeker bal', 'acı biber'].join('\n'), ['şeker bal', 'tatlı biber'].join('\n'));
    expect(r.items[0].type).toBe('same');
    expect(r.items[1].type).toBe('modified');
  });
});
