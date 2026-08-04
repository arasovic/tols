/**
 * URL encoding core — behavior ported from apps/web UrlTool.svelte.
 */

/** @param {string} text */
export function encode(text) {
  return encodeURIComponent(String(text));
}

/** @param {string} text */
export function decode(text) {
  try {
    return decodeURIComponent(String(text));
  } catch {
    throw new Error('Invalid input for URL decoding');
  }
}

/**
 * @typedef {{ key: string, value: string }} UrlParam
 * @typedef {{ href: string, protocol: string, host: string, pathname: string, params: UrlParam[], hash: string }} UrlParts
 */

/**
 * @param {string} raw
 * @returns {UrlParts}
 */
export function analyze(raw) {
  let url;
  try {
    url = new URL(String(raw).trim());
  } catch {
    throw new Error('Invalid URL format');
  }
  const params = [...new URLSearchParams(url.search)].map(([key, value]) => ({ key, value }));
  return {
    href: url.href,
    protocol: url.protocol.replace(/:$/, ''),
    host: url.host,
    pathname: url.pathname,
    params,
    hash: url.hash,
  };
}
