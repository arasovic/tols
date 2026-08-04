/**
 * Svelte action: accept a dropped text file on an input element.
 * Usage: <textarea use:fileDrop={{ onText: (text, name) => ... }} />
 */

/** Refuse drops above this size to keep the UI responsive. */
export const MAX_DROP_BYTES = 5 * 1024 * 1024

/**
 * @param {DragEvent} event
 * @returns {boolean}
 */
function hasFiles(event) {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files')
}

/**
 * @param {HTMLElement} node
 * @param {{
 *   onText?: (text: string, fileName: string) => void,
 *   onError?: (message: string) => void
 * }} options
 */
export function fileDrop(node, options) {
  let opts = options

  /** @param {DragEvent} event */
  function handleDragOver(event) {
    if (!hasFiles(event)) return
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
    node.classList.add('drag-over')
  }

  /** @param {DragEvent} event */
  function handleDragLeave(event) {
    if (!hasFiles(event)) return
    node.classList.remove('drag-over')
  }

  /** @param {DragEvent} event */
  async function handleDrop(event) {
    if (!hasFiles(event)) return
    event.preventDefault()
    node.classList.remove('drag-over')

    const file = event.dataTransfer?.files?.[0]
    if (!file) return

    if (file.size > MAX_DROP_BYTES) {
      opts.onError?.(`File is too large (max ${MAX_DROP_BYTES / 1024 / 1024}MB).`)
      return
    }

    try {
      const text = await file.text()
      opts.onText?.(text, file.name)
    } catch {
      opts.onError?.('Could not read the dropped file.')
    }
  }

  node.addEventListener('dragover', handleDragOver)
  node.addEventListener('dragleave', handleDragLeave)
  node.addEventListener('drop', handleDrop)

  return {
    /** @param {typeof options} newOptions */
    update(newOptions) {
      opts = newOptions
    },
    destroy() {
      node.removeEventListener('dragover', handleDragOver)
      node.removeEventListener('dragleave', handleDragLeave)
      node.removeEventListener('drop', handleDrop)
    }
  }
}
