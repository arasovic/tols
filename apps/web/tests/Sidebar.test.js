import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { render, screen, fireEvent } from '@testing-library/svelte'
import { writable } from 'svelte/store'
import { page } from '$app/stores'
import Sidebar from '$lib/components/Sidebar.svelte'

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src')
const sidebarSource = readFileSync(join(SRC, 'lib', 'components', 'Sidebar.svelte'), 'utf8')

const { baseMock, favoritesMock } = vi.hoisted(() => ({
  baseMock: { base: '' },
  favoritesMock: { value: [] }
}))

vi.mock('$app/stores', () => ({
  page: writable({ url: { pathname: '/json' } })
}))

vi.mock('$lib/stores/favorites', () => ({
  favorites: {
    subscribe: vi.fn((cb) => {
      cb(favoritesMock.value)
      return () => {}
    })
  }
}))

vi.mock('$app/paths', () => ({
  get base() {
    return baseMock.base
  }
}))

vi.mock('$lib/stores/theme', () => ({
  theme: {
    subscribe: vi.fn((cb) => {
      cb('dark')
      return () => {}
    }),
    toggle: vi.fn()
  }
}))

vi.mock('$app/environment', () => ({
  browser: true
}))

describe('Sidebar', () => {
  // window/document must not be stubbed here: replacing the real DOM globals
  // breaks @testing-library/svelte's render. matchMedia is polyfilled in setup.js.
  beforeEach(() => {
    baseMock.base = ''
    favoritesMock.value = []
    page.set({ url: { pathname: '/json' } })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should render correctly', () => {
    render(Sidebar)
    expect(screen.getByText('tols')).toBeInTheDocument()
  })

  it('should show tools list', () => {
    render(Sidebar)
    expect(screen.getByText('Tools')).toBeInTheDocument()
    expect(screen.getByText('JSON')).toBeInTheDocument()
    expect(screen.getByText('Base64')).toBeInTheDocument()
  })

  it('should highlight active tool', () => {
    const { container } = render(Sidebar)
    const activeLink = container.querySelector('.nav-item.active')
    expect(activeLink).toBeInTheDocument()
  })

  it('highlights exactly the JSON tool when base is relative (prerender)', () => {
    baseMock.base = '.'
    page.set({ url: { pathname: '/dev-utilities/json' } })
    const { container } = render(Sidebar)
    const activeLinks = container.querySelectorAll('.nav-item.active')
    expect(activeLinks).toHaveLength(1)
    expect(activeLinks[0].textContent).toContain('JSON')
  })

  it('should have theme toggle button', () => {
    render(Sidebar)
    expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument()
  })

  it('should close on escape key when open', async () => {
    const { component, container } = render(Sidebar, { props: { isOpen: true } })
    const sidebar = container.querySelector('.sidebar')
    expect(sidebar).toHaveClass('open')

    await fireEvent.keyDown(document, { key: 'Escape' })

    expect(sidebar).not.toHaveClass('open')
  })

  it('should show version in footer', () => {
    render(Sidebar)
    expect(screen.getByText('v1.0.0')).toBeInTheDocument()
  })

  it('should render tool icons', () => {
    const { container } = render(Sidebar)
    const icons = container.querySelectorAll('.nav-item-icon')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('should have correct navigation links', () => {
    const { container } = render(Sidebar)
    const links = container.querySelectorAll('.nav-item')
    expect(links.length).toBeGreaterThan(0)
  })

  it('should show logo', () => {
    render(Sidebar)
    expect(screen.getByText('tols')).toBeInTheDocument()
  })

  it('should close sidebar on link click when open', async () => {
    const { container } = render(Sidebar, { props: { isOpen: true } })
    const jsonLink = screen.getByText('JSON')

    await fireEvent.click(jsonLink)

    const sidebar = container.querySelector('.sidebar')
    expect(sidebar).not.toHaveClass('open')
  })

  it('wraps the favorites star in a nav-fav element for the scoped CSS hook', () => {
    favoritesMock.value = ['json']
    const { container } = render(Sidebar)
    const favStar = container.querySelector('.nav-fav')
    expect(favStar).not.toBeNull()
    expect(favStar.tagName).toBe('SPAN')
    expect(favStar.querySelector('svg')).not.toBeNull()
    expect(container.querySelectorAll('.nav-fav')).toHaveLength(1)
  })

  it('gives the alias cell a fixed character-cell width so every label starts on one column', () => {
    // jsdom computes no layout, so the ragged left edge this guards against is
    // structurally invisible to a rendered assertion — the declaration itself is
    // what has to be pinned. Same idiom as CommandStrip's layout guard.
    const block = sidebarSource.match(/\.nav-alias\s*\{([^}]*)\}/)
    expect(block).not.toBeNull()
    expect(block[1]).toMatch(/width:\s*\d+ch/)
    expect(block[1]).toMatch(/font-family:\s*var\(--font-mono\)/) // ch needs the mono face
    expect(block[1]).not.toMatch(/width:\s*\d+px/)
  })
})
