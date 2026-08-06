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

  it('states the real registry tool count in the headline', () => {
    // The headline and the `Tools` stat sit in one viewport at every width.
    // Compared against the registry, not a literal, so adding a tool cannot
    // leave the headline behind the way a hardcoded 28 did.
    const { container } = render(HomePage)
    expect(container.querySelector('.hero-title').textContent).toBe(
      `${tools.length} dev tools. One command.`
    )
  })

  it('shows the same count in the headline and in the stat row', () => {
    const { container } = render(HomePage)
    const headline = container.querySelector('.hero-title').textContent.match(/^\d+/)[0]
    const stat = [...container.querySelectorAll('.hero-stat')]
      .find((el) => el.textContent.includes('Tools'))
      .querySelector('.hero-stat-value').textContent
    expect(headline).toBe(stat)
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
