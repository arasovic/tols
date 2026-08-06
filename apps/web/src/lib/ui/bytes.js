// apps/web/src/lib/ui/bytes.js

/**
 * Human byte count for a pane header, e.g. `18 B` / `1.4 KB`.
 *
 * Shared rather than per-tool: every converted tool renders this label, and a
 * private copy in each is one rounding per tool, all of which drift the first
 * time the KB threshold or precision is touched.
 *
 * @param {string} value
 * @returns {string}
 */
export function byteLabel(value) {
  const bytes = new TextEncoder().encode(value ?? '').length
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}
