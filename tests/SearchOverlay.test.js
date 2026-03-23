import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/svelte'
import SearchOverlay from '$lib/components/SearchOverlay.svelte'

vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}))

vi.mock('$app/environment', () => ({
  browser: true
}))

describe('SearchOverlay', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn()
    })
  })

  it('should render without overlay initially', () => {
    const { container } = render(SearchOverlay)
    const overlay = container.querySelector('.search-overlay')
    expect(overlay).not.toBeInTheDocument()
  })

  it('should open overlay when open() is called', async () => {
    const { component, container } = render(SearchOverlay)

    component.open()

    await waitFor(() => {
      const overlay = container.querySelector('.search-overlay')
      expect(overlay).toBeInTheDocument()
    })
  })

  it('should show overlay backdrop when open', async () => {
    const { component, container } = render(SearchOverlay)

    component.open()

    await waitFor(() => {
      const backdrop = container.querySelector('.overlay-backdrop')
      expect(backdrop).toBeInTheDocument()
    })
  })

  it('should display search container when open', async () => {
    const { component, container } = render(SearchOverlay)

    component.open()

    await waitFor(() => {
      const searchContainer = container.querySelector('.search-container')
      expect(searchContainer).toBeInTheDocument()
    })
  })

  it('should have search input when open', async () => {
    const { component, container } = render(SearchOverlay)

    component.open()

    await waitFor(() => {
      const searchInput = container.querySelector('.search-input')
      expect(searchInput).toBeInTheDocument()
    })
  })

  it('should focus search input when overlay opens', async () => {
    const { component, container } = render(SearchOverlay)

    component.open()

    await waitFor(() => {
      const input = container.querySelector('.search-input')
      expect(input).toBeInTheDocument()
    })
  })

  it('should render results container when open', async () => {
    const { component, container } = render(SearchOverlay)

    component.open()

    await waitFor(() => {
      const resultsContainer = container.querySelector('.results-container')
      expect(resultsContainer).toBeInTheDocument()
    })
  })

  it('should have correct aria attributes when open', async () => {
    const { component, container } = render(SearchOverlay)

    component.open()

    await waitFor(() => {
      const overlay = container.querySelector('.search-overlay')
      expect(overlay).toHaveAttribute('role', 'dialog')
      expect(overlay).toHaveAttribute('aria-modal', 'true')
      expect(overlay).toHaveAttribute('aria-label', 'Search tools')
    })
  })

  it('should show search header with icon when open', async () => {
    const { component, container } = render(SearchOverlay)

    component.open()

    await waitFor(() => {
      const searchHeader = container.querySelector('.search-header')
      expect(searchHeader).toBeInTheDocument()

      const searchIcon = container.querySelector('.search-icon')
      expect(searchIcon).toBeInTheDocument()
    })
  })

  it('should have ESC shortcut indicator when open', async () => {
    const { component, container } = render(SearchOverlay)

    component.open()

    await waitFor(() => {
      const kbdShortcut = container.querySelector('.kbd-shortcut')
      expect(kbdShortcut).toBeInTheDocument()
      expect(kbdShortcut).toHaveTextContent('ESC')
    })
  })

  it('should display search footer with keyboard hints when open', async () => {
    const { component, container } = render(SearchOverlay)

    component.open()

    await waitFor(() => {
      const searchFooter = container.querySelector('.search-footer')
      expect(searchFooter).toBeInTheDocument()

      const footerHints = container.querySelector('.footer-hints')
      expect(footerHints).toBeInTheDocument()
    })
  })

  it('should show footer hints with navigation instructions', async () => {
    const { component, container } = render(SearchOverlay)

    component.open()

    await waitFor(() => {
      const footerHints = container.querySelector('.footer-hints')
      expect(footerHints).toBeInTheDocument()
      expect(footerHints.textContent).toContain('Navigate')
      expect(footerHints.textContent).toContain('Open')
    })
  })

  it('should show all tools section when open with no query', async () => {
    const { component, container } = render(SearchOverlay)

    component.open()

    await waitFor(() => {
      const groupHeaders = container.querySelectorAll('.group-header')
      const allToolsHeader = Array.from(groupHeaders).find(h => h.textContent?.includes('All Tools'))
      expect(allToolsHeader).toBeInTheDocument()
    })
  })

  it('should render tool result items when open', async () => {
    const { component, container } = render(SearchOverlay)

    component.open()

    await waitFor(() => {
      const resultItems = container.querySelectorAll('.result-item')
      expect(resultItems.length).toBeGreaterThan(0)
    })
  })
})
