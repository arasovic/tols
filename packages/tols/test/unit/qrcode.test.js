import { describe, it, expect } from 'vitest';
import * as qr from '../../src/core/qrcode.js';

describe('qrcode core', () => {
  it('mode detection', () => {
    expect(qr.getMode('12345')).toBe(qr.MODE_NUMERIC);
    expect(qr.getMode('HELLO WORLD')).toBe(qr.MODE_ALPHANUMERIC);
    expect(qr.getMode('hello')).toBe(qr.MODE_BYTE);
    expect(qr.getMode('')).toBe(qr.MODE_BYTE);
  });

  it('version selection by capacity', () => {
    expect(qr.getVersion('HELLO', qr.MODE_ALPHANUMERIC)).toBe(1);
    expect(qr.getVersion('x'.repeat(3800), qr.MODE_BYTE)).toBe(-1);
  });

  it('matrix size follows 17+4v', () => {
    expect(qr.getMatrixSize(1)).toBe(21);
    expect(qr.getMatrixSize(2)).toBe(25);
  });

  it('generates a version 1 matrix with finder patterns', () => {
    const { matrix, size, version } = qr.generateMatrix('HELLO');
    expect(version).toBe(1);
    expect(size).toBe(21);
    // top-left finder: 7x7 with dark corners and white ring
    expect(matrix[0][0]).toBe(1);
    expect(matrix[0][6]).toBe(1);
    expect(matrix[6][0]).toBe(1);
    expect(matrix[1][1]).toBe(0);
    expect(matrix[3][3]).toBe(1);
    // dark module for v1 at (13, 8) before masking stays dark after mask?
    // (mask 0 flips (r+c)%2==0; 13+8=21 odd -> untouched)
    expect(matrix[13][8]).toBe(1);
  });

  it('every module is 0 or 1 after generation (no nulls)', () => {
    const { matrix } = qr.generateMatrix('https://example.com/');
    for (const row of matrix) {
      for (const cell of row) {
        expect(cell === 0 || cell === 1).toBe(true);
      }
    }
  });

  it('byte mode encodes UTF-8 (unicode fix)', () => {
    // 'é' is 2 UTF-8 bytes, not 1 UTF-16 unit
    expect(qr.dataUnitCount('é', qr.MODE_BYTE)).toBe(2);
    expect(qr.dataUnitCount('中文', qr.MODE_BYTE)).toBe(6);
    const bits = qr.textToBits('é', qr.MODE_BYTE);
    expect(bits).toHaveLength(16);
    // U+00E9 = UTF-8 C3 A9
    expect(bits.slice(0, 8).join('')).toBe('11000011');
    expect(bits.slice(8).join('')).toBe('10101001');
  });

  it('reed-solomon produces requested number of ecc codewords', () => {
    const ecc = qr.reedSolomon([32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17], 10);
    expect(ecc).toHaveLength(10);
    for (const b of ecc) expect(b).toBeGreaterThanOrEqual(0), expect(b).toBeLessThan(256);
  });

  it('renderText half-block uses two rows per char row', () => {
    const { matrix, size } = qr.generateMatrix('HI');
    const out = qr.renderText(matrix, { quiet: 0 });
    expect(out.split('\n')).toHaveLength(Math.ceil(size / 2));
  });

  it('renderText ascii doubles width', () => {
    const { matrix, size } = qr.generateMatrix('HI');
    const out = qr.renderText(matrix, { ascii: true, quiet: 0 });
    const lines = out.split('\n');
    expect(lines).toHaveLength(size);
    expect(lines[0]).toHaveLength(size * 2);
    expect(out).toMatch(/^[# ]+$/m);
  });

  it('quiet zone surrounds the code', () => {
    const { matrix } = qr.generateMatrix('HI');
    const out = qr.renderText(matrix, { ascii: true, quiet: 2 });
    const lines = out.split('\n');
    expect(lines[0].trim()).toBe('');
    expect(lines[lines.length - 1].trim()).toBe('');
  });

  it('throws on empty/too long input', () => {
    expect(() => qr.generateMatrix('')).toThrow('no text to encode');
    expect(() => qr.generateMatrix('x'.repeat(3800))).toThrow('text too long');
  });
});
