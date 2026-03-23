import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { get } from 'svelte/store'

describe('theme store', () => {
  let theme

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    vi.stubGlobal('window', {
      matchMedia: vi.fn().mockReturnValue({ matches: false })
    })
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should initialize with dark theme by default when no saved theme', async () => {
    const { theme: freshTheme } = await import('$lib/stores/theme')
    const value = get(freshTheme)
    expect(value).toBe('dark')
  })

  it('should load saved theme from localStorage', async () => {
    localStorage.setItem('devutils-theme', 'light')
    const { theme: freshTheme } = await import('$lib/stores/theme')
    const value = get(freshTheme)
    expect(value).toBe('light')
  })

  it('should toggle from dark to light', async () => {
    const { theme: freshTheme } = await import('$lib/stores/theme')
    freshTheme.toggle()
    const value = get(freshTheme)
    expect(value).toBe('light')
  })

  it('should toggle from light to dark', async () => {
    localStorage.setItem('devutils-theme', 'light')
    const { theme: freshTheme } = await import('$lib/stores/theme')
    freshTheme.toggle()
    const value = get(freshTheme)
    expect(value).toBe('dark')
  })

  it('should save theme to localStorage on toggle', async () => {
    const { theme: freshTheme } = await import('$lib/stores/theme')
    freshTheme.toggle()
    expect(localStorage.getItem('devutils-theme')).toBe('light')
  })

  it('should set data-theme attribute on toggle', async () => {
    const { theme: freshTheme } = await import('$lib/stores/theme')
    freshTheme.toggle()
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('should set theme directly using set()', async () => {
    const { theme: freshTheme } = await import('$lib/stores/theme')
    freshTheme.set('light')
    const value = get(freshTheme)
    expect(value).toBe('light')
  })

  it('should save theme to localStorage on set()', async () => {
    const { theme: freshTheme } = await import('$lib/stores/theme')
    freshTheme.set('light')
    expect(localStorage.getItem('devutils-theme')).toBe('light')
  })

  it('should use system preference when no saved theme', async () => {
    vi.stubGlobal('window', {
      matchMedia: vi.fn().mockReturnValue({ matches: true })
    })
    const { theme: freshTheme } = await import('$lib/stores/theme')
    const value = get(freshTheme)
    expect(value).toBe('light')
  })

  it('should handle localStorage errors gracefully', async () => {
    const originalSetItem = localStorage.setItem
    localStorage.setItem = vi.fn().mockImplementation(() => {
      throw new Error('Storage quota exceeded')
    })

    const { theme: freshTheme } = await import('$lib/stores/theme')
    freshTheme.toggle()
    expect(get(freshTheme)).toBe('light')

    localStorage.setItem = originalSetItem
  })
})
