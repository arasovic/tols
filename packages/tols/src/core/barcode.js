/**
 * Barcode core — Code128 encoder ported from apps/web BarcodeTool.svelte.
 * One deliberate fix: the web used set C for any all-digit input >= 4
 * chars, but set C encodes digit PAIRS — odd-length input silently
 * corrupted the last digit ('12345' decoded as '123405'). Odd-length
 * digit strings now use set B, which is always correct.
 * Rendering is SVG (web draws to canvas) with the same module geometry.
 */

export const MAX_INPUT_LENGTH = 100;
export const MODULE_WIDTH = 2;
export const MODULE_HEIGHT = 100;
export const QUIET_ZONE = 10;

export const INVALID_CHARS_MESSAGE = 'Invalid characters detected. Only printable ASCII characters (32-127) are supported for Code128.';
export const EMPTY_INPUT_MESSAGE = 'Please enter text to encode';
export const TOO_LONG_MESSAGE = `Input too long. Maximum ${MAX_INPUT_LENGTH} characters allowed.`;

export const CODE128 = {
  START_A: 103,
  START_B: 104,
  START_C: 105,
  STOP: 106,

  patterns: [
    '11011001100', '11001101100', '11001100110', '10010011000', '10010001100',
    '10001001100', '10011001000', '10011000100', '10001100100', '11001001000',
    '11001000100', '11000100100', '10110011100', '10011011100', '10011001110',
    '10111001100', '10011101100', '10011100110', '11001110010', '11001011100',
    '11001001110', '11011100100', '11001110100', '11101101110', '11101001100',
    '11100101100', '11100100110', '11101100100', '11100110100', '11100110010',
    '11011011000', '11011000110', '11000110110', '10100011000', '10001011000',
    '10001000110', '10110001000', '10001101000', '10001100010', '11010001000',
    '11000101000', '11000100010', '10110111000', '10110001110', '10001101110',
    '10111011000', '10111000110', '10001110110', '11101110110', '11010001110',
    '11000101110', '11011101000', '11011100010', '11011101110', '11101011000',
    '11101000110', '11100010110', '11101101000', '11101100010', '11100011010',
    '11101111010', '11001000010', '11110001010', '10100110000', '10100001100',
    '10010110000', '10010000110', '10000101100', '10000100110', '10110010000',
    '10110000100', '10011010000', '10011000010', '10000110100', '10000110010',
    '11000010010', '11001010000', '11110111010', '11000010100', '10001111010',
    '10100111100', '10010111100', '10010011110', '10111100100', '10011110100',
    '10011110010', '11110100100', '11110010100', '11110010010', '11011011110',
    '11011110110', '11110110110', '10101111000', '10100011110', '10001011110',
    '10111101000', '10111100010', '11110101000', '11110100010', '10111011110',
    '10111101110', '11101011110', '11110101110', '11010000100', '11010010000',
    '11010011100', '11000111010',
  ],
};

/**
 * @param {string} char
 * @param {'A' | 'B'} set
 */
export function getCode128Value(char, set) {
  const code = char.charCodeAt(0);
  if (set === 'A') {
    if (code >= 0 && code <= 31) return code + 64;
    if (code >= 32 && code <= 95) return code - 32;
    return -1;
  }
  if (set === 'B') {
    if (code >= 32 && code <= 127) return code - 32;
    return -1;
  }
  return -1;
}

/** @param {string} text */
export function determineSet(text) {
  if (!text || text.length === 0) return 'B';
  const hasOnlyDigits = /^\d+$/.test(text);
  const hasControlChars = /[\x00-\x1F]/.test(text);
  if (hasControlChars) return 'A';
  // Set C needs digit pairs; odd-length input would corrupt the last digit
  // (web bug), so only even-length digit runs qualify.
  if (hasOnlyDigits && text.length >= 4 && text.length % 2 === 0) return 'C';
  return 'B';
}

