/**
 * Base64 core — behavior ported from apps/web Base64Tool.svelte.
 * Decode strips all whitespace first (matches web UX).
 */

export function encode(text) {
  return Buffer.from(String(text), 'utf8').toString('base64');
}

export function decode(b64) {
  const cleaned = String(b64).replace(/\s/g, '');
  if (!isValid(cleaned)) {
    throw new Error('Invalid Base64 string');
  }
  return Buffer.from(cleaned, 'base64').toString('utf8');
}

export function isValid(s) {
  const str = String(s);
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(str)) return false;
  // a lone leftover char (len % 4 === 1) can never be valid base64
  if (str.length % 4 === 1) return false;
  const withoutPadding = str.replace(/=+$/, '');
  const padding = str.length - withoutPadding.length;
  // unpadded (any valid length) or padded to a multiple of 4
  return padding === 0 || str.length % 4 === 0;
}
