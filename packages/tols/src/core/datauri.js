/**
 * Data URI core — behavior ported from apps/web DataUriTool.svelte.
 * Pure bytes<->data-URI transforms (fs access lives in the CLI adapter so
 * this module stays browser-safe). Same extension->mime map as the web.
 */

const MIME_MAP = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  pdf: 'application/pdf',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  txt: 'text/plain',
  json: 'application/json',
  html: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
};

/** @param {string} filename */
export function inferMimeType(filename) {
  const ext = (String(filename).split('.').pop() || '').toLowerCase();
  return /** @type {Record<string, string>} */ (MIME_MAP)[ext] || 'application/octet-stream';
}

/** @param {Uint8Array} bytes */
function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** @param {string} b64 */
function base64ToBytes(b64) {
  const binString = atob(b64);
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return bytes;
}

/**
 * @param {Uint8Array} bytes
 * @param {string} mime
 */
export function bytesToDataUri(bytes, mime) {
  return `data:${mime};base64,${bytesToBase64(bytes)}`;
}

/**
 * Parse a data URI. Supports base64 and percent-encoded payloads.
 * @param {string} uri
 * @returns {{ mime: string, encoding: 'base64' | 'plain', bytes: Uint8Array }}
 */
export function parseDataUri(uri) {
  const m = String(uri).trim().match(/^data:([^,]*),(.*)$/s);
  if (!m) throw new Error('Invalid data URI');
  const meta = m[1];
  const payload = m[2];
  const isBase64 = /;base64$/i.test(meta);
  const mime = (isBase64 ? meta.slice(0, -7) : meta) || 'text/plain';
  if (isBase64) {
    try {
      return { mime, encoding: 'base64', bytes: base64ToBytes(payload.replace(/\s/g, '')) };
    } catch {
      throw new Error('Invalid base64 payload in data URI');
    }
  }
  try {
    const decoded = decodeURIComponent(payload);
    const bytes = new TextEncoder().encode(decoded);
    return { mime, encoding: 'plain', bytes };
  } catch {
    throw new Error('Invalid percent-encoded payload in data URI');
  }
}