/**
 * @param {string} text
 * @returns {{ valid: boolean, message: string }}
 */
export function validateInput(text) {
  if (!text || text.trim().length === 0) {
    return { valid: false, message: EMPTY_INPUT_MESSAGE };
  }
  if (text.length > MAX_INPUT_LENGTH) {
    return { valid: false, message: TOO_LONG_MESSAGE };
  }
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 32 || code > 127) {
      return { valid: false, message: INVALID_CHARS_MESSAGE };
    }
  }
  return { valid: true, message: '' };
}

/**
 * @param {string} text
 * @returns {{ char: string, index: number, code: number }[]}
 */
export function findInvalidCharacters(text) {
  const invalid = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 32 || code > 127) {
      invalid.push({ char: text[i], index: i, code });
    }
  }
  return invalid;
}

/**
 * Encode to Code128 symbol values (start, data, checksum, stop).
 * @param {string} text
 * @returns {number[]}
 */
export function encodeCode128(text) {
  const set = determineSet(text);
  const values = [];

  if (set === 'A') values.push(CODE128.START_A);
  else if (set === 'B') values.push(CODE128.START_B);
  else values.push(CODE128.START_C);

  if (set === 'C') {
    for (let i = 0; i < text.length; i += 2) {
      const pair = parseInt(text.substring(i, i + 2), 10);
      values.push(pair);
    }
  } else {
    for (let i = 0; i < text.length; i++) {
      const val = getCode128Value(text[i], set);
      if (val >= 0) {
        values.push(val);
      }
    }
  }

  let checksum = values[0];
  for (let i = 1; i < values.length; i++) {
    checksum += values[i] * i;
  }
  checksum = checksum % 103;
  values.push(checksum);

  values.push(CODE128.STOP);

  return values;
}

/** Escape for embedding text in an SVG document. */
export function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Render Code128 values as an SVG string with the web's geometry
 * (module width/height, quiet zone, human-readable label below).
 * @param {number[]} values
 * @param {string} label
 */
export function renderSvg(values, label) {
  const totalWidth = values.length * 11 * MODULE_WIDTH + QUIET_ZONE * 2;
  const totalHeight = MODULE_HEIGHT + 40;

  const rects = [];
  let x = QUIET_ZONE;
  for (const val of values) {
    const pattern = CODE128.patterns[val];
    if (pattern) {
      for (let i = 0; i < pattern.length; i++) {
        if (pattern[i] === '1') {
          rects.push(`<rect x="${x + i * MODULE_WIDTH}" y="0" width="${MODULE_WIDTH}" height="${MODULE_HEIGHT}" fill="#000"/>`);
        }
      }
      x += 11 * MODULE_WIDTH;
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">`,
    `  <rect width="${totalWidth}" height="${totalHeight}" fill="#fff"/>`,
    ...rects,
    `  <text x="${totalWidth / 2}" y="${MODULE_HEIGHT + 25}" fill="#000" font-family="monospace" font-size="14" text-anchor="middle">${escapeXml(label)}</text>`,
    '</svg>',
  ].join('\n');
}

/**
 * One-shot: validate, encode, render.
 * @param {string} text
 * @returns {{ svg: string, values: number[], set: string, width: number }}
 */
export function generate(text) {
  const validation = validateInput(text);
  if (!validation.valid) {
    const invalid = findInvalidCharacters(text);
    let message = validation.message;
    if (invalid.length > 0) {
      const details = invalid.slice(0, 3).map((c) => `'${c.char}' (char ${c.code}) at pos ${c.index}`).join(', ');
      message += ` Problem at: ${details}${invalid.length > 3 ? '...' : ''}`;
    }
    throw new Error(message);
  }
  const values = encodeCode128(text);
  const width = values.length * 11 * MODULE_WIDTH + QUIET_ZONE * 2;
  return { svg: renderSvg(values, text), values, set: determineSet(text), width };
}
