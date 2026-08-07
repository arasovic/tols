/**
 * Password core — behavior ported from apps/web PasswordTool.svelte.
 * Same charsets, length bounds, rejection-sampled crypto randomness, and
 * entropy math as the web tool. crypto.getRandomValues is global in
 * browsers and Node >= 19.
 */

export const MIN_LENGTH = 8;
export const MAX_LENGTH = 64;
export const DEFAULT_LENGTH = 16;

export const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
export const NUMBERS = '0123456789';
export const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/**
 * @param {{ upper?: boolean, lower?: boolean, numbers?: boolean, symbols?: boolean }} opts
 */
export function buildCharset(opts) {
  let charset = '';
  if (opts.lower) charset += LOWERCASE;
  if (opts.upper) charset += UPPERCASE;
  if (opts.numbers) charset += NUMBERS;
  if (opts.symbols) charset += SYMBOLS;
  return charset;
}

/** Unbiased index in [0, max) via rejection sampling (web parity). */
/** @param {number} max */
export function randomIndex(max) {
  const buf = new Uint32Array(1);
  const maxValid = Math.floor(2 ** 32 / max) * max;
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= maxValid);
  return buf[0] % max;
}

/**
 * @param {number} length
 * @param {{ upper?: boolean, lower?: boolean, numbers?: boolean, symbols?: boolean }} opts
 * @returns {{ password: string, entropy: number, charsetSize: number }}
 */
export function generate(length, opts) {
  const charset = buildCharset(opts);
  if (charset === '') {
    throw new Error('Please select at least one character type');
  }
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomIndex(charset.length)];
  }
  return { password, entropy: Math.log2(charset.length) * length, charsetSize: charset.length };
}

/** @param {number} entropyBits */
export function entropyLabel(entropyBits) {
  if (entropyBits < 50) return 'Weak';
  if (entropyBits < 80) return 'Fair';
  if (entropyBits < 120) return 'Strong';
  return 'Very Strong';
}
