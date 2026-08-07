/**
 * QR code core — spec-complete Model 2 encoder (versions 1-40, EC levels
 * L/M/Q/H, all 8 mask patterns with automatic selection).
 *
 * History: Phase 2 ported the hand-rolled encoder from apps/web
 * QrcodeTool.svelte and fixed its structural bugs (mask corrupting function
 * patterns, wrong capacity table, mis-placed format info, UTF-16 byte
 * mode). This revision completes the encoder: multi-block Reed-Solomon
 * with proper interleaving, penalty-based mask selection, version
 * information bits, and per-level capacities.
 *
 * EC/block tables and the penalty algorithm follow ISO 18004, adapted from
 * Project Nayuki's QR Code generator (MIT license, github.com/nayuki/
 * QR-Code-generator). Byte mode encodes UTF-8.
 */

/** @typedef {(number | null)[][]} Matrix */

export const MODE_NUMERIC = 1;
export const MODE_ALPHANUMERIC = 2;
export const MODE_BYTE = 4;

export const EC_LEVELS = ['L', 'M', 'Q', 'H'];

// EC level indicator bits used inside the format info (ISO 18004 7.9).
/** @type {Record<string, number>} */
const EC_FORMAT_ORDER = { L: 1, M: 0, Q: 3, H: 2 };

// Error correction codewords per block, [level][version] (index 0 unused).
// Source: ISO 18004 Table 9, via Nayuki (MIT).
export const ECC_CODEWORDS_PER_BLOCK = [
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], // L
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], // M
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], // Q
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], // H
];

// Number of Reed-Solomon blocks, [level][version] (index 0 unused).
export const NUM_ERROR_CORRECTION_BLOCKS = [
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25], // L
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49], // M
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68], // Q
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81], // H
];

/* ---- Galois field + Reed-Solomon ---- */

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

/**
 * Galois field multiply.
 * @param {number} a
 * @param {number} b
 */
export function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

/**
 * Galois field power.
 * @param {number} a
 * @param {number} n
 */
export function gfPow(a, n) {
  if (n === 0) return 1;
  if (a === 0) return 0;
  return GF_EXP[(GF_LOG[a] * n) % 255];
}

/** @param {number} degree */
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

/** RS remainder of `data` divided by the generator polynomial of degree ecLen. */
/** @param {number[]} data @param {number} ecLen */
export function reedSolomon(data, ecLen) {
  const g = generatorPoly(ecLen);
  const remainder = new Array(ecLen).fill(0);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    remainder.shift();
    remainder.push(0);
    for (let j = 0; j < ecLen; j++) {
      remainder[j] ^= gfMul(g[j + 1] || 0, factor);
    }
  }
  return remainder;
}

/* ---- Capacity ---- */

/** @param {number} version */
export function getMatrixSize(version) {
  return 17 + version * 4;
}

