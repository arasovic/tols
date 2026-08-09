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

  it('format preserves void element with quoted > attribute', () => {
    expect(html.format('<div><IMG data-expression="a > b"></div>'))
      .toBe('<div>\n  <IMG data-expression="a > b">\n</div>');
  });

  it('doctype stays on its own line', () => {
    const out = html.format('<!DOCTYPE html><html><body>x</body></html>');
    expect(out.startsWith('<!DOCTYPE html>\n<html>')).toBe(true);
  });

  it('keeps malformed doctype without a closing ]> as raw text', () => {
    const out = html.format('<!DOCTYPE html [<?pi?>\n<div></div>');
    expect(out).toBe('<!DOCTYPE html [<?pi?>\n<div></div>');
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

  it('closes tags using tag names even when source close tag casing differs', () => {
    expect(html.format('<div><B></B></div>')).toBe('<div>\n  <B>\n  </b>\n</div>');
  });

  it('format preserves quoted > inside double-quoted attribute values', () => {
    expect(html.format('<div data-expression="a > b"><span>x</span></div>'))
      .toBe('<div data-expression="a > b">\n  <span>\n    x\n  </span>\n</div>');
  });

  it('format preserves quoted > inside single-quoted attribute values', () => {
    expect(html.format("<div data-expression='a > b'><span>x</span></div>"))
      .toBe("<div data-expression='a > b'>\n  <span>\n    x\n  </span>\n</div>");
  });

  it('minify preserves quoted > < and repeated spaces', () => {
    expect(html.minify('<div title="a  >  <  b">  x  </div>')).toBe('<div title="a  >  <  b"> x </div>');
  });

  it('minify preserves quoted > < and repeated spaces with removeWhitespace', () => {
    expect(html.minify('<div title="a  >  <  b">  x  </div>', { removeWhitespace: true }))
      .toBe('<div title="a  >  <  b"> x </div>');
  });

  it('minify keeps doctype internal subset byte-exact with quoted > <', () => {
    expect(html.minify('<!DOCTYPE root [<!ENTITY x "a  >  <  b" >]><root/>'))
      .toBe('<!DOCTYPE root [<!ENTITY x "a  >  <  b" >]><root/>');
  });

  it('minify with removeWhitespace keeps doctype internal subset byte-exact', () => {
    expect(html.minify('<!DOCTYPE root [<!ENTITY x "a  >  <  b" >]><root/>', { removeWhitespace: true }))
      .toBe('<!DOCTYPE root [<!ENTITY x "a  >  <  b" >]><root/>');
  });

  it('preserves whitespace-sensitive opening tags with quoted >', () => {
    expect(html.format('<p><pre data-expression="a > b">  x\n  y  </pre></p>'))
      .toBe('<p>\n  <pre data-expression="a > b">  x\n  y  </pre>\n</p>');
  });

  it('falls back to escaped HTML for input without recognized tokens', () => {
    expect(html.escapeHtml('&<>"\'')).toBe('&amp;&lt;&gt;"\'');
    expect(html.format('<')).toBe('<');
  });

  it('minify preserves malformed comments for removeComments=false and remove them when requested', () => {
    expect(html.minify('<!--x')).toBe('<!--x');
    expect(html.minify('<!--x', { removeComments: true })).toBe('<!--x');
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

  it('removeComments and removeWhitespace together still run safe boundary protection', () => {
    expect(html.minify('<<!---->!--', { removeComments: true, removeWhitespace: true })).toBe('< !--');
    expect(html.minify('a<!--x--><!--y-->b', { removeComments: true, removeWhitespace: true })).toBe('ab');
  });
});
