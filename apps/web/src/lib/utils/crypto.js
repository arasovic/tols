/**
 * Thin delegation layer over the shared `tols` core so web and CLI never
 * diverge. Kept because web tests and (historically) components import it.
 */
import { generate as coreGenerate } from 'tols/core/uuid'
import { hash as coreHash, hashMD5 } from 'tols/core/hash'
import { decodeJWT } from 'tols/core/jwt'

export { hashMD5, decodeJWT }

/**
 * @returns {string}
 */
export function generateUUID() {
  return coreGenerate(1)[0]
}

/**
 * @param {number} count
 * @returns {string[]}
 */
export function generateUUIDs(count) {
  return coreGenerate(count)
}

/**
 * @param {string} message
 * @param {string} algorithm WebCrypto style, e.g. 'SHA-256'
 * @returns {Promise<string>}
 */
export async function hashMessage(message, algorithm) {
  return coreHash(message, String(algorithm).replace('-', '').toLowerCase())
}