/** Total modules excluding function patterns (includes remainder bits). */
/** @param {number} version */
export function rawModuleCount(version) {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

/** @param {number} version */
export function totalCodewords(version) {
  return Math.floor(rawModuleCount(version) / 8);
}

/** Data codewords available at a version/EC level (rest is ECC). */
/** @param {number} version @param {string} ecLevel */
export function dataCodewords(version, ecLevel) {
  const e = EC_LEVELS.indexOf(ecLevel);
  if (e === -1) throw new Error(`unknown EC level: ${ecLevel}`);
  return totalCodewords(version) - ECC_CODEWORDS_PER_BLOCK[e][version] * NUM_ERROR_CORRECTION_BLOCKS[e][version];
}

/* ---- Data encoding ---- */

/** @param {string} text */
export function getMode(text) {
  if (!text) return MODE_BYTE;
  if (/^[0-9]*$/.test(text)) return MODE_NUMERIC;
  if (/^[0-9A-Z $%*+\-./:]*$/.test(text)) return MODE_ALPHANUMERIC;
  return MODE_BYTE;
}

/** @param {number} version @param {number} mode */
export function getCharCountBits(version, mode) {
  if (mode === MODE_NUMERIC) return version < 10 ? 10 : version < 27 ? 12 : 14;
  if (mode === MODE_ALPHANUMERIC) return version < 10 ? 9 : version < 27 ? 11 : 13;
  return version < 10 ? 8 : 16;
}

/** @param {number} mode */
export function getModeIndicator(mode) {
  if (mode === MODE_NUMERIC) return [0, 0, 0, 1];
  if (mode === MODE_ALPHANUMERIC) return [0, 0, 1, 0];
  return [0, 1, 0, 0];
}

/** @param {string} text */
export function utf8Bytes(text) {
  return new TextEncoder().encode(text);
}

/** Units stored in the character-count field (bytes in byte mode). */
/** @param {string} text @param {number} mode */
export function dataUnitCount(text, mode) {
  return mode === MODE_BYTE ? utf8Bytes(text).length : text.length;
}

/** @param {string} text @param {number} mode */
export function textToBits(text, mode) {
  const bits = [];
  if (mode === MODE_NUMERIC) {
    for (let i = 0; i < text.length; i += 3) {
      const chunk = text.substring(i, i + 3);
      const num = parseInt(chunk, 10);
      const bitLen = chunk.length === 3 ? 10 : chunk.length === 2 ? 7 : 4;
      for (let j = bitLen - 1; j >= 0; j--) bits.push((num >> j) & 1);
    }
  } else if (mode === MODE_ALPHANUMERIC) {
    /** @type {Record<string, number>} */
    const charMap = {};
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
    for (let i = 0; i < chars.length; i++) charMap[chars[i]] = i;
    for (let i = 0; i < text.length; i += 2) {
      if (i + 1 < text.length) {
        const num = charMap[text[i]] * 45 + charMap[text[i + 1]];
        for (let j = 10; j >= 0; j--) bits.push((num >> j) & 1);
      } else {
        const num = charMap[text[i]];
        for (let j = 5; j >= 0; j--) bits.push((num >> j) & 1);
      }
    }
  } else {
    for (const byte of utf8Bytes(text)) {
      for (let j = 7; j >= 0; j--) bits.push((byte >> j) & 1);
    }
  }
  return bits;
}

/** Smallest version fitting the text at the EC level, or -1. */
/** @param {string} text @param {number} mode @param {string} [ecLevel] */
export function getVersion(text, mode, ecLevel = 'M') {
  if (!text) return 1;
  const dataBits = textToBits(text, mode).length;
  for (let v = 1; v <= 40; v++) {
    // 4 mode bits + count field + payload; the up-to-4-bit terminator is
    // truncatable, so it is not required for the fit check.
    const bitsNeeded = 4 + getCharCountBits(v, mode) + dataBits;
    if (bitsNeeded <= dataCodewords(v, ecLevel) * 8) return v;
  }
  return -1;
}

/** @param {number[]} bits */
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

/** @param {number[]} bytes */
export function bytesToBits(bytes) {
  const bits = [];
  for (const byte of bytes) {
    for (let j = 7; j >= 0; j--) bits.push((byte >> j) & 1);
  }
  return bits;
}

/** Encode the payload into data codewords (mode, count, data, terminator, pad). */
/** @param {string} text @param {number} version @param {number} mode @param {string} ecLevel */
export function encodeDataCodewords(text, version, mode, ecLevel) {
  const capacityBits = dataCodewords(version, ecLevel) * 8;
  const bits = [];
  bits.push(...getModeIndicator(mode));
  const countBits = getCharCountBits(version, mode);
  const unitCount = dataUnitCount(text, mode);
  for (let i = countBits - 1; i >= 0; i--) bits.push((unitCount >> i) & 1);
  bits.push(...textToBits(text, mode));
  const terminatorLen = Math.min(4, capacityBits - bits.length);
  for (let i = 0; i < terminatorLen; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);
  let padByte = 0xec;
  while (bits.length < capacityBits) {
    for (let j = 7; j >= 0; j--) bits.push((padByte >> j) & 1);
    padByte ^= 0xec ^ 0x11;
  }
  return bitsToBytes(bits.slice(0, capacityBits));
}

/**
 * Split data into RS blocks, compute per-block ECC, and interleave both
 * data and ECC codewords (ISO 18004 8.6) — required for versions whose
 * EC structure has multiple blocks.
 * @param {number[]} dataBytes
 * @param {number} version
 * @param {string} ecLevel
 */
export function addEccAndInterleave(dataBytes, version, ecLevel) {
  const e = EC_LEVELS.indexOf(ecLevel);
  const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[e][version];
  const blockEccLen = ECC_CODEWORDS_PER_BLOCK[e][version];
  const rawCodewords = totalCodewords(version);
  const dataLen = dataBytes.length;
  const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
  const shortBlockDataLen = Math.floor(rawCodewords / numBlocks) - blockEccLen;

  const result = new Array(rawCodewords);
  let offset = 0;
  for (let i = 0; i < numBlocks; i++) {
    const datLen = shortBlockDataLen + (i < numShortBlocks ? 0 : 1);
    const dat = dataBytes.slice(offset, offset + datLen);
    offset += datLen;
    const ecc = reedSolomon(dat, blockEccLen);
    for (let j = 0, k = i; j < datLen; j++, k += numBlocks) {
      if (j === shortBlockDataLen) k -= numShortBlocks;
      result[k] = dat[j];
    }
    for (let j = 0, k = dataLen + i; j < blockEccLen; j++, k += numBlocks) {
      result[k] = ecc[j];
    }
  }
  return result;
}

/* ---- Function patterns ---- */

/** Alignment pattern center coordinates (ISO 18004 Annex E). */
/** @param {number} version */
export function alignmentPositions(version) {
  if (version === 1) return [];
  const numAlign = Math.floor(version / 7) + 2;
  const step = Math.floor((version * 8 + numAlign * 3 + 5) / (numAlign * 4 - 4)) * 2;
  const result = new Array(numAlign);
  result[0] = 6;
  let pos = version * 4 + 10;
  for (let i = numAlign - 1; i >= 1; i--, pos -= step) result[i] = pos;
  return result;
}

/** Real alignment centers (coordinate pairs minus the three finder corners). */
/** @param {number} version */
export function alignmentCenters(version) {
  const positions = alignmentPositions(version);
  const size = getMatrixSize(version);
  const centers = [];
  for (const r of positions) {
    for (const c of positions) {
      const onFinderCorner =
        (r === 6 && c === 6) || (r === 6 && c === size - 7) || (r === size - 7 && c === 6);
      if (!onFinderCorner) centers.push([r, c]);
    }
  }
  return centers;
}

/** @param {Matrix} matrix @param {number} version */
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

/** @param {Matrix} matrix @param {number} size */
export function drawFinderPatterns(matrix, size) {
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 7; x++) {
      matrix[y][x] = POSITION_PATTERN[y][x];
      matrix[y][size - 7 + x] = POSITION_PATTERN[y][x];
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

/** @param {Matrix} matrix @param {number} size */
export function drawTimingPattern(matrix, size) {
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0 ? 1 : 0;
    matrix[i][6] = i % 2 === 0 ? 1 : 0;
  }
}

/** @param {Matrix} matrix @param {number} version */
export function drawDarkModule(matrix, version) {
  const pos = 4 * version + 9;
  if (pos < matrix.length) matrix[pos][8] = 1;
}

/** Version information bits, BCH(18,6) with generator 0x1F25. */
/** @param {number} version */
export function versionInfoBits(version) {
  let rem = version;
  for (let i = 0; i < 12; i++) {
    rem = (rem << 1) ^ ((rem >> 11) * 0x1f25);
  }
  return (version << 12) | rem;
}

/** Draw the two 6x3 version information blocks (version >= 7). */
/** @param {Matrix} matrix @param {number} version */
export function drawVersionInfo(matrix, version) {
  if (version < 7) return;
  const size = matrix.length;
  const bits = versionInfoBits(version);
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 3; j++) {
      const bit = (bits >> (i * 3 + j)) & 1;
      matrix[i][size - 11 + j] = bit;
      matrix[size - 11 + j][i] = bit;
    }
  }
}

