import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/svelte'
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
    // app.html renders <a href="#main-content">. All 30 tool routes give their
    // <main> that id; the landing page did not, so the link went nowhere and
    // Lighthouse reported "No skip link target".
    const { container } = render(HomePage)
    const main = container.querySelector('#main-content')
    expect(main).toBeTruthy()
    expect(main.tagName).toBe('MAIN')
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
})
