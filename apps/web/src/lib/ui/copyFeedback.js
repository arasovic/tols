// apps/web/src/lib/ui/copyFeedback.js
import { copyToClipboard } from '$lib/utils/clipboard.js'

/** @typedef {'idle' | 'copied' | 'failed'} CopyStatus */

/** How long a copied/failed state stays visible before reverting to idle. */
export const COPY_FEEDBACK_MS = 1200

/**
 * The one copy path every workbench affordance goes through.
 *
 * Two things it guarantees, both of which were bugs when each call site rolled
 * its own: an empty payload never reaches the clipboard (silently replacing
 * whatever the user had copied with `''`), and every copy — success or failure
 * — produces a visible state the caller can render.
 *
 * `copyToClipboard` resolves to `{ success, error? }`, never a boolean.
 *
 * @param {(status: CopyStatus) => void} report Called with each state change.
 * @param {number} [resetMs]
 */
export function createCopyFeedback(report, resetMs = COPY_FEEDBACK_MS) {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer

  return {
    /**
     * @param {string} text
     * @returns {Promise<boolean>} false when nothing was written
     */
    async copy(text) {
      if (!text) return false
      const result = await copyToClipboard(text)
      clearTimeout(timer)
      report(result.success ? 'copied' : 'failed')
      timer = setTimeout(() => report('idle'), resetMs)
      return result.success
    },
    dispose() {
      clearTimeout(timer)
    }
  }
}
