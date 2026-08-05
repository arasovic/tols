/**
 * Base converter core — behavior ported from apps/web BaseConverterTool.svelte.
 * Converts integers between decimal, binary, hex, octal with the same
 * validation limits (Number.MAX_SAFE_INTEGER) and hex-uppercasing as the web.
 */

export const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;

/** @typedef {'dec' | 'bin' | 'hex' | 'oct'} BaseName */

const RADIX = { dec: 10, bin: 2, hex: 16, oct: 8 };
const PREFIX = { '0x': 'hex', '0b': 'bin', '0o': 'oct' };

/**
 * Guess the base from a prefix (0x/0b/0o, case-insensitive); plain digits
 * default to decimal. Returns { base, value } with the prefix stripped.
 * @param {string} raw
 */
export function detect(raw) {
  const v = String(raw).trim();
  const lower = v.toLowerCase();
  for (const [p, base] of Object.entries(PREFIX)) {
    if (lower.startsWith(p)) return { base: /** @type {BaseName} */ (base), value: v.slice(2) };
    if (lower.startsWith('-' + p)) return { base: /** @type {BaseName} */ (base), value: '-' + v.slice(3) };
  }
  return { base: 'dec', value: v };
}

/**
 * @param {string} value digits (prefix already stripped)
 * @param {BaseName} from
 * @returns {number}
 */
export function parse(value, from) {
  if (!RADIX[from]) throw new Error(`unknown base: ${from} (valid: dec, bin, hex, oct)`);
  const trimmed = String(value).trim();
  if (trimmed === '' || trimmed === '-') throw new Error(`Invalid ${nameOf(from)} number`);
  const num = parseInt(trimmed, RADIX[from]);
  if (num > MAX_SAFE_INTEGER) {
    throw new Error(`Number exceeds maximum safe integer (${MAX_SAFE_INTEGER})`);
  }
  // parseInt('12abc') happily returns 12; the web tool's field validators
  // are stricter, so reject trailing garbage via a round-trip check.
  if (isNaN(num) || !roundTrips(trimmed, num, from)) {
    throw new Error(`Invalid ${nameOf(from)} number`);
  }
  return num;
}

function roundTrips(trimmed, num, from) {
  // A value round-trips when formatting it back in the same base yields the
  // input again (ignoring leading zeros and case).
  const sign = trimmed.startsWith('-') ? '-' : '';
  const body = trimmed.replace(/^-/, '').replace(/^0+(?=.)/, '');
  const back = Math.abs(num).toString(RADIX[from]);
  return (sign + body).toLowerCase() === (sign + back).toLowerCase();
}

/** @param {BaseName} b */
function nameOf(b) {
  return { dec: 'decimal', bin: 'binary', hex: 'hexadecimal', oct: 'octal' }[b];
}

/**
 * @param {number} num
 * @returns {{ dec: string, bin: string, hex: string, oct: string }}
 */
export function formatAll(num) {
  return {
    dec: num.toString(10),
    bin: num.toString(2),
    hex: num.toString(16).toUpperCase(),
    oct: num.toString(8),
  };
}

/**
 * One-shot convert: `convert('0xff')`, `convert('1010', { from: 'bin' })`.
 * @param {string} input
 * @param {{ from?: BaseName }} [opts]
 */
export function convert(input, { from } = {}) {
  const detected = detect(input);
  const base = from ?? detected.base;
  // Prefixes are stripped even with an explicit --from (0xff --from=hex):
  // the prefix is syntax, the --from flag decides the radix.
  const num = parse(detected.value, base);
  return { from: base, value: num, ...formatAll(num) };
}
