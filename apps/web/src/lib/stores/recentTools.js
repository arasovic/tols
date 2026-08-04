/**
 * Recently used tools, shared between the Cmd+K overlay and the homepage.
 * Persisted to localStorage under the original key so existing users keep
 * their history.
 */
import { writable } from 'svelte/store'
import { browser } from '$app/environment'

const STORAGE_KEY = 'devutils_recent_tools'
export const MAX_RECENT = 5

function load() {
  if (!browser) return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const parsed = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed.filter(id => typeof id === 'string') : []
  } catch {
    return []
  }
}

export const recentTools = writable(load())

/**
 * Mark a tool as recently used (most recent first, deduplicated, capped).
 * @param {string} toolId
 */
export function addRecent(toolId) {
  recentTools.update(current => {
    const next = [toolId, ...current.filter(id => id !== toolId)].slice(0, MAX_RECENT)
    if (browser) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Storage may be unavailable (private mode/quota); recency is a nicety.
      }
    }
    return next
  })
}
