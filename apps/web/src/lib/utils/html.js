/** @type {Record<string, string>} */
const htmlEntities = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}

/**
 * Escape HTML special characters so untrusted strings can be safely
 * interpolated into markup via {@html ...}.
 * @param {string} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return value.replace(/[&<>"']/g, c => htmlEntities[c] ?? c)
}