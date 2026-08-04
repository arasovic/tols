/**
 * Shareable links: tool state is encoded into the URL fragment (#s=...).
 * Fragments are never sent to the server, so the privacy posture holds —
 * nothing leaves the browser.
 *
 * Encoding: JSON → UTF-8 bytes → base64url (no padding). Values must be
 * strings; anything else is rejected on decode.
 */

const PREFIX = 's='

/** Links beyond this size are refused (pre-agreed limit). */
export const MAX_ENCODED_LENGTH = 50_000

/**
 * Encode tool state for a share link.
 * @param {Record<string, string>} state
 * @returns {string | null} encoded string, or null when over the size limit
 */
export function encodeShareState(state) {
  try {
    const json = JSON.stringify(state)
    const bytes = new TextEncoder().encode(json)
    let binary = ''
    for (const byte of bytes) {
      binary += String.fromCharCode(byte)
    }
    const encoded = btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    if (encoded.length > MAX_ENCODED_LENGTH) return null
    return encoded
  } catch {
    return null
  }
}

/**
 * Decode a share fragment payload. Only plain objects with string values
 * are accepted — tool state never contains anything else.
 * @param {string} encoded
 * @returns {Record<string, string> | null}
 */
export function decodeShareState(encoded) {
  try {
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) base64 += '='
    const binary = atob(base64)
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
    const parsed = JSON.parse(new TextDecoder().decode(bytes))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    for (const value of Object.values(parsed)) {
      if (typeof value !== 'string') return null
    }
    return /** @type {Record<string, string>} */ (parsed)
  } catch {
    return null
  }
}

/**
 * Read and decode the share payload from the current URL fragment.
 * @returns {Record<string, string> | null}
 */
export function readShareFragment() {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash
  if (!hash.startsWith(`#${PREFIX}`)) return null
  return decodeShareState(hash.slice(1 + PREFIX.length))
}

/**
 * Build the absolute share URL for an encoded payload on the current page.
 * @param {string} encoded
 * @returns {string}
 */
export function buildShareUrl(encoded) {
  return `${window.location.origin}${window.location.pathname}#${PREFIX}${encoded}`
}
