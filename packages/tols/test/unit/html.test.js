import { describe, it, expect } from 'vitest';
import * as html from '../../src/core/html.js';

describe('html core', () => {
  it('formats nested tags with 2-space indent', () => {
    expect(html.format('<div><p>hi</p></div>')).toBe('<div>\n  <p>\n    hi\n  </p>\n</div>');
  });

  it('keeps void elements self-contained (no close tag, no indent bump)', () => {
    const out = html.format('<div><br><img src="a.png"><p>x</p></div>');
    expect(out).toContain('  <br>');
    expect(out).toContain('  <img src="a.png">');
    expect(out).toContain('  <p>');
  });

  it('doctype stays on its own line', () => {
    const out = html.format('<!DOCTYPE html><html><body>x</body></html>');
    expect(out.startsWith('<!DOCTYPE html>\n<html>')).toBe(true);
  });

  it('preserves whitespace-sensitive content', () => {
    const out = html.format('<pre>  a\n  b  </pre>');
    expect(out).toContain('  a\n  b  ');
  });

  it('recovers from mismatched tags without crashing (web parity)', () => {
    const out = html.format('<div><span></div>');
    expect(out).toBe('<div>\n  <span>\n</div>');
  });

  it('comments keep their indentation', () => {
    const out = html.format('<div><!-- note --></div>');
    expect(out).toContain('  <!-- note -->');
  });

  it('empty input -> empty output', () => {
    expect(html.format('')).toBe('');
  });

  it('minify collapses inter-tag whitespace', () => {
    expect(html.minify('<div>\n  <p>a</p>\n</div>')).toBe('<div><p>a</p></div>');
  });

  it('minify protects pre content', () => {
    const out = html.minify('<div>\n  <pre>  keep   spaces  </pre>\n</div>');
    expect(out).toContain('<pre>  keep   spaces  </pre>');
  });

  it('removeComments option', () => {
    expect(html.minify('<p>a</p><!-- x -->', { removeComments: true })).toBe('<p>a</p>');
    expect(html.minify('<p>a</p><!-- x -->')).toContain('<!-- x -->');
  });

  it('removeWhitespace option strips around brackets', () => {
    const out = html.minify('<div> <p class="x"> a </p> </div>', { removeWhitespace: true });
    expect(out).toBe('<div><p class="x"> a </p></div>');
  });
});

describe('html deep-review fixes', () => {
  it('format keeps pre/textarea content byte-exact', () => {
    expect(html.format('<pre>abc</pre>')).toBe('<pre>abc</pre>');
    expect(html.format('<textarea>abc</textarea>')).toBe('<textarea>abc</textarea>');
    expect(html.format('<div><pre>  a\n  b  </pre></div>'))
      .toBe('<div>\n  <pre>  a\n  b  </pre>\n</div>');
    expect(html.format('<p><code>x</code></p>')).toBe('<p>\n  <code>x</code>\n</p>');
  });

  it('minify restores protected blocks literally ($ patterns)', () => {
    expect(html.minify('<div><pre>price $& more</pre></div>')).toBe('<div><pre>price $& more</pre></div>');
    expect(html.minify("<pre>$'x $$ \$1</pre>")).toBe("<pre>$'x $$ \$1</pre>");
  });

  it('removeComments never creates a comment opener at a removed boundary', () => {
    expect(html.minify('<<!---->!--', { removeComments: true })).toBe('< !--')
    expect(html.minify('<!<!--x-->-->', { removeComments: true })).toBe('<! -->')
    expect(html.minify('a<!--x--><!--y-->b', { removeComments: true })).toBe('ab')
  });
});
