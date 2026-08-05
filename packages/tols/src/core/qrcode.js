/**
 * QR code core — encoder ported from apps/web QrcodeTool.svelte.
 *
 * Web-parity behavior kept: EC level M, mask pattern 0, single-block
 * Reed-Solomon, no alignment patterns (so versions >= 2 follow the same
 * simplified encoding as the web tool). Known limitation: codes above
 * version 2 may not scan with strict readers; upgrading the encoder is a
 * separate task.
 *
 * One deliberate fix: byte mode encodes UTF-8 bytes (TextEncoder) instead
 * of raw UTF-16 code units, so non-Latin text no longer corrupts — same
 * class of bug as the Phase 1 JWT unicode fix.
 */

export const MODE_NUMERIC = 1;
export const MODE_ALPHANUMERIC = 2;
export const MODE_BYTE = 4;

export const EC_LEVELS = {
  L: { value: 0, blocks: [7, 1, 0], capacity: [19, 34, 55, 80, 108, 136] },
  M: { value: 1, blocks: [10, 1, 0], capacity: [16, 28, 44, 64, 86, 108] },
  Q: { value: 2, blocks: [13, 1, 0], capacity: [13, 22, 34, 48, 62, 76] },
  H: { value: 3, blocks: [17, 1, 0], capacity: [9, 16, 26, 36, 46, 60] },
};

// Data codewords per version at EC level M.
export const VERSION_CAPACITY_M = [16, 28, 44, 64, 86, 108, 124, 154, 182, 216, 240, 278, 318, 358, 400, 438, 504, 532, 588, 650, 700, 732, 788, 860, 914, 1000, 1062, 1128, 1193, 1267, 1377, 1458, 1548, 1628, 1722, 1809, 1911, 1989, 2099, 2213, 2331];

// Total data bits per version.
export const VERSION_TOTAL_BITS = [
  152, 272, 440, 640, 864, 1088, 1248, 1552, 1856, 2192,
  2496, 2800, 3112, 3568, 4000, 4288, 4928, 5312, 5728, 6256,
  6736, 7216, 7744, 8352, 8832, 9600, 10208, 10816, 11408, 12128,
  13056, 13808, 14560, 15424, 16288, 17136, 18048, 18960, 19904, 20928,
  21952,
];

const GF_LOG = new Array(256);
const GF_EXP = new Array(512);

function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
}
initGF();

export function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

export function gfPow(a, n) {
  if (n === 0) return 1;
  if (a === 0) return 0;
  return GF_EXP[(GF_LOG[a] * n) % 255];
}

export function generatorPoly(degree) {
  let g = [1];
  for (let i = 0; i < degree; i++) {
    const newG = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      newG[j] ^= g[j];
      newG[j + 1] ^= gfMul(g[j], GF_EXP[i]);
    }
    g = newG;
  }
  return g;
}

export function reedSolomon(data, ecCodewords) {
  const g = generatorPoly(ecCodewords);
  const remainder = new Array(ecCodewords).fill(0);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    remainder.shift();
    remainder.push(0);
    for (let j = 0; j < ecCodewords; j++) {
      remainder[j] ^= gfMul(g[j + 1] || 0, factor);
    }
  }
  return remainder;
}

/** @param {string} text */
export function getMode(text) {
  if (!text) return MODE_BYTE;
  if (/^[0-9]*$/.test(text)) return MODE_NUMERIC;
  if (/^[0-9A-Z $%*+\-./:]*$/.test(text)) return MODE_ALPHANUMERIC;
  return MODE_BYTE;
}

export function getCharCountBits(version, mode) {
  if (mode === MODE_NUMERIC) return version < 10 ? 10 : 12;
  if (mode === MODE_ALPHANUMERIC) return version < 10 ? 9 : 11;
  return version < 10 ? 8 : 16;
}

export function getModeIndicator(mode) {
  if (mode === MODE_NUMERIC) return [0, 0, 0, 1];
  if (mode === MODE_ALPHANUMERIC) return [0, 0, 1, 0];
  return [0, 1, 0, 0];
}

/** @param {string} text */
export function utf8Bytes(text) {
  return new TextEncoder().encode(text);
}

/** Number of units placed in the character-count field (bytes in byte mode). */
export function dataUnitCount(text, mode) {
  return mode === MODE_BYTE ? utf8Bytes(text).length : text.length;
}

