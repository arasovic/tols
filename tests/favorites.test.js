import { describe, it, expect, beforeEach, vi } from 'vitest'
import { get } from 'svelte/store'

describe('favorites store', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('starts empty and toggles tools in and out', async () => {
    const { favorites, toggleFavorite } = await import('$lib/stores/favorites.js')

    expect(get(favorites)).toEqual([])

    toggleFavorite('json')
    toggleFavorite('hash')
    expect(get(favorites)).toEqual(['json', 'hash'])

    toggleFavorite('json')
    expect(get(favorites)).toEqual(['hash'])
  })

  it('persists favorites to localStorage', async () => {
    const { toggleFavorite } = await import('$lib/stores/favorites.js')
    toggleFavorite('json')

    expect(JSON.parse(localStorage.getItem('devutils:favorites'))).toEqual(['json'])

    // A fresh module instance sees the persisted value
    vi.resetModules()
    const reloaded = await import('$lib/stores/favorites.js')
    expect(get(reloaded.favorites)).toEqual(['json'])
  })

  it('survives corrupted storage', async () => {
    localStorage.setItem('devutils:favorites', '{not json')
    const { favorites } = await import('$lib/stores/favorites.js')
    expect(get(favorites)).toEqual([])
  })
})

describe('recentTools store', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('keeps the most recent tool first, deduplicated', async () => {
    const { recentTools, addRecent } = await import('$lib/stores/recentTools.js')

    addRecent('json')
    addRecent('hash')
    addRecent('json')

    expect(get(recentTools)).toEqual(['json', 'hash'])
  })

  it('caps the list at five entries', async () => {
    const { recentTools, addRecent } = await import('$lib/stores/recentTools.js')

    for (const id of ['a', 'b', 'c', 'd', 'e', 'f']) addRecent(id)

    expect(get(recentTools)).toEqual(['f', 'e', 'd', 'c', 'b'])
  })

  it('persists under the legacy key', async () => {
    const { addRecent } = await import('$lib/stores/recentTools.js')
    addRecent('json')

    expect(JSON.parse(localStorage.getItem('devutils_recent_tools'))).toEqual(['json'])
  })
})
