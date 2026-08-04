/**
 * Base64 core — behavior ported from apps/web Base64Tool.svelte.
 * Decode strips all whitespace first (matches web UX).
 * Uses btoa/atob + TextEncoder (global in browsers and Node >= 16) so the
 * module works in both the CLI and the browser bundle.
 */

/** @param {string} text */
export function encode(text) {
  const bytes = new TextEncoder().encode(String(text));
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** @param {string} b64 */
export function decode(b64) {
  const cleaned = String(b64).replace(/\s/g, '');
  if (!isValid(cleaned)) {
    throw new Error('Invalid Base64 string');
  }
  const binString = atob(cleaned);
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

/** @param {string} s */
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
