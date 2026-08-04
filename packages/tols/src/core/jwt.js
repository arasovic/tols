/**
 * JWT core — decode ported from apps/web utils/crypto.js (decodeJWT),
 * HS256 encode ported from JwtEncoderTool.svelte.
 */

/** @param {string} str */
export function base64UrlEncode(str) {
  return Buffer.from(String(str), 'utf8').toString('base64url');
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
    return Buffer.from(new Uint8Array(signature)).toString('base64url');
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
    header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
  } catch {
    throw new Error('Invalid JWT header: unable to decode Base64 or parse JSON');
  }
  try {
    payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
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
