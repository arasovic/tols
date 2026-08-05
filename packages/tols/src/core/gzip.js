/**
 * Gzip core — compression behavior ported from apps/web GzipTool.svelte.
 * Uses the web-standard CompressionStream/DecompressionStream, global in
 * browsers and Node >= 18, so the module works in CLI and browser alike.
 */

/** @param {Uint8Array[]} chunks */
function concat(chunks) {
  const total = chunks.reduce((acc, c) => acc + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

/** @param {Uint8Array} bytes */
export function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** @param {string} b64 */
export function base64ToBytes(b64) {
  const cleaned = String(b64).replace(/\s/g, '');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned) || cleaned.length % 4 === 1) {
    throw new Error('Invalid Base64 string');
  }
  const binString = atob(cleaned);
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return bytes;
}

/** @param {string} text */
export async function gzip(text) {
  const data = new TextEncoder().encode(String(text));
  return runStream(new CompressionStream('gzip'), data);
}

/** @param {Uint8Array} bytes */
export async function gunzip(bytes) {
  return runStream(new DecompressionStream('gzip'), bytes);
}

/**
 * Pump `data` through a (De)CompressionStream and collect the output.
 * The writer's rejections are swallowed on purpose: when the stream fails
 * (e.g. corrupt gzip input) the authoritative error surfaces on the
 * readable side, which we translate into a stable message.
 *
 * @param {CompressionStream | DecompressionStream} stream
 * @param {Uint8Array} data
 */
async function runStream(stream, data) {
  const reader = stream.readable.getReader();
  const drained = drain(reader);
  const writer = stream.writable.getWriter();
  try {
    await writer.write(data);
    await writer.close();
  } catch {
    // Error is reported by drain() below.
  }
  return drained;
}

/** @param {ReadableStreamDefaultReader<Uint8Array>} reader */
async function drain(reader) {
  /** @type {Uint8Array[]} */
  const chunks = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
  } catch (e) {
    throw new Error('invalid gzip data');
  }
  return concat(chunks);
}

/** @param {Uint8Array} bytes */
export function toText(bytes) {
  return new TextDecoder('utf-8').decode(bytes);
}

/**
 * @param {number} originalBytes
 * @param {number} compressedBytes
 */
export function ratio(originalBytes, compressedBytes) {
  if (originalBytes <= 0) return 0;
  return Number((((originalBytes - compressedBytes) / originalBytes) * 100).toFixed(1));
}
