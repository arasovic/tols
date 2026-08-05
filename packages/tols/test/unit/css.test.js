import { describe, it, expect } from 'vitest';
import * as css from '../../src/core/css.js';

describe('css core', () => {
  it('formats a simple rule with 2-space indent', () => {
    expect(css.format('.a{color:red;margin:0}')).toBe('.a {\n  color: red;\n  margin: 0\n}');
  });

  it('selector lists go one per line', () => {
    const out = css.format('h1, h2{color:blue}');
    expect(out).toContain('h1,\nh2 {');
  });

  it('keeps pseudo-class colons unspaced in selectors', () => {
    const out = css.format('a:hover{color:red}');
    expect(out.startsWith('a:hover {')).toBe(true);
  });

  it('keeps declaration value spacing meaningful', () => {
    expect(css.format('.a{margin:0 2px 4px;}')).toContain('margin: 0 2px 4px;');
  });

  it('handles strings with spaces inside url()', () => {
    const out = css.format('.a{background:url("x y.png");}');
    expect(out).toContain('background: url("x y.png");');
  });

  it('formats nested @media blocks with indentation', () => {
    const out = css.format('@media (max-width:600px){.b{color:red}}');
    expect(out).toBe('@media (max-width:600px) {\n  .b {\n    color: red\n  }\n}');
  });

  it('comments preserved by formatter, on their own line', () => {
    const out = css.format('/* hi */.a{color:red}');
    expect(out.startsWith('/* hi */\n')).toBe(true);
  });

  it('minify strips comments and whitespace', () => {
    expect(css.minify('.a {\n  color : red ;\n}\n/* bye */')).toBe('.a{color:red}');
  });

  it('minify drops the last ; before } (adjacent case)', () => {
    expect(css.minify('.a{color:red;}')).toBe('.a{color:red}');
  });

  it('minify does not eat value chars on adjacent ;} (web bug fixed)', () => {
    expect(css.minify('.a{color:red;}')).not.toContain('re}');
    expect(css.minify('.a{background:url(x);}')).toBe('.a{background:url(x)}');
  });

  it('minify keeps meaningful spaces in values', () => {
    expect(css.minify('.a{margin:0 2px}')).toBe('.a{margin:0 2px}');
  });

  it('format(minify(x)) is stable for already-formatted input', () => {
    const src = '.a {\n  color: red;\n  margin: 0\n}';
    expect(css.format(css.minify(src))).toBe(src);
  });

  it('empty input stays empty', () => {
    expect(css.format('')).toBe('');
    expect(css.minify('')).toBe('');
  });
});

describe('css review fixes', () => {
  it('unterminated comment is dropped whole by minify (no orphan char)', () => {
    expect(css.minify('a{color:red}/*unclosed')).toBe('a{color:red}');
  });

  it('unterminated comment kept intact by format', () => {
    expect(css.format('a{color:red}/*unclosed')).toContain('/*unclosed');
    expect(css.format('a{color:red}/*unclosed')).not.toContain('\nd\n');
  });

  it('at-rule scan survives semicolons inside quoted strings', () => {
    const out = css.format('@import "a;b.css";a{color:red}');
    expect(out).toContain('@import "a;b.css";');
    expect(out).toContain('color: red');
  });
});

describe('css deep-review fixes', () => {
  it('minify keeps the descendant combinator before pseudo-classes', () => {
    expect(css.minify('.parent :hover { color: red }')).toBe('.parent :hover{color:red}');
    expect(css.minify('a > b { x: 1 }')).toBe('a > b{x:1}');
  });

  it('minify strips : whitespace only inside declaration blocks', () => {
    expect(css.minify('@media (min-width: 1px) { .a :focus { color : red } }'))
      .toBe('@media (min-width: 1px){.a :focus{color:red}}');
  });

  it('minify drops trailing ; before } even with whitespace', () => {
    expect(css.minify('.a { color: red ; }')).toBe('.a{color:red}');
    expect(css.minify('.a{x:1; y:2; }')).toBe('.a{x:1;y:2}');
  });
});
