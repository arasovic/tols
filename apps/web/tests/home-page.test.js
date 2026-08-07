import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import HomePage from '../src/routes/+page.svelte'
import { tools } from '$lib/config/registry.js'

vi.mock('$app/paths', () => ({ base: '/dev-utilities' }))
vi.mock('$app/environment', () => ({ browser: true }))
vi.mock('$app/navigation', () => ({ goto: vi.fn() }))

vi.mock('$lib/stores/theme', () => ({
  theme: {
    subscribe: vi.fn((cb) => {
      cb('dark')
      return () => {}
    }),
    toggle: vi.fn()
  }
}))

vi.mock('$lib/stores/favorites.js', async () => {
  const { readable } = await import('svelte/store')
  return { favorites: readable([]), toggleFavorite: vi.fn() }
})

vi.mock('$lib/stores/recentTools.js', async () => {
  const { readable } = await import('svelte/store')
  return { recentTools: readable([]), addRecent: vi.fn() }
})

describe('landing page', () => {
  it('provides the target app.html’s skip link points at', () => {
    // app.html renders <a href="#main-content">. Tool routes get that id from
    // the single <main> in the (app) layout; the landing page is outside that
    // group and carries its own, which it did not until Lighthouse reported
    // "No skip link target".
    const { container } = render(HomePage)
    const main = container.querySelector('#main-content')
    expect(main).toBeTruthy()
    expect(main.tagName).toBe('MAIN')
    // Focusable, or the link relocates the tab order without moving focus.
    expect(main.getAttribute('tabindex')).toBe('-1')
  })

  it('keeps a tool count out of the headline', () => {
    // The website has 30 tools and the CLI has 29, so a number in a headline
    // that also says "One command" would pair the web's count with a claim
    // about the CLI. Asserting on digits, not on the exact wording, so the
    // copy can be reworded without quietly letting a count back in.
    const { container } = render(HomePage)
    const headline = container.querySelector('.hero-title').textContent
    expect(headline).toBe('Dev tools. One command.')
    expect(headline).not.toMatch(/\d/)
  })

  it('derives the Tools stat from the registry', () => {
    // The stat stays: it is labelled `Tools`, it sits on the website, and 30
    // is the website's real number. It must come from the registry, never a
    // literal — that is how it once drifted from the headline above it.
    const { container } = render(HomePage)
    const stat = [...container.querySelectorAll('.hero-stat')]
      .find((el) => el.textContent.includes('Tools'))
      .querySelector('.hero-stat-value').textContent
    expect(stat).toBe(String(tools.length))
  })

  /**
   * Lighthouse's `heading-order` audit: every heading may go down at most one
   * level from the previous one. Returns the offending transitions so a
   * failure names the pair, not just a boolean.
   * @param {Element} root
   */
  function headingSkips(root) {
    const levels = [...root.querySelectorAll('h1, h2, h3, h4, h5, h6')]
    return levels
      .map((el, i) => [levels[i - 1], el])
      .filter(([prev, el]) => prev && Number(el.tagName[1]) - Number(prev.tagName[1]) > 1)
      .map(([prev, el]) => `${prev.tagName} -> ${el.tagName} ("${el.textContent.trim()}")`)
  }

  it('never skips a heading level in the default state', () => {
    // The privacy banner rendered an <h3> straight after the hero <h1>, which
    // was the last Accessibility failure on /. The tool cards are h2s, so the
    // banner is their sibling, not their child.
    const { container } = render(HomePage)
    expect(headingSkips(container)).toEqual([])
  })

  it('never skips a heading level in the empty-search state', () => {
    // `showPopular` is false whenever a query is set, so this state hides every
    // tool card: the outline collapses to h1 -> banner h2 -> no-results h3.
    // That is why .no-results-title stays an h3.
    const { container } = render(HomePage)
    const input = container.querySelector('.search-input')
    return fireEvent.input(input, { target: { value: 'zzzznotatool' } }).then(() => {
      expect(container.querySelector('.no-results-title')).toBeTruthy()
      expect(headingSkips(container)).toEqual([])
    })
  })
})
