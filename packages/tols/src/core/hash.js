/**
 * Hash core — SHA family via WebCrypto (global in Node >= 19), MD5 is a
 * self-contained implementation ported verbatim from apps/web utils/crypto.js.
 */

export const ALGORITHMS = ['md5', 'sha1', 'sha256', 'sha512'];

export async function hash(text, algo) {
  if (algo === 'md5') return hashMD5(text);
  const subtleAlgo = { sha1: 'SHA-1', sha256: 'SHA-256', sha512: 'SHA-512' }[algo];
  if (!subtleAlgo) throw new Error(`unknown algorithm: ${algo} (valid: ${ALGORITHMS.join(', ')})`);
  const data = new TextEncoder().encode(String(text));
  const hashBuffer = await crypto.subtle.digest(subtleAlgo, data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function leftRotate(value, shift) {
  return (value << shift) | (value >>> (32 - shift));
}

export async function hashMD5(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  const byteArray = new Uint8Array(data);
  const originalLength = byteArray.length;
  const bitLength = originalLength * 8;

  const paddedLength = Math.ceil((originalLength + 8) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(byteArray);

  padded[originalLength] = 0x80;

  padded[paddedLength - 8] = bitLength & 0xff;
  padded[paddedLength - 7] = (bitLength >>> 8) & 0xff;
  padded[paddedLength - 6] = (bitLength >>> 16) & 0xff;
  padded[paddedLength - 5] = (bitLength >>> 24) & 0xff;
  padded[paddedLength - 4] = 0;
  padded[paddedLength - 3] = 0;
  padded[paddedLength - 2] = 0;
  padded[paddedLength - 1] = 0;

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];

  for (let i = 0; i < paddedLength; i += 64) {
    const M = new Array(16);
    for (let j = 0; j < 16; j++) {
      const idx = i + j * 4;
      M[j] = (
        padded[idx] |
        (padded[idx + 1] << 8) |
        (padded[idx + 2] << 16) |
        (padded[idx + 3] << 24)
      ) >>> 0;
    }

    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;

    for (let j = 0; j < 64; j++) {
      let F, g;
      if (j < 16) {
        F = (B & C) | (~B & D);
        g = j;
      } else if (j < 32) {
        F = (D & B) | (~D & C);
        g = (5 * j + 1) % 16;
      } else if (j < 48) {
        F = B ^ C ^ D;
        g = (3 * j + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * j) % 16;
      }

      const K = Math.floor(Math.abs(Math.sin(j + 1)) * 0x100000000) >>> 0;
      F = (F + A + K + M[g]) >>> 0;
      A = D;
      D = C;
      C = B;
      B = (B + leftRotate(F, s[j])) >>> 0;
    }

    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }

  const hashArray = [
    a0 & 0xff, (a0 >>> 8) & 0xff, (a0 >>> 16) & 0xff, (a0 >>> 24) & 0xff,
    b0 & 0xff, (b0 >>> 8) & 0xff, (b0 >>> 16) & 0xff, (b0 >>> 24) & 0xff,
    c0 & 0xff, (c0 >>> 8) & 0xff, (c0 >>> 16) & 0xff, (c0 >>> 24) & 0xff,
    d0 & 0xff, (d0 >>> 8) & 0xff, (d0 >>> 16) & 0xff, (d0 >>> 24) & 0xff,
  ];

  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
