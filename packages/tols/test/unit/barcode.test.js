import { describe, it, expect } from 'vitest';
import * as bc from '../../src/core/barcode.js';

describe('barcode core', () => {
  it('validates printable ASCII only (web messages)', () => {
    expect(bc.validateInput('hello').valid).toBe(true);
    expect(bc.validateInput('').message).toBe(bc.EMPTY_INPUT_MESSAGE);
    expect(bc.validateInput('x'.repeat(101)).message).toContain('Input too long');
    expect(bc.validateInput('türkçe').message).toBe(bc.INVALID_CHARS_MESSAGE);
  });

  it('set selection: even digits >=4 -> C, odd digits -> B (web bug fixed)', () => {
    expect(bc.determineSet('1234')).toBe('C');
    expect(bc.determineSet('12345')).toBe('B');
    expect(bc.determineSet('123')).toBe('B');
    expect(bc.determineSet('abc')).toBe('B');
    expect(bc.determineSet('AB\x01C')).toBe('A');
  });

  it('encodes with correct checksum (Code128-B "12345")', () => {
    const values = bc.encodeCode128('12345');
    expect(values[0]).toBe(104); // START_B
    expect(values.slice(1, 6)).toEqual([17, 18, 19, 20, 21]);
    expect(values[6]).toBe(90); // (104+17+36+57+80+105) % 103
    expect(values[7]).toBe(106); // STOP
  });

  it('set C encodes digit pairs', () => {
    const values = bc.encodeCode128('1234');
    expect(values[0]).toBe(105); // START_C
    expect(values.slice(1, 3)).toEqual([12, 34]);
  });

  it('invalid char details list position', () => {
    const invalid = bc.findInvalidCharacters('abé');
    expect(invalid).toHaveLength(1);
    expect(invalid[0]).toMatchObject({ index: 2, char: 'é' });
  });

  it('generate returns SVG with geometry matching the web', () => {
    const r = bc.generate('ABC');
    // 3 chars: start + 3 data + checksum + stop = 6 values * 11 modules * 2px + 2*10 quiet
    expect(r.width).toBe(6 * 11 * 2 + 20);
    expect(r.svg).toContain(`<svg xmlns="http://www.w3.org/2000/svg" width="${r.width}" height="140"`);
    expect(r.svg).toContain('>ABC</text>');
  });

  it('generate escapes label text', () => {
    const r = bc.generate('a<b');
    expect(r.svg).toContain('>a&lt;b</text>');
  });

  it('generate throws with web-style message on invalid input', () => {
    expect(() => bc.generate('é')).toThrow('Invalid characters');
    expect(() => bc.generate('é')).toThrow('Problem at');
    expect(() => bc.generate('   ')).toThrow(bc.EMPTY_INPUT_MESSAGE);
  });

  it('every value maps to an 11-module pattern', () => {
    for (const v of bc.encodeCode128('Test-123')) {
      expect(bc.CODE128.patterns[v]).toHaveLength(11);
    }
  });
});