/** @param {number} size @param {number} row @param {number} col @param {number} version */
export function isReserved(size, row, col, version) {
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
  if (version >= 7) {
    if (row < 6 && col >= size - 11 && col <= size - 9) return true;
    if (col < 6 && row >= size - 11 && row <= size - 9) return true;
  }
  return false;
}

/** @param {Matrix} matrix @param {number} size @param {number[]} data @param {number} version */
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

/* ---- Masking ---- */

// Mask condition per ISO 18004 Table 10: (row, col) -> invert when true.
/** @type {((r: number, c: number) => boolean)[]} */
export const MASK_FUNCTIONS = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

/** XOR the mask over data modules only; applying twice undoes it. */
/** @param {Matrix} matrix @param {number} size @param {number} version @param {number} mask */
export function applyMask(matrix, size, version, mask) {
  const fn = MASK_FUNCTIONS[mask];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (isReserved(size, y, x, version)) continue;
      const cell = matrix[y][x];
      if (cell !== null && cell !== undefined && fn(y, x)) {
        matrix[y][x] = cell ^ 1;
      }
    }
  }
}

/* ---- Format information ---- */

/** 15-bit format info, BCH(15,5) with generator 0x537 and XOR mask 0x5412. */
/** @param {string} ecLevel @param {number} mask */
export function formatBits(ecLevel, mask) {
  const data = (EC_FORMAT_ORDER[ecLevel] << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) {
    rem = (rem << 1) ^ ((rem >> 9) * 0x537);
  }
  return ((data << 10) | rem) ^ 0x5412;
}

