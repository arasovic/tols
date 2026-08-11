import { get, writable } from 'svelte/store'
import { browser } from '$app/environment'

const STORAGE_KEY = 'tols-theme'
const LEGACY_STORAGE_KEY = 'devutils-theme'
const preferences = ['system', 'light', 'dark']

const mediaQuery = browser
  ? window.matchMedia('(prefers-color-scheme: light)')
  : null

/**
 * @param {string | null} value
 * @returns {value is 'system' | 'light' | 'dark'}
 */
function isPreference(value) {
  return value !== null && preferences.includes(value)
}

/**
 * @param {'system' | 'light' | 'dark'} preference
 */
function resolveTheme(preference) {
  if (preference !== 'system') return preference
  return mediaQuery?.matches ? 'light' : 'dark'
}

function loadPreference() {
  if (!browser) return /** @type {const} */ ('system')

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isPreference(saved)) return saved

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (isPreference(legacy) && legacy !== 'system') {
      localStorage.setItem(STORAGE_KEY, legacy)
      localStorage.removeItem(LEGACY_STORAGE_KEY)
      return legacy
    }
  } catch (/** @type {any} */ error) {
    console.warn('Failed to load theme from localStorage:', error)
  }

  return /** @type {const} */ ('system')
}

const initialPreference = loadPreference()
const preferenceStore = writable(initialPreference)
const resolvedStore = writable(resolveTheme(initialPreference))
let systemListenerAttached = false

if (browser) {
  document.documentElement.dataset.theme = resolveTheme(initialPreference)
}

/**
 * @param {'system' | 'light' | 'dark'} preference
 */
function applyPreference(preference) {
  const resolved = resolveTheme(preference)

  preferenceStore.set(preference)
  resolvedStore.set(resolved)

  if (!browser) return

  document.documentElement.dataset.theme = resolved
  syncSystemListener(preference)
  try {
    localStorage.setItem(STORAGE_KEY, preference)
  } catch (/** @type {any} */ error) {
    console.warn('Failed to save theme to localStorage:', error)
  }
}

/** @param {MediaQueryListEvent | { matches: boolean }} event */
function handleSystemChange(event) {
  const resolved = event.matches ? 'light' : 'dark'
  resolvedStore.set(resolved)
  document.documentElement.dataset.theme = resolved
}

/** @param {'system' | 'light' | 'dark'} preference */
function syncSystemListener(preference) {
  if (!mediaQuery) return

  if (preference === 'system' && !systemListenerAttached) {
    mediaQuery.addEventListener('change', handleSystemChange)
    systemListenerAttached = true
  } else if (preference !== 'system' && systemListenerAttached) {
    mediaQuery.removeEventListener('change', handleSystemChange)
    systemListenerAttached = false
  }
}

syncSystemListener(initialPreference)

export const themePreference = {
  subscribe: preferenceStore.subscribe
}

export const theme = {
  subscribe: resolvedStore.subscribe,
  toggle: () => applyPreference(get(resolvedStore) === 'dark' ? 'light' : 'dark'),
  cycle: () => {
    const currentIndex = preferences.indexOf(get(preferenceStore))
    applyPreference(/** @type {'system' | 'light' | 'dark'} */ (
      preferences[(currentIndex + 1) % preferences.length]
    ))
  },
  /**
   * @param {'system' | 'light' | 'dark'} preference
   */
  set: preference => applyPreference(preference)
}
