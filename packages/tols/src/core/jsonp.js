/**
 * JSONP core — behavior ported from apps/web JsonpTool.svelte.
 * Same URL/callback validation. The web HTML-escapes values because it
 * renders the tag inside the page; the CLI emits the real artifact, so
 * no display escaping is applied here.
 */

/** @param {string} value */
export function isValidCallback(value) {
  if (!value) return true;
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(value);
}

/** @param {string} value */
export function isValidUrl(value) {
  if (!value) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Wrap a JSON payload in a callback: `cb({"a":1})`.
 * Throws on invalid JSON with the web's message.
 * @param {string} callback
 * @param {string} jsonPayload
 */
export function wrapResponse(callback, jsonPayload) {
  let data;
  try {
    data = JSON.parse(jsonPayload);
  } catch {
    throw new Error('Invalid JSON response');
  }
  return `${callback}(${JSON.stringify(data)})`;
}

/**
 * @param {string} url
 * @param {string} callback
 */
export function scriptTag(url, callback) {
  return `<script src="${url}?callback=${callback}"></script>`;
}
