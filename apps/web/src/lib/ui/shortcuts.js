// apps/web/src/lib/ui/shortcuts.js

/** The locked keyboard model. Every glyph here is also rendered in the UI. */
export const SHORTCUTS = {
  palette: '⌘K',
  sidebar: '⌘B',
  run: '⌘⏎',
  copyCommand: '⌘⇧C',
  copyOutput: '⌘⇧O',
  close: 'Esc'
}

/**
 * Maps a keydown event onto a named action and invokes the matching handler.
 * Unregistered actions are silently ignored, so a page only opts into what it supports.
 *
 * @param {KeyboardEvent} event
 * @param {Partial<Record<keyof typeof SHORTCUTS, () => void>>} handlers
 * @returns {boolean} true when an action fired
 */
export function dispatchShortcut(event, handlers) {
  const mod = event.metaKey || event.ctrlKey
  /** @type {keyof typeof SHORTCUTS | undefined} */
  let action

  if (event.key === 'Escape') action = 'close'
  else if (!mod) action = undefined
  else if (event.key === 'Enter') action = 'run'
  else if (event.shiftKey && event.key.toLowerCase() === 'c') action = 'copyCommand'
  else if (event.shiftKey && event.key.toLowerCase() === 'o') action = 'copyOutput'
  else if (event.shiftKey) action = undefined
  else if (event.key.toLowerCase() === 'k') action = 'palette'
  else if (event.key.toLowerCase() === 'b') action = 'sidebar'

  if (!action) return false
  const handler = handlers[action]
  if (!handler) return false

  event.preventDefault()
  handler()
  return true
}
