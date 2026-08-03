/**
 * @param {string} text
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return { success: true }
  } catch (/** @type {any} */ err) {
    // Rejections are not always Error instances (e.g. DOMException, strings);
    // always surface a usable message.
    const message = err && typeof err.message === 'string' && err.message
      ? err.message
      : 'Failed to copy to clipboard'
    return { success: false, error: message }
  }
}