export function textToBits(text, mode) {
  const bits = [];

  if (mode === MODE_NUMERIC) {
    for (let i = 0; i < text.length; i += 3) {
      const chunk = text.substring(i, i + 3);
      const num = parseInt(chunk, 10);
      const bitLen = chunk.length === 3 ? 10 : chunk.length === 2 ? 7 : 4;
      for (let j = bitLen - 1; j >= 0; j--) {
        bits.push((num >> j) & 1);
      }
    }
  } else if (mode === MODE_ALPHANUMERIC) {
    const charMap = {};
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
    for (let i = 0; i < chars.length; i++) {
      charMap[chars[i]] = i;
    }
    for (let i = 0; i < text.length; i += 2) {
      if (i + 1 < text.length) {
        const num = charMap[text[i]] * 45 + charMap[text[i + 1]];
        for (let j = 10; j >= 0; j--) {
          bits.push((num >> j) & 1);
        }
      } else {
        const num = charMap[text[i]];
        for (let j = 5; j >= 0; j--) {
          bits.push((num >> j) & 1);
        }
      }
    }
  } else {
    // UTF-8 bytes (web used UTF-16 code units, corrupting non-Latin text)
    const bytes = utf8Bytes(text);
    for (const byte of bytes) {
      for (let j = 7; j >= 0; j--) {
        bits.push((byte >> j) & 1);
      }
    }
  }

  return bits;
}

export function getVersion(text, mode) {
  if (!text) return 1;
  const bitsNeeded = 4 + getCharCountBits(1, mode) + textToBits(text, mode).length + 4;
  for (let v = 1; v <= 40; v++) {
    if (bitsNeeded <= totalCodewords(v) * 8) return v;
  }
  return -1;
}

export function bitsToBytes(bits) {
  const bytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8 && i + j < bits.length; j++) {
      byte = (byte << 1) | bits[i + j];
    }
    bytes.push(byte);
  }
  return bytes;
}

export function bytesToBits(bytes) {
  const bits = [];
  for (const byte of bytes) {
    for (let j = 7; j >= 0; j--) {
      bits.push((byte >> j) & 1);
    }
  }
  return bits;
}

/**
 * Total codewords for a version, derived from module geometry (all
 * non-reserved modules). Replaces the web's VERSION_TOTAL_BITS, which
 * turned out to hold EC-L data capacities — the root of the wrong
 * padding/ECC counts there.
 * @param {number} version
 */
export function totalCodewords(version) {
  const size = getMatrixSize(version);
  let modules = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isReserved(size, r, c, version)) modules++;
    }
  }
  return Math.floor(modules / 8);
}

export function generateQRData(text, version, mode) {
  const dataBits = [];

  dataBits.push(...getModeIndicator(mode));

  const countBits = getCharCountBits(version, mode);
  const unitCount = dataUnitCount(text, mode);
  for (let i = countBits - 1; i >= 0; i--) {
    dataBits.push((unitCount >> i) & 1);
  }

  dataBits.push(...textToBits(text, mode));

  const totalBits = totalCodewords(version) * 8;
  const terminatorLen = Math.min(4, totalBits - dataBits.length);
  for (let i = 0; i < terminatorLen; i++) {
    dataBits.push(0);
  }

  while (dataBits.length % 8 !== 0) {
    dataBits.push(0);
  }

  const padBytes = [0b11101100, 0b00010001];
  let padIndex = 0;
  while (dataBits.length < totalBits) {
    const byte = padBytes[padIndex % 2];
    for (let j = 7; j >= 0; j--) {
      dataBits.push((byte >> j) & 1);
    }
    padIndex++;
  }

  const finalDataBits = dataBits.slice(0, totalBits);
  const dataBytes = bitsToBytes(finalDataBits);

  const dataCodewords = VERSION_CAPACITY_M[version - 1] || VERSION_CAPACITY_M[VERSION_CAPACITY_M.length - 1];
  const ecCodewords = totalBits / 8 - dataCodewords;

  const dataBlocks = dataBytes.slice(0, dataCodewords);
  const eccBytes = reedSolomon(dataBlocks, ecCodewords);

  return bytesToBits([...dataBlocks, ...eccBytes]);
}

