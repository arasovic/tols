import { describe, it, expect } from 'vitest';
import * as xml from '../../src/core/xml.js';

describe('xml core', () => {
  it('formats nested elements with 2-space indent', () => {
    const out = xml.format('<a x="1"><b>text</b><c/></a>');
    expect(out).toBe('<a x="1">\n  <b>\n    text\n  </b>\n  <c/>\n</a>');
  });

  it('keeps the XML declaration on the first line', () => {
    const out = xml.format('<?xml version="1.0"?><a/>');
    expect(out.startsWith('<?xml version="1.0"?>\n')).toBe(true);
  });

  it('handles CDATA and comments', () => {
    const out = xml.format('<a><!-- c --><![CDATA[raw <stuff>]]></a>');
    expect(out).toContain('  <!-- c -->');
    expect(out).toContain('  <![CDATA[raw <stuff>]]>');
  });

  it('throws on tag mismatch (web error surface)', () => {
    expect(() => xml.format('<a><b></a>')).toThrow('XML structure error');
    expect(() => xml.format('<a><b></a>')).toThrow('Tag mismatch');
  });

  it('throws on unclosed tag', () => {
    expect(() => xml.format('<a><b>')).toThrow(/Unclosed/);
  });

  it('format preserves quoted > in double-quoted attribute values', () => {
    expect(xml.format('<root expr="a > b"><child /></root>')).toBe('<root expr="a > b">\n  <child />\n</root>');
  });

  it('format preserves quoted > in single-quoted attribute values', () => {
    expect(xml.format("<root expr='a > b'><child /></root>")).toBe("<root expr='a > b'>\n  <child />\n</root>");
  });

  it('validate accepts quoted > in element attributes', () => {
    expect(xml.validate('<root expr="a > b"><child /></root>')).toBeNull();
  });

  it('validate rejects unclosed quoted tags before success', () => {
    expect(xml.validate('<root expr="a > b</root>')).toContain('Unclosed tag');
  });

  it('format handles doctype system ids and keeps one token', () => {
    expect(xml.format('<!DOCTYPE root SYSTEM "file://a > b"><root />'))
      .toBe('<!DOCTYPE root SYSTEM "file://a > b">\n<root />');
  });

  it('format keeps DTD internal subset with comments and PIs intact', () => {
    const input = '<!DOCTYPE root [<!ELEMENT root ANY><!--note > ]--><?pi data?>]><root/>';
    expect(xml.format(input)).toBe('<!DOCTYPE root [<!ELEMENT root ANY><!--note > ]--><?pi data?>]>\n<root/>');
  });

  it('format and validate preserve PI data that contains > and ] in doctype internal subset', () => {
    const input = '<!DOCTYPE root [<!ELEMENT root ANY><?pi data > ]?>]><root/>';
    expect(xml.format(input)).toBe('<!DOCTYPE root [<!ELEMENT root ANY><?pi data > ]?>]>\n<root/>');
    expect(xml.validate(input)).toBeNull();
  });

  it('validate keeps doctype and does not trim malformed DTD tails', () => {
    expect(xml.validate('<!DOCTYPE root [<!ELEMENT root ANY><!--x> ]--><?pi x?> ]><root/>')).toBeNull();
  });

  it('minify keeps complete doctype contents and trims only outside boundaries', () => {
    expect(xml.minify('  <!DOCTYPE root [<!ELEMENT root ANY> ]>  <root/>  \n'))
      .toBe('<!DOCTYPE root [<!ELEMENT root ANY> ]><root/>');
  });

  it('minify keeps malformed doctype tail when ]> is missing', () => {
    expect(xml.minify('<!DOCTYPE root [<?pi?>\n<a/>')).toBe('<!DOCTYPE root [<?pi?>\n<a/>');
  });

  it('empty-ish input returns input fallback', () => {
    expect(xml.format('')).toBe('');
  });

  it('minify collapses inter-tag whitespace only', () => {
    expect(xml.minify('<a>\n   <b> x  y </b>\n</a>')).toBe('<a><b> x  y </b></a>');
  });

  it('minify never touches attribute values or text runs', () => {
    expect(xml.minify('<a title="x  y">t  u</a>')).toBe('<a title="x  y">t  u</a>');
  });

  it('minify preserves < and > inside quoted attribute values', () => {
    expect(xml.minify('<a title="x > < y"><b/></a>')).toBe('<a title="x > < y"><b/></a>');
  });

  it('minify preserves malformed tail after valid tag and whitespace', () => {
    expect(xml.minify('<a/>  <b')).toBe('<a/>  <b');
  });

  it('minify keeps self-closing quoted-attribute tags', () => {
    expect(xml.minify('<item value="a < b"/>')).toBe('<item value="a < b"/>');
  });

  it('validate returns null for balanced xml', () => {
    expect(xml.validate('<a><b/></a>')).toBeNull();
  });

  it('validate reports the first structural problem', () => {
    expect(xml.validate('<a><b></a>')).toContain('Tag mismatch');
    expect(xml.validate('<!-- never closed')).toContain('Unclosed comment');
  });

  it('exposes XML escaping behavior', () => {
    expect(xml.escapeXml('&<>\"\'')).toBe('&amp;&lt;&gt;&quot;&apos;');
  });

  it('tokenizers reject unclosed declarations and special constructs', () => {
    expect(xml.validate('<!DOCTYPE root [')).toContain('Unclosed DOCTYPE');
    expect(xml.validate('<?pi')).toContain('Unclosed processing instruction');
    expect(xml.validate('<!--x')).toContain('Unclosed comment');
    expect(xml.validate('<![CDATA[x')).toContain('Unclosed CDATA section');
  });

  it('minify handles malformed declarations without validation', () => {
    expect(xml.minify('<!--x')).toBe('<!--x');
    expect(xml.minify('<?pi')).toBe('<?pi');
    expect(xml.minify('<![CDATA[x')).toBe('<![CDATA[x');
    expect(xml.minify('<root')).toBe('<root');
    expect(xml.validate('<!DOCTYPE root [<?pi?>\n<a/>')).toContain('Unclosed DOCTYPE');
  });
});
