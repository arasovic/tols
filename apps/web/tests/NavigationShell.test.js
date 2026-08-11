import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/svelte'
import SiteHeader from '$lib/components/SiteHeader.svelte'
import SearchOverlay from '$lib/components/SearchOverlay.svelte'
import { tools } from '$lib/config/registry.js'
import { aliasFor } from '$lib/ui/aliases.js'
import { templateFor } from '$lib/cli/templates.js'
import { goto } from '$app/navigation'

vi.mock('$app/paths', () => ({ base: '/dev-utilities' }))
vi.mock('$app/environment', () => ({ browser: true }))
vi.mock('$app/navigation', () => ({ goto: vi.fn() }))

vi.mock('$lib/stores/theme', () => ({
  theme: {
    subscribe: vi.fn((cb) => {
      cb('dark')
      return () => {}
    }),
    cycle: vi.fn()
  },
  themePreference: {
    subscribe: vi.fn((cb) => {
      cb('system')
      return () => {}
    })
  }
}))

describe('shared navigation shell', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders a theme-safe small wordmark', () => {
    const { container } = render(SiteHeader)
    expect(container.querySelector('.site-wordmark .wordmark-black')).toBeInTheDocument()
    expect(container.querySelector('.site-wordmark .wordmark-white')).toBeInTheDocument()
  })

  it('links the wordmark home', () => {
    const { container } = render(SiteHeader)
    expect(container.querySelector('.site-wordmark')).toHaveAttribute('href', '/dev-utilities/')
  })

  it('exposes package and source destinations', () => {
    const { container } = render(SiteHeader)
    expect(container.querySelector('a[href="https://www.npmjs.com/package/tols-cli"]')).toBeInTheDocument()
    expect(container.querySelector('a[href="https://github.com/arasovic/tols"]')).toBeInTheDocument()
  })

  it('uses the shared factual theme control', () => {
    const { getByRole } = render(SiteHeader)
    expect(getByRole('button', { name: 'Theme: auto. Change theme' })).toBeInTheDocument()
  })

  it('contains no hardcoded package version', () => {
    const { queryByText } = render(SiteHeader)
    expect(queryByText(/^v\d/)).toBeNull()
  })

  it('keeps the tool index outside the DOM while closed', () => {
    const { container } = render(SearchOverlay)
    expect(container.querySelector('.search-overlay')).toBeNull()
  })

  it('opens as a full tool index', async () => {
    const { component, container } = render(SearchOverlay)
    component.open()
    await waitFor(() => expect(container.querySelector('.index-title')).toHaveTextContent('Tool index'))
  })

  it('lists every registry route exactly once', async () => {
    const { component, container } = render(SearchOverlay)
    component.open()
    await waitFor(() => expect(container.querySelectorAll('.result-item')).toHaveLength(tools.length))
    expect([...container.querySelectorAll('.result-item')].map(row => row.id).sort())
      .toEqual(tools.map(tool => `result-${tool.id}`).sort())
  })

  it('uses textual aliases in a fixed character column', async () => {
    const { component, container } = render(SearchOverlay)
    component.open()
    await waitFor(() => expect(container.querySelectorAll('.result-alias')).toHaveLength(tools.length))
    for (const tool of tools) {
      const alias = container.querySelector(`#result-${tool.id} .result-alias`)
      expect(alias).toHaveTextContent(aliasFor(tool.id))
      expect(alias.querySelector('svg')).toBeNull()
    }
  })

  it('shows an exact CLI preview for every compatible route', async () => {
    const { component, container } = render(SearchOverlay)
    component.open()
    await waitFor(() => expect(container.querySelectorAll('.result-item')).toHaveLength(tools.length))
    for (const tool of tools) {
      const template = templateFor(tool.id)
      expect(container.querySelector(`#result-${tool.id} .result-cmd`))
        .toHaveTextContent(`tols ${template.tool} ${template.defaultAction}`)
    }
  })

  it('filters the registry with the search field', async () => {
    const { component, container } = render(SearchOverlay)
    component.open()
    await waitFor(() => expect(container.querySelector('.search-input')).toBeInTheDocument())
    const input = container.querySelector('.search-input')
    await fireEvent.input(input, { target: { value: 'json formatter' } })
    expect(container.querySelector('#result-json')).toBeInTheDocument()
    expect(container.querySelector('#result-barcode')).toBeNull()
  })

  it('closes the index with Escape', async () => {
    const { component, container } = render(SearchOverlay)
    component.open()
    await waitFor(() => expect(container.querySelector('.search-overlay')).toBeInTheDocument())
    expect(document.body.style.overflow).toBe('hidden')
    await fireEvent.keyDown(window, { key: 'Escape' })
    expect(container.querySelector('.search-overlay')).toBeNull()
    expect(document.body.style.overflow).toBe('')
  })

  it('navigates through the base-safe route and closes after selection', async () => {
    const { component, container } = render(SearchOverlay)
    component.open()
    await waitFor(() => expect(container.querySelector('#result-json')).toBeInTheDocument())
    const row = container.querySelector('#result-json')
    await fireEvent.click(row)
    expect(goto).toHaveBeenCalledWith('/dev-utilities/json')
    expect(container.querySelector('.search-overlay')).toBeNull()
  })
})
