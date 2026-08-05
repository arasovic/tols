import { describe, it, expect } from 'vitest';
import * as sql from '../../src/core/sql.js';

describe('sql core', () => {
  it('breaks lines before major clauses and uppercases keywords', () => {
    const out = sql.format('select id from users where x = 1 order by id');
    expect(out).toBe('SELECT id\nFROM users\nWHERE x = 1\nORDER BY id');
  });

  it('lowercase keyword case', () => {
    const out = sql.format('SELECT id FROM t', { keywordCase: 'lowercase' });
    expect(out).toBe('select id\nfrom t');
  });

  it('preserve keeps original keyword casing (CLI addition)', () => {
    const out = sql.format('SeLeCt id FrOm t', { keywordCase: 'preserve' });
    expect(out).toBe('SeLeCt id\nFrOm t');
  });

  it('non-keyword identifiers keep their case', () => {
    expect(sql.format('select MyCol from MyTable')).toContain('MyCol');
  });

  it('strings are untouched', () => {
    const out = sql.format("select 'select from' as s");
    expect(out).toContain("'select from'");
  });

  it('comments kept on their own lines by formatter', () => {
    const out = sql.format('select a -- note\nfrom t');
    expect(out).toContain('-- note');
    expect(out.split('\n').some((l) => l.startsWith('FROM'))).toBe(true);
  });

  it('semicolon resets the statement (own line, web parity)', () => {
    const out = sql.format('select 1; select 2');
    expect(out).toBe('SELECT 1\n;\nSELECT 2');
  });

  it('minify strips comments and collapses whitespace', () => {
    expect(sql.minify('SELECT  id ,  name\nFROM users -- c\nWHERE x = 1')).toBe('SELECT id,name FROM users WHERE x = 1');
  });

  it('minify keeps string contents intact (web bug fixed)', () => {
    expect(sql.minify("select 'a  b' from t")).toBe("select 'a  b' from t");
  });

  it('empty input -> empty output', () => {
    expect(sql.format('   ')).toBe('');
    expect(sql.minify('')).toBe('');
  });
});

describe('sql unterminated constructs (review fixes)', () => {
  it('unterminated block comment stays intact in format', () => {
    const out = sql.format('SELECT a /*unclosed comment');
    expect(out).toContain('/*unclosed comment');
    expect(out).not.toMatch(/^t$/m);
  });

  it('unterminated block comment is dropped whole by minify (no orphan char)', () => {
    expect(sql.minify('SELECT a /*unclosed comment')).toBe('SELECT a');
  });

  it('terminated block comment still minifies away', () => {
    expect(sql.minify('SELECT a /* c */ FROM t')).toBe('SELECT a FROM t');
  });
});

describe('sql deep-review fixes', () => {
  it('minify keeps $-patterns inside string literals intact', () => {
    expect(sql.minify("SELECT '$&' AS x")).toBe("SELECT '$&' AS x");
    expect(sql.minify("SELECT '$\'' ")).toContain("'$\''");
  });
});