export function getMatrixSize(version) {
  return 17 + version * 4;
}

/** Alignment pattern center coordinates for a version (ISO 18004 Annex E). */
export function alignmentPositions(version) {
  if (version === 1) return [];
  const size = getMatrixSize(version);
  const numAlign = Math.floor(version / 7) + 2;
  const step = version === 32 ? 26 : Math.ceil((size - 13) / (2 * numAlign - 2)) * 2;
  const result = [6];
  for (let pos = size - 7; result.length < numAlign; pos -= step) {
    result.push(pos);
  }
  return result;
}

/**
 * Real alignment pattern centers: every coordinate pair except the three
 * that would collide with finder patterns.
 * @returns {[number, number][]}
 */
export function alignmentCenters(version) {
  const positions = alignmentPositions(version);
  const size = getMatrixSize(version);
  const centers = [];
  for (const r of positions) {
    for (const c of positions) {
      const onFinderCorner =
        (r === 6 && c === 6) ||
        (r === 6 && c === size - 7) ||
        (r === size - 7 && c === 6);
      if (!onFinderCorner) centers.push([r, c]);
    }
  }
  return centers;
}

/** Draw 5x5 alignment patterns at the real centers. */
export function drawAlignmentPatterns(matrix, version) {
  for (const [row, col] of alignmentCenters(version)) {
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
        matrix[row + dr][col + dc] = dark ? 1 : 0;
      }
    }
  }
}

const POSITION_PATTERN = [
  [1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1],
];

export function drawTimingPattern(matrix, size) {
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0 ? 1 : 0;
    matrix[i][6] = i % 2 === 0 ? 1 : 0;
  }
}

export function drawFinderPatterns(matrix, size) {
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 7; x++) {
      matrix[y][x] = POSITION_PATTERN[y][x];
    }
  }
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 7; x++) {
      matrix[y][size - 7 + x] = POSITION_PATTERN[y][x];
    }
  }
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 7; x++) {
      matrix[size - 7 + y][x] = POSITION_PATTERN[y][x];
    }
  }
  for (let i = 0; i < 8; i++) {
    matrix[7][i] = 0;
    matrix[i][7] = 0;
    matrix[7][size - 8 + i] = 0;
    matrix[i][size - 8] = 0;
    matrix[size - 8][i] = 0;
    matrix[size - 8 + i][7] = 0;
  }
}

export function drawDarkModule(matrix, version) {
  const pos = 4 * version + 9;
  if (pos < matrix.length) {
    matrix[pos][8] = 1;
  }
}

export function isReserved(size, row, col, version) {
  // Alignment patterns (version >= 2)
  for (const [ar, ac] of alignmentCenters(version)) {
    if (Math.abs(row - ar) <= 2 && Math.abs(col - ac) <= 2) return true;
  }
  if (row < 9 && col < 9) return true;
  if (row < 9 && col >= size - 8) return true;
  if (row >= size - 8 && col < 9) return true;
  if (row === 6 || col === 6) return true;
  const darkPos = 4 * version + 9;
  if (row === darkPos && col === 8) return true;
  if (row === 8 && col < 9) return true;
  if (row < 9 && col === 8) return true;
  if (row === 8 && col >= size - 8) return true;
  if (row >= size - 8 && col === 8) return true;

  // Version information blocks (version >= 7): two 6x3 areas
  if (version >= 7) {
    if (row < 6 && col >= size - 11 && col <= size - 9) return true;
    if (col < 6 && row >= size - 11 && row <= size - 9) return true;
  }

  return false;
}

export function placeData(matrix, size, data, version) {
  let bitIndex = 0;
  let direction = -1;

  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let rowPass = 0; rowPass < size; rowPass++) {
      const row = direction === -1 ? size - 1 - rowPass : rowPass;
      for (let c = 0; c < 2; c++) {
        const colOffset = col - c;
        if (!isReserved(size, row, colOffset, version)) {
          if (bitIndex < data.length) {
            matrix[row][colOffset] = data[bitIndex];
            bitIndex++;
          }
        }
      }
    }
    direction = -direction;
  }
}

// Mask 0: (row + col) % 2 === 0, applied to DATA modules only.
// The web applied it to the whole matrix, corrupting finder patterns —
// nothing it produced could scan.
export function applyMask(matrix, size, version) {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (isReserved(size, y, x, version)) continue;
      const cell = matrix[y][x];
      if (cell !== null && cell !== undefined && (y + x) % 2 === 0) {
        matrix[y][x] = cell ^ 1;
      }
    }
  }
}