/** Draw both format info copies (ISO 18004 7.9), dark module included. */
/** @param {Matrix} matrix @param {number} size @param {string} ecLevel @param {number} mask */
export function drawFormatInfo(matrix, size, ecLevel, mask) {
  const bits = formatBits(ecLevel, mask);
  const bit = (/** @type {number} */ i) => (bits >> i) & 1;

  for (let i = 0; i < 15; i++) {
    // Vertical: top-left column (bits 0-5 rows 0-5, bit 6 at (7,8),
    // bit 7 at (8,8)) and bottom-left column (bits 8-14).
    if (i < 6) matrix[i][8] = bit(i);
    else if (i < 8) matrix[i + 1][8] = bit(i);
    else matrix[size - 15 + i][8] = bit(i);

    // Horizontal: top-right row (bits 0-7), bit 8 at (8,7),
    // top-left row cols 5..0 (bits 9-14).
    if (i < 8) matrix[8][size - i - 1] = bit(i);
    else if (i === 8) matrix[8][7] = bit(i);
    else matrix[8][14 - i] = bit(i);
  }

  matrix[size - 8][8] = 1; // dark module (always set)
}

/* ---- Mask penalty scoring (ISO 18004 7.8.3) ---- */

const PENALTY_N1 = 3;
const PENALTY_N2 = 3;
const PENALTY_N3 = 40;
const PENALTY_N4 = 10;

/** @param {number} currentRunLength @param {number[]} runHistory @param {number} qrsize */
function finderPenaltyAddHistory(currentRunLength, runHistory, qrsize) {
  if (runHistory[0] === 0) currentRunLength += qrsize; // add light border to initial run
  for (let i = 6; i >= 1; i--) runHistory[i] = runHistory[i - 1];
  runHistory[0] = currentRunLength;
}

/** @param {number[]} runHistory */
function finderPenaltyCountPatterns(runHistory) {
  const n = runHistory[1];
  const core = n > 0 && runHistory[2] === n && runHistory[3] === n * 3 && runHistory[4] === n && runHistory[5] === n;
  return (
    (core && runHistory[0] >= n * 4 && runHistory[6] >= n ? 1 : 0) +
    (core && runHistory[6] >= n * 4 && runHistory[0] >= n ? 1 : 0)
  );
}

/** @param {number} currentRunColor @param {number} currentRunLength @param {number[]} runHistory @param {number} qrsize */
function finderPenaltyTerminateAndCount(currentRunColor, currentRunLength, runHistory, qrsize) {
  if (currentRunColor) {
    finderPenaltyAddHistory(currentRunLength, runHistory, qrsize);
    currentRunLength = 0;
  }
  currentRunLength += qrsize; // add light border to final run
  finderPenaltyAddHistory(currentRunLength, runHistory, qrsize);
  return finderPenaltyCountPatterns(runHistory);
}

