import { describe, it, expect } from 'vitest';
import * as md from '../../src/core/markdown.js';

describe('markdown core', () => {
  it('headings h1..h6', () => {
    expect(md.toHtml('# A')).toBe('<h1>A</h1>');
    expect(md.toHtml('###### F')).toBe('<h6>F</h6>');
  });

  it('paragraph with inline styles', () => {
    const out = md.toHtml('Hello **bold** *em* `code` ~~gone~~ __b2__ _e2_');
    expect(out).toBe('<p>Hello <strong>bold</strong> <em>em</em> <code>code</code> <del>gone</del> <strong>b2</strong> <em>e2</em></p>');
  });

  it('unordered and ordered lists', () => {
    expect(md.toHtml('- a\n- b')).toBe('<ul><li>a</li><li>b</li></ul>');
    expect(md.toHtml('1. a\n2. b')).toBe('<ol><li>a</li><li>b</li></ol>');
  });

  it('list type switch closes the previous list', () => {
    const out = md.toHtml('- a\n1. b');
    expect(out).toBe('<ul><li>a</li></ul>\n<ol><li>b</li></ol>');
  });

  it('fenced code blocks escape content and carry language class', () => {
    const out = md.toHtml('```js\nlet x = 1 < 2;\n```');
    expect(out).toBe('<pre><code class="language-js">let x = 1 &lt; 2;</code></pre>');
  });

  it('indented code blocks', () => {
    const out = md.toHtml('    code <here>');
    expect(out).toBe('<pre><code>code &lt;here&gt;</code></pre>');
  });

  it('blockquotes', () => {
    expect(md.toHtml('> wise words')).toBe('<blockquote>wise words</blockquote>');
  });

  it('horizontal rules', () => {
    expect(md.toHtml('---')).toBe('<hr>');
    expect(md.toHtml('***')).toBe('<hr>');
  });

  it('escapes raw HTML in input', () => {
    expect(md.toHtml('<script>alert(1)</script>')).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
  });

  it('sanitizes dangerous URLs to #', () => {
    expect(md.parseInline('[x](javascript:alert(1))')).toContain('href="#"');
    expect(md.parseInline('[x](https://ok.test)')).toContain('href="https://ok.test"');
    expect(md.parseInline('![i](data:image/png;base64,x)')).toContain('src="#"');
  });

  it('allows relative and anchor URLs', () => {
    expect(md.parseInline('[a](/path)')).toContain('href="/path"');
    expect(md.parseInline('[a](#frag)')).toContain('href="#frag"');
  });

  it('trailing double space becomes <br>', () => {
    expect(md.parseInline('line one  \nline two')).toContain('<br>');
  });
});

describe('markdown review fixes', () => {
  it('unclosed fence flushes its content at EOF', () => {
    const out = md.toHtml('para\n```js\ncode here');
    expect(out).toContain('<p>para</p>');
    expect(out).toContain('class="language-js"');
    expect(out).toContain('code here');
  });

  it('sanitize blocks protocol-relative and backslash-relative URLs', () => {
    expect(md.sanitizeUrl('//evil.com')).toBe('#');
    expect(md.sanitizeUrl('/\\evil.com')).toBe('#');
    expect(md.sanitizeUrl('\\\\evil.com')).toBe('#');
    expect(md.sanitizeUrl('javascript:alert(1)')).toBe('#');
    expect(md.sanitizeUrl('/docs/x')).toBe('/docs/x');
    expect(md.sanitizeUrl('#frag')).toBe('#frag');
    expect(md.sanitizeUrl('https://ok.com/x')).toBe('https://ok.com/x');
  });

  it('backslash-relative links render as # in output', () => {
    expect(md.toHtml('[x](/\\evil.com)')).toContain('href="#"');
  });
});

describe('markdown deep-review fixes', () => {
  it('code spans stay literal (no emphasis/links inside)', () => {
    expect(md.toHtml('`**a**`')).toBe('<p><code>**a**</code></p>');
    expect(md.toHtml('`[x](http://y)`')).toBe('<p><code>[x](http://y)</code></p>');
    expect(md.toHtml('a `b` **c**')).toBe('<p>a <code>b</code> <strong>c</strong></p>');
  });
});

describe('paragraphs span the lines they were wrapped across', () => {
  // The whole suite above tests single-line inputs, which is why nothing caught
  // this: every non-blank line became its own <p>, so any document whose prose
  // is wrapped at a column rendered as one paragraph per line. The repository's
  // own READMEs are wrapped that way, which is how it surfaced.
  it('joins consecutive lines into one paragraph', () => {
    expect(md.toHtml('first line\nsecond line')).toBe('<p>first line\nsecond line</p>');
  });

  it('still separates paragraphs on a blank line', () => {
    expect(md.toHtml('one\n\ntwo')).toBe('<p>one</p>\n<p>two</p>');
  });

  it('honours a two-space hard break inside a paragraph', () => {
    // parseInline has always had the `  $` -> <br> rule, but it is written with
    // the multiline flag and so could never fire while it was handed one line
    // at a time. Joining the paragraph is what makes it reachable.
    expect(md.toHtml('Web: tols  \nCLI: npm i')).toBe('<p>Web: tols<br>\nCLI: npm i</p>');
  });

  it('parses emphasis that opens and closes on different lines', () => {
    expect(md.toHtml('a **bold\ntext** b')).toBe('<p>a <strong>bold\ntext</strong> b</p>');
  });

  it('closes the paragraph before every block construct', () => {
    expect(md.toHtml('text\n# H')).toBe('<p>text</p>\n<h1>H</h1>');
    expect(md.toHtml('text\n- item')).toBe('<p>text</p>\n<ul><li>item</li></ul>');
    expect(md.toHtml('text\n> quote')).toBe('<p>text</p>\n<blockquote>quote</blockquote>');
    expect(md.toHtml('text\n---')).toBe('<p>text</p>\n<hr>');
    expect(md.toHtml('text\n```\nc\n```')).toBe('<p>text</p>\n<pre><code>c</code></pre>');
  });

  it('closes the paragraph at end of input', () => {
    expect(md.toHtml('trailing text')).toBe('<p>trailing text</p>');
  });
});
