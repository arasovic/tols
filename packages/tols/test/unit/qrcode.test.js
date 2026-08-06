import { describe, it, expect } from 'vitest';
import jsQR from 'jsqr';
import * as qr from '../../src/core/qrcode.js';

/** Render a matrix to 1px-per-module RGBA for the decoder. Quiet zone 8:
 * jsQR's finder search is finicky on tiny v1 images below that. */
function toRgba(matrix, quiet = 8) {
  const size = matrix.length;
  const dim = size + quiet * 2;
  const data = new Uint8ClampedArray(dim * dim * 4).fill(255);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (matrix[y][x] === 1) {
        const idx = ((y + quiet) * dim + (x + quiet)) * 4;
        data[idx] = data[idx + 1] = data[idx + 2] = 0;
      }
    }
  }
  return { data, width: dim, height: dim };
}

function roundTrip(text, ecLevel = 'M') {
  const { matrix, size, version } = qr.generateMatrix(text, { ecLevel });
  const img = toRgba(matrix);
  const decoded = jsQR(img.data, img.width, img.height);
  return { decoded, version, size };
}

describe('qrcode core — structure', () => {
  it('mode detection', () => {
    expect(qr.getMode('12345')).toBe(qr.MODE_NUMERIC);
    expect(qr.getMode('HELLO WORLD')).toBe(qr.MODE_ALPHANUMERIC);
    expect(qr.getMode('hello')).toBe(qr.MODE_BYTE);
    expect(qr.getMode('')).toBe(qr.MODE_BYTE);
  });

  it('matrix size follows 17+4v', () => {
    expect(qr.getMatrixSize(1)).toBe(21);
    expect(qr.getMatrixSize(40)).toBe(177);
  });

  it('version selection respects EC level capacity', () => {
    const text = 'x'.repeat(100);
    const vL = qr.getVersion(text, qr.MODE_BYTE, 'L');
    const vH = qr.getVersion(text, qr.MODE_BYTE, 'H');
    expect(vH).toBeGreaterThan(vL);
    expect(qr.getVersion('x'.repeat(3800), qr.MODE_BYTE, 'M')).toBe(-1);
  });

  it('data codewords match spec values', () => {
    expect([1, 2, 3, 4, 5, 6].map((v) => qr.dataCodewords(v, 'M'))).toEqual([16, 28, 44, 64, 86, 108]);
    expect(qr.dataCodewords(10, 'M')).toBe(216);
    expect(qr.dataCodewords(40, 'M')).toBe(2334);
    expect(qr.dataCodewords(1, 'L')).toBe(19);
    expect(qr.dataCodewords(1, 'H')).toBe(9);
  });

  it('format info BCH matches known values', () => {
    expect(qr.formatBits('M', 0)).toBe(0x5412);
    expect(qr.formatBits('L', 0)).toBe(0x77c4);
    expect(qr.formatBits('Q', 0)).toBe(0x355f);
    expect(qr.formatBits('H', 0)).toBe(0x1689);
  });

  it('version info BCH matches known value for v7', () => {
    expect(qr.versionInfoBits(7)).toBe(0x07c94);
  });

  it('alignment positions follow Annex E', () => {
    expect(qr.alignmentPositions(1)).toEqual([]);
    expect(qr.alignmentPositions(2)).toEqual([6, 18]);
    expect(qr.alignmentPositions(7)).toEqual([6, 22, 38]);
    expect(qr.alignmentPositions(14)).toEqual([6, 26, 46, 66]);
    expect(qr.alignmentPositions(32)).toEqual([6, 34, 60, 86, 112, 138]);
  });

  it('block structure sanity for multi-block versions', () => {
    // v8-M: 4 blocks, 2 short (38 data) + 2 long (39 data), 22 ecc each
    const raw = qr.totalCodewords(8);
    expect(raw).toBe(242);
    const numBlocks = qr.NUM_ERROR_CORRECTION_BLOCKS[1][8];
    const eccPerBlock = qr.ECC_CODEWORDS_PER_BLOCK[1][8];
    expect(numBlocks).toBe(4);
    expect(eccPerBlock).toBe(22);
    expect(qr.dataCodewords(8, 'M')).toBe(242 - 88);
  });

  it('byte mode encodes UTF-8 (unicode fix)', () => {
    expect(qr.dataUnitCount('é', qr.MODE_BYTE)).toBe(2);
    expect(qr.dataUnitCount('中文', qr.MODE_BYTE)).toBe(6);
    const bits = qr.textToBits('é', qr.MODE_BYTE);
    expect(bits.slice(0, 8).join('')).toBe('11000011');
    expect(bits.slice(8).join('')).toBe('10101001');
  });

  it('generated matrix has finder patterns intact (never masked)', () => {
    const { matrix } = qr.generateMatrix('HELLO');
    expect(matrix[0].slice(0, 7).join('')).toBe('1111111');
    expect(matrix[1][1]).toBe(0);
    expect(matrix[3][3]).toBe(1);
    expect(matrix[13][8]).toBe(1); // dark module v1
  });

  it('every module is 0 or 1 after generation', () => {
    const { matrix } = qr.generateMatrix('https://example.com/');
    for (const row of matrix) {
      for (const cell of row) expect(cell === 0 || cell === 1).toBe(true);
    }
  });

  it('reed-solomon produces requested number of ecc codewords', () => {
    const ecc = qr.reedSolomon([32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17], 10);
    expect(ecc).toHaveLength(10);
    for (const b of ecc) {
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(256);
    }
  });

  it('throws on empty/too long input', () => {
    expect(() => qr.generateMatrix('')).toThrow('no text to encode');
    expect(() => qr.generateMatrix('x'.repeat(3800))).toThrow('text too long');
  });

  it('rejects unknown EC level', () => {
    expect(() => qr.generateMatrix('hi', { ecLevel: 'X' })).toThrow('unknown EC level');
  });

  it('mask selection is deterministic and in range', () => {
    const a = qr.generateMatrix('determinism check');
    const b = qr.generateMatrix('determinism check');
    expect(a.mask).toBe(b.mask);
    expect(a.mask).toBeGreaterThanOrEqual(0);
    expect(a.mask).toBeLessThanOrEqual(7);
  });
});

