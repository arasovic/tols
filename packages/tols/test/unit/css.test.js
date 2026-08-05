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
    expect(css.minify('.a {\n  color : red ;\n}\n/* bye */')).toBe('.a{color:red;}');
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
