/**
 * Favorited tools, persisted to localStorage.
 */
import { writable } from 'svelte/store'
import { browser } from '$app/environment'

const STORAGE_KEY = 'devutils:favorites'

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

export const favorites = writable(load())

/**
 * Add or remove a tool from the favorites list.
 * @param {string} toolId
 */
export function toggleFavorite(toolId) {
  favorites.update(current => {
    const next = current.includes(toolId)
      ? current.filter(id => id !== toolId)
      : [...current, toolId]
    if (browser) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch (e) {
        console.warn('Failed to save favorites to localStorage:', e)
      }
    }
    return next
  })
}
