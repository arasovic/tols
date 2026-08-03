import { writable } from 'svelte/store'
import { browser } from '$app/environment'

function getSystemPreference() {
  if (!browser) return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function createThemeStore() {
  const defaultTheme = getSystemPreference()
  let initialTheme = defaultTheme

  if (browser) {
    try {
      const saved = localStorage.getItem('devutils-theme')
      if (saved === 'light' || saved === 'dark') {
        initialTheme = saved
      }
    } catch (/** @type {any} */ e) {
      console.warn('Failed to load theme from localStorage:', e)
    }
  }

  const { subscribe, set, update } = writable(initialTheme)

  return {
    subscribe,
    toggle: () => update(current => {
      const next = current === 'dark' ? 'light' : 'dark'
      if (browser) {
        try {
          localStorage.setItem('devutils-theme', next)
        } catch (/** @type {any} */ e) {
          console.warn('Failed to save theme to localStorage:', e)
        }
        document.documentElement.setAttribute('data-theme', next)
      }
      return next
    }),
    /**
     * @param {string} theme
     */
    set: theme => {
      if (browser) {
        try {
          localStorage.setItem('devutils-theme', theme)
        } catch (/** @type {any} */ e) {
          console.warn('Failed to save theme to localStorage:', e)
        }
        document.documentElement.setAttribute('data-theme', theme)
      }
      set(theme)
    }
  }
}

export const theme = createThemeStore()
