/**
 * JWT core — decode ported from apps/web utils/crypto.js (decodeJWT),
 * HS256 encode ported from JwtEncoderTool.svelte.
 * Browser-safe: btoa/atob + TextEncoder only (no Buffer).
 */

/** @param {string} str */
export function base64UrlEncode(str) {
  const bytes = new TextEncoder().encode(String(str));
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/** @param {string} str */
function base64urlToBase64(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return base64;
}

/**
 * Decode a base64url JWT segment into a UTF-8 object.
 * atob yields a binary string; TextDecoder is required so multi-byte UTF-8
 * payloads survive (plain JSON.parse(atob(x)) corrupts them).
 * @param {string} segment
 * @returns {Record<string, unknown>}
 */
function decodeSegment(segment) {
  const binString = atob(base64urlToBase64(segment));
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return JSON.parse(new TextDecoder('utf-8').decode(bytes));
}

/**
 * @param {string} message
 * @param {string} secret
 * @returns {Promise<string>}
 */
export async function signHS256(message, secret) {
  try {
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
    const bytes = new Uint8Array(signature);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } catch (/** @type {any} */ e) {
    throw new Error(`HMAC signing failed: ${e.message}`);
  }
}

/**
 * Decode without verifying. Throws on malformed tokens.
 * @param {string} token
 * @returns {{ header: Record<string, unknown>, payload: Record<string, unknown>, signature: string }}
 */
export function decode(token) {
  if (!token || typeof token !== 'string' || !token.trim()) {
    throw new Error('Please enter a JWT token');
  }

  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format: expected 3 parts separated by dots');
  }

  let header;
  let payload;
  try {
    header = decodeSegment(parts[0]);
  } catch {
    throw new Error('Invalid JWT header: unable to decode Base64 or parse JSON');
  }
  try {
    payload = decodeSegment(parts[1]);
  } catch {
    throw new Error('Invalid JWT payload: unable to decode Base64 or parse JSON');
  }

  return { header, payload, signature: parts[2] };
}

/**
 * Encode + sign an HS256 JWT. header/payload may be objects or JSON strings.
 * @param {object | string} header
 * @param {object | string} payload
 * @param {string} secret
 * @returns {Promise<string>}
 */
export async function encode(header, payload, secret) {
  const headerStr = typeof header === 'string' ? header : JSON.stringify(header);
  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  // String inputs must be valid JSON; an empty segment would produce a
  // token that cannot be decoded.
  try {
    JSON.parse(headerStr);
  } catch {
    throw new Error('Invalid header JSON');
  }
  try {
    JSON.parse(payloadStr);
  } catch {
    throw new Error('Invalid payload JSON');
  }
  const encodedHeader = base64UrlEncode(headerStr);
  const encodedPayload = base64UrlEncode(payloadStr);
  const message = `${encodedHeader}.${encodedPayload}`;
  const signature = await signHS256(message, secret);
  return `${message}.${signature}`;
}

/**
 * Web-compatible shape: resolves { valid, header, payload, signature } or { valid: false, error }.
 * @param {string} token
 * @returns {Promise<{ valid: boolean, header?: Record<string, unknown>, payload?: Record<string, unknown>, signature?: string, error?: string }>}
 */
export async function decodeJWT(token) {
  try {
    return { valid: true, ...decode(token) };
  } catch (/** @type {any} */ e) {
    return { valid: false, error: e.message };
  }
}
