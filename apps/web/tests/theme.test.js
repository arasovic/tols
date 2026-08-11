import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { get } from 'svelte/store'

describe('theme store', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    // Fresh module per test: the theme store reads localStorage at import time,
    // so a cached module would keep the initial value of the first import.
    vi.resetModules()
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps system as the preference while resolving the current dark system theme', async () => {
    const { theme: freshTheme, themePreference } = await import('$lib/stores/theme')
    expect(get(themePreference)).toBe('system')
    expect(get(freshTheme)).toBe('dark')
  })

  it('loads an explicit preference from the tols storage key', async () => {
    localStorage.setItem('tols-theme', 'light')
    const { theme: freshTheme, themePreference } = await import('$lib/stores/theme')
    expect(get(themePreference)).toBe('light')
    expect(get(freshTheme)).toBe('light')
  })

  it('applies the resolved theme during initialisation', async () => {
    localStorage.setItem('tols-theme', 'light')
    await import('$lib/stores/theme')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('migrates a valid legacy preference without losing it', async () => {
    localStorage.setItem('devutils-theme', 'light')
    const { theme: freshTheme, themePreference } = await import('$lib/stores/theme')
    expect(get(themePreference)).toBe('light')
    expect(get(freshTheme)).toBe('light')
    expect(localStorage.getItem('tols-theme')).toBe('light')
    expect(localStorage.getItem('devutils-theme')).toBeNull()
  })

  it('should toggle from dark to light', async () => {
    const { theme: freshTheme } = await import('$lib/stores/theme')
    freshTheme.toggle()
    const value = get(freshTheme)
    expect(value).toBe('light')
  })

  it('should toggle from light to dark', async () => {
    localStorage.setItem('tols-theme', 'light')
    const { theme: freshTheme } = await import('$lib/stores/theme')
    freshTheme.toggle()
    const value = get(freshTheme)
    expect(value).toBe('dark')
  })

  it('should save theme to localStorage on toggle', async () => {
    const { theme: freshTheme } = await import('$lib/stores/theme')
    freshTheme.toggle()
    expect(localStorage.getItem('tols-theme')).toBe('light')
  })

  it('should set data-theme attribute on toggle', async () => {
    const { theme: freshTheme } = await import('$lib/stores/theme')
    freshTheme.toggle()
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('sets an explicit theme preference directly', async () => {
    const { theme: freshTheme, themePreference } = await import('$lib/stores/theme')
    freshTheme.set('light')
    expect(get(themePreference)).toBe('light')
    expect(get(freshTheme)).toBe('light')
  })

  it('should save theme to localStorage on set()', async () => {
    const { theme: freshTheme } = await import('$lib/stores/theme')
    freshTheme.set('light')
    expect(localStorage.getItem('tols-theme')).toBe('light')
  })

  it('resolves the current light system preference when no explicit preference is saved', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }))
    const { theme: freshTheme, themePreference } = await import('$lib/stores/theme')
    expect(get(themePreference)).toBe('system')
    expect(get(freshTheme)).toBe('light')
  })

  it('updates the resolved theme when the system preference changes', async () => {
    let onChange
    const mediaQuery = {
      matches: false,
      addEventListener: vi.fn((type, callback) => {
        if (type === 'change') onChange = callback
      }),
      removeEventListener: vi.fn()
    }
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mediaQuery))

    const { theme: freshTheme, themePreference } = await import('$lib/stores/theme')
    expect(get(themePreference)).toBe('system')
    expect(get(freshTheme)).toBe('dark')

    mediaQuery.matches = true
    onChange({ matches: true })

    expect(get(freshTheme)).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('cycles through system, light, dark, and back to system', async () => {
    const { theme: freshTheme, themePreference } = await import('$lib/stores/theme')
    freshTheme.cycle()
    expect(get(themePreference)).toBe('light')
    freshTheme.cycle()
    expect(get(themePreference)).toBe('dark')
    freshTheme.cycle()
    expect(get(themePreference)).toBe('system')
  })

  it('restores system resolution through set()', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }))
    localStorage.setItem('tols-theme', 'dark')
    const { theme: freshTheme, themePreference } = await import('$lib/stores/theme')

    freshTheme.set('system')

    expect(get(themePreference)).toBe('system')
    expect(get(freshTheme)).toBe('light')
    expect(localStorage.getItem('tols-theme')).toBe('system')
  })

  it('attaches the system listener only while the system preference is active', async () => {
    /** @type {((event: { matches: boolean }) => void) | undefined} */
    let listener
    const mediaQuery = {
      matches: false,
      addEventListener: vi.fn((type, callback) => {
        if (type === 'change') listener = callback
      }),
      removeEventListener: vi.fn()
    }
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mediaQuery))

    const { theme: freshTheme } = await import('$lib/stores/theme')
    expect(mediaQuery.addEventListener).toHaveBeenCalledOnce()
    expect(mediaQuery.addEventListener).toHaveBeenCalledWith('change', listener)

    freshTheme.set('light')
    expect(mediaQuery.removeEventListener).toHaveBeenCalledOnce()
    expect(mediaQuery.removeEventListener).toHaveBeenCalledWith('change', listener)

    freshTheme.set('system')
    expect(mediaQuery.addEventListener).toHaveBeenCalledTimes(2)
    expect(mediaQuery.addEventListener).toHaveBeenLastCalledWith('change', listener)
  })

  it('does not attach the system listener for an initial explicit preference', async () => {
    const mediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mediaQuery))
    localStorage.setItem('tols-theme', 'dark')

    const { theme: freshTheme } = await import('$lib/stores/theme')
    expect(mediaQuery.addEventListener).not.toHaveBeenCalled()

    freshTheme.set('system')
    expect(mediaQuery.addEventListener).toHaveBeenCalledOnce()
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