// Format info (15-bit BCH) for mask 0.
export const FORMAT_INFO_TABLE = {
  0: 0x77c4, // L
  1: 0x5412, // M
  2: 0x5e7c, // Q
  3: 0x5b4f, // H
};

// The web mis-placed several format bits (wrong order in the top-left
// column and top-right row, and it overwrote the dark module). Placement
// below follows ISO 18004 7.9. Only entry 1 (M, mask 0) of the table is
// used, matching the encoder's fixed EC level/mask.
export function drawFormatInfo(matrix, size, ecLevel, maskPattern) {
  const formatInfo = FORMAT_INFO_TABLE[ecLevel] || FORMAT_INFO_TABLE[1];
  const bit = (i) => (formatInfo >> i) & 1;

  // Copy 1 around the top-left finder pattern
  for (let i = 0; i <= 5; i++) matrix[8][i] = bit(i);
  matrix[8][7] = bit(6);
  matrix[8][8] = bit(7);
  matrix[7][8] = bit(8);
  for (let i = 9; i <= 14; i++) matrix[14 - i][8] = bit(i);

  // Copy 2: bottom-left column (bits 0-6) + top-right row (bits 7-14).
  // Row size-8 col 8 is the dark module and stays 1.
  for (let i = 0; i <= 6; i++) matrix[size - 1 - i][8] = bit(i);
  for (let i = 7; i <= 14; i++) matrix[8][size - 15 + i] = bit(i);
}

/**
 * Full encode: text -> module matrix (1 = dark).
 * @param {string} text
 * @returns {{ matrix: (number | null)[][], size: number, version: number, mode: number }}
 */
export function generateMatrix(text) {
  if (!text) throw new Error('no text to encode');
  const mode = getMode(text);
  const version = getVersion(text, mode);
  if (version === -1) throw new Error('text too long for QR code');

  const size = getMatrixSize(version);
  const matrix = Array(size).fill(null).map(() => Array(size).fill(null));

  drawFinderPatterns(matrix, size);
  drawAlignmentPatterns(matrix, version);
  drawTimingPattern(matrix, size);
  drawDarkModule(matrix, version);

  const data = generateQRData(text, version, mode);
  placeData(matrix, size, data, version);
  // Remainder modules (versions with non-multiple-of-8 data capacity) stay 0.
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === null || matrix[r][c] === undefined) matrix[r][c] = 0;
    }
  }
  applyMask(matrix, size, version);
  drawFormatInfo(matrix, size, 1, 0); // EC level M, mask 0

  return { matrix, size, version, mode };
}

/**
 * Render a matrix as text. Default uses unicode half blocks (two module
 * rows per character row); ascii=true uses two chars per module.
 * A 2-module quiet zone is added (terminal backgrounds vary).
 * @param {(number | null)[][]} matrix
 * @param {{ ascii?: boolean, quiet?: number }} opts
 */
export function renderText(matrix, opts = {}) {
  const ascii = opts.ascii ?? false;
  const quiet = opts.quiet ?? 2;
  const size = matrix.length;
  const rows = size + quiet * 2;
  const cols = size + quiet * 2;
  const dark = (r, c) => {
    const mr = r - quiet;
    const mc = c - quiet;
    if (mr < 0 || mc < 0 || mr >= size || mc >= size) return 0;
    return matrix[mr][mc] === 1 ? 1 : 0;
  };

  const lines = [];
  if (ascii) {
    for (let r = 0; r < rows; r++) {
      let line = '';
      for (let c = 0; c < cols; c++) {
        line += dark(r, c) ? '##' : '  ';
      }
      lines.push(line);
    }
  } else {
    for (let r = 0; r < rows; r += 2) {
      let line = '';
      for (let c = 0; c < cols; c++) {
        const top = dark(r, c);
        const bottom = r + 1 < rows ? dark(r + 1, c) : 0;
        if (top && bottom) line += '█';
        else if (top) line += '▀';
        else if (bottom) line += '▄';
        else line += ' ';
      }
      lines.push(line);
    }
  }
  return lines.join('\n');
}
