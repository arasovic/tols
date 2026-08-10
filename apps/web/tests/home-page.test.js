import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/svelte'
import { readFileSync } from 'node:fs'
import HomePage from '../src/routes/+page.svelte'
import { tools } from '$lib/config/registry.js'

const homepageSource = readFileSync('src/routes/+page.svelte', 'utf8')
const appStyles = readFileSync('src/app.css', 'utf8')

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

  it('states that the interface is changing without calling the site maintenance', () => {
    const { getByRole, getByText, queryByText } = render(HomePage)
    expect(getByRole('heading', { level: 1, name: 'Interface redesign in progress' })).toBeTruthy()
    expect(getByText('The tools remain available while we rebuild the interface')).toBeTruthy()
    expect(queryByText(/maintenance/i)).toBeNull()
  })

  it('makes the CLI install command and package destinations explicit', () => {
    const { container } = render(HomePage)
    expect(container.querySelector('.install-command').textContent).toBe('npm install -g tols-cli')
    expect(container.querySelector('a[href="https://www.npmjs.com/package/tols-cli"]')).toBeTruthy()
    expect(container.querySelector('a[href="https://github.com/arasovic/tols"]')).toBeTruthy()
  })

  it('keeps wordmark sources stable when server and client themes differ', () => {
    // The server theme is always dark while the client may initialize from a
    // saved light preference. A reactive src causes a hydration mismatch and
    // Svelte keeps the server image instead of the client image.
    expect(homepageSource).not.toMatch(/src=\{\$theme/)
  })

  it('isolates the temporary palette and uses the shared button primitive', () => {
    expect(homepageSource).toContain("import Button from '$lib/ui/Button.svelte'")
    expect(homepageSource).not.toMatch(/<button[\s>]/)
    expect(homepageSource).toContain('Temporary landing palette: keep it local')
    expect(appStyles).not.toContain('--landing-')
  })

  it('keeps every popular web tool reachable from registry-derived links', () => {
    const { container } = render(HomePage)
    const popularTools = tools.filter(tool => tool.popular)
    const links = [...container.querySelectorAll('.web-tool-link')]

    expect(links).toHaveLength(popularTools.length)
    expect(links.map(link => link.textContent.trim())).toEqual(popularTools.map(tool => tool.name))
    expect(links.map(link => link.getAttribute('href'))).toEqual(
      popularTools.map(tool => `/dev-utilities/${tool.id}`)
    )
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

  it('never skips a heading level', () => {
    const { container } = render(HomePage)
    expect(headingSkips(container)).toEqual([])
  })
})
