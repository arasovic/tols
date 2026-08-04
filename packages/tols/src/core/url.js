/**
 * URL encoding core — behavior ported from apps/web UrlTool.svelte.
 */

export function encode(text) {
  return encodeURIComponent(String(text));
}

export function decode(text) {
  try {
    return decodeURIComponent(String(text));
  } catch {
    throw new Error('Invalid input for URL decoding');
  }
}

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
