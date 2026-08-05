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

  it('empty-ish input returns input fallback', () => {
    expect(xml.format('')).toBe('');
  });

  it('minify collapses inter-tag whitespace only', () => {
    expect(xml.minify('<a>\n   <b> x  y </b>\n</a>')).toBe('<a><b> x y </b></a>');
  });

  it('validate returns null for balanced xml', () => {
    expect(xml.validate('<a><b/></a>')).toBeNull();
  });

  it('validate reports the first structural problem', () => {
    expect(xml.validate('<a><b></a>')).toContain('Tag mismatch');
    expect(xml.validate('<!-- never closed')).toContain('Unclosed comment');
  });
});