/** Total mask penalty score; lower is better. */
/** @param {Matrix} matrix */
export function getPenaltyScore(matrix) {
  const qrsize = matrix.length;
  let result = 0;

  /** @param {(i: number) => number | null} get */
  const scanLine = (get) => {
    let runColor = 0;
    let runLen = 0;
    const runHistory = [0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < qrsize; i++) {
      const color = get(i);
      if (color === runColor) {
        runLen++;
        if (runLen === 5) result += PENALTY_N1;
        else if (runLen > 5) result++;
      } else {
        finderPenaltyAddHistory(runLen, runHistory, qrsize);
        if (!runColor) result += finderPenaltyCountPatterns(runHistory) * PENALTY_N3;
        runColor = color ?? 0;
        runLen = 1;
      }
    }
    result += finderPenaltyTerminateAndCount(runColor, runLen, runHistory, qrsize) * PENALTY_N3;
  };

  for (let y = 0; y < qrsize; y++) scanLine((x) => matrix[y][x]);
  for (let x = 0; x < qrsize; x++) scanLine((y) => matrix[y][x]);

  // 2x2 same-color blocks
  for (let y = 0; y < qrsize - 1; y++) {
    for (let x = 0; x < qrsize - 1; x++) {
      const color = matrix[y][x];
      if (color === matrix[y][x + 1] && color === matrix[y + 1][x] && color === matrix[y + 1][x + 1]) {
        result += PENALTY_N2;
      }
    }
  }

  // Dark/light balance
  let dark = 0;
  for (let y = 0; y < qrsize; y++) {
    for (let x = 0; x < qrsize; x++) {
      if (matrix[y][x]) dark++;
    }
  }
  const total = qrsize * qrsize;
  const k = Math.floor((Math.abs(dark * 20 - total * 10) + total - 1) / total) - 1;
  result += k * PENALTY_N4;

  return result;
}

/* ---- Top-level encode ---- */

/**
 * Full encode: text -> module matrix (1 = dark), choosing the best mask.
 * @param {string} text
 * @param {{ ecLevel?: 'L' | 'M' | 'Q' | 'H' }} [opts]
 */
export function generateMatrix(text, opts = {}) {
  if (!text) throw new Error('no text to encode');
  const ecLevel = opts.ecLevel ?? 'M';
  if (!EC_LEVELS.includes(ecLevel)) throw new Error(`unknown EC level: ${ecLevel}`);

  const mode = getMode(text);
  const version = getVersion(text, mode, ecLevel);
  if (version === -1) throw new Error('text too long for QR code');

  const size = getMatrixSize(version);
  const matrix = Array(size).fill(null).map(() => Array(size).fill(null));

  drawFinderPatterns(matrix, size);
  drawAlignmentPatterns(matrix, version);
  drawTimingPattern(matrix, size);
  drawDarkModule(matrix, version);
  drawVersionInfo(matrix, version);

  const dataBytes = encodeDataCodewords(text, version, mode, ecLevel);
  const allBytes = addEccAndInterleave(dataBytes, version, ecLevel);
  placeData(matrix, size, bytesToBits(allBytes), version);

  // Remainder modules (non-multiple-of-8 capacities) are light.
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === null || matrix[r][c] === undefined) matrix[r][c] = 0;
    }
  }

  // Choose the mask with the lowest penalty score.
  let bestMask = 0;
  let bestPenalty = Infinity;
  for (let m = 0; m < 8; m++) {
    applyMask(matrix, size, version, m);
    drawFormatInfo(matrix, size, ecLevel, m);
    const penalty = getPenaltyScore(matrix);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestMask = m;
    }
    applyMask(matrix, size, version, m); // undo (XOR is self-inverse)
  }
  applyMask(matrix, size, version, bestMask);
  drawFormatInfo(matrix, size, ecLevel, bestMask);

  return { matrix, size, version, mode, ecLevel, mask: bestMask };
}

/* ---- Text rendering (CLI) ---- */

/**
 * Render a matrix as text. Unicode half blocks by default (two module rows
 * per character row); ascii=true uses two chars per module. A quiet zone
 * is added around the code (terminal backgrounds vary).
 * @param {Matrix} matrix
 * @param {{ ascii?: boolean, quiet?: number }} opts
 */
export function renderText(matrix, opts = {}) {
  const ascii = opts.ascii ?? false;
  const quiet = opts.quiet ?? 2;
  const size = matrix.length;
  const rows = size + quiet * 2;
  const cols = size + quiet * 2;
  const dark = (/** @type {number} */ r, /** @type {number} */ c) => {
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