describe('qrcode core — jsQR round-trip (decode proof)', () => {
  const cases = [
    ['HELLO', 'M'],
    ['A', 'L'],
    ['0123456789', 'Q'],
    ['ABC $%*+-./:XYZ', 'H'],
    ['https://tols.arasmehmet.com/', 'M'],
    ['https://example.com/path?query=value&other=123#frag', 'H'],
    ['türkçe karakterler: ğüşiöçĞÜŞİÖÇ', 'M'],
    ['中文测试 日本語テスト 한국어', 'Q'],
    ['The quick brown fox jumps over the lazy dog. '.repeat(4), 'L'],
    ['x'.repeat(300), 'M'],
    ['mixed 123 ABC abc émoji 🎉 end', 'H'],
  ];

  for (const [text, ec] of cases) {
    it(`encodes+decodes ${JSON.stringify(text.slice(0, 24))}${text.length > 24 ? '…' : ''} @ ${ec}`, () => {
      const { decoded, version } = roundTrip(text, ec);
      expect(decoded, `decode failed (v${version})`).not.toBeNull();
      expect(decoded.data).toBe(text);
    });
  }

  it('all four EC levels decode the same payload', () => {
    const text = 'https://tols.arasmehmet.com/ — round trip';
    for (const ec of ['L', 'M', 'Q', 'H']) {
      const { decoded } = roundTrip(text, ec);
      expect(decoded, `failed at ${ec}`).not.toBeNull();
      expect(decoded.data).toBe(text);
    }
  });

  it('larger versions (v10+) decode', () => {
    const text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(12);
    const { decoded, version } = roundTrip(text, 'M');
    expect(version).toBeGreaterThanOrEqual(10);
    expect(decoded).not.toBeNull();
    expect(decoded.data).toBe(text);
  });

  it('version >= 7 (version info bits) decodes', () => {
    const text = 'payload '.repeat(60); // ~480 bytes -> v19-M territory
    const { decoded, version } = roundTrip(text, 'M');
    expect(version).toBeGreaterThanOrEqual(7);
    expect(decoded).not.toBeNull();
    expect(decoded.data).toBe(text);
  });

  it('maximum-ish payload near v40 decodes', () => {
    const text = 'a'.repeat(2300); // byte mode, M capacity is 2334 data codewords
    const { decoded, version } = roundTrip(text, 'L');
    expect(version).toBeGreaterThan(30);
    expect(decoded).not.toBeNull();
    expect(decoded.data).toBe(text);
  }, 30000);
});

describe('qrcode core — rendering', () => {
  it('half-block render uses two rows per char row', () => {
    const { matrix, size } = qr.generateMatrix('HI');
    const out = qr.renderText(matrix, { quiet: 0 });
    expect(out.split('\n')).toHaveLength(Math.ceil(size / 2));
  });

  it('ascii render doubles width', () => {
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
});
