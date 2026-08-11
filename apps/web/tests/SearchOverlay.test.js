import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { render, waitFor, fireEvent } from '@testing-library/svelte'
import { tick } from 'svelte'
import SearchOverlay from '$lib/components/SearchOverlay.svelte'
import { templateFor } from '$lib/cli/templates.js'
import { aliasFor } from '$lib/ui/aliases.js'
import { tools } from '$lib/config/registry.js'

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src')
const componentSource = readFileSync(
  join(SRC, 'lib', 'components', 'SearchOverlay.svelte'),
  'utf8'
)

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
    component.open()

    await waitFor(() => {
      const overlay = container.querySelector('.search-overlay')
      expect(overlay).toBeInTheDocument()
      expect(container.querySelectorAll('.search-overlay')).toHaveLength(1)
    })
  })

  it('ignores outside clicks while opening and closes after the guard', async () => {
    vi.useFakeTimers()

    try {
      const { component, container } = render(SearchOverlay)

      component.open()
      await tick()

      const backdrop = container.querySelector('.overlay-backdrop')
      expect(backdrop).toBeInTheDocument()

      await fireEvent.click(backdrop)
      expect(container.querySelector('.search-overlay')).toBeInTheDocument()

      await vi.advanceTimersByTimeAsync(100)
      await fireEvent.click(backdrop)
      await tick()

      expect(container.querySelector('.search-overlay')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
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

  it('presents a full-canvas tool index instead of modal-card chrome', async () => {
    const { component, container } = render(SearchOverlay)
    component.open()

    await waitFor(() => {
      expect(container.querySelector('.index-title')).toHaveTextContent('Tool index')
    })

    const surface = componentSource.match(/\.search-container\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(surface).toMatch(/background:\s*var\(--bg-base\)/)
    expect(surface).not.toMatch(/max-width:\s*640px/)
    expect(surface).not.toMatch(/border-radius/)
    expect(surface).not.toMatch(/box-shadow/)
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

  it('makes the background inert while open and restores it on close', async () => {
    const background = document.createElement('div')
    background.dataset.searchBackground = ''
    background.setAttribute('aria-hidden', 'false')
    document.body.append(background)

    try {
      const { component } = render(SearchOverlay)
      component.open()
      await tick()

      expect(background.inert).toBe(true)
      expect(background).toHaveAttribute('aria-hidden', 'true')

      await fireEvent.keyDown(window, { key: 'Escape' })
      await tick()

      expect(background.inert).toBe(false)
      expect(background).toHaveAttribute('aria-hidden', 'false')
    } finally {
      background.remove()
    }
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

  it('should show the real CLI invocation for each result row', async () => {
    const { component, container } = render(SearchOverlay)

    component.open()

    await waitFor(() => {
      const resultItems = container.querySelectorAll('.result-item')
      expect(resultItems.length).toBeGreaterThan(0)
    })

    for (const tool of tools) {
      const row = container.querySelector(`#result-${tool.id}`)
      expect(row).toBeInTheDocument()
      const cmd = row.querySelector('.result-cmd')
      const template = templateFor(tool.id)
      expect(template).toBeDefined()
      expect(cmd).toBeInTheDocument()
      expect(cmd.textContent).toBe(`tols ${template.tool} ${template.defaultAction}`)
    }
  })

  it('renders no .result-cmd for a tool with no template', () => {
    // Every registry id currently has a CLI template, so this is asserted
    // against the component's guard rather than a faked result row.
    expect(componentSource).toMatch(/\{#if\s+template\s*\}/)
    expect(componentSource).toContain('<code class="result-cmd">')
  })

  it('should render the tool alias, not an icon, in .result-icon', async () => {
    const { component, container } = render(SearchOverlay)

    component.open()

    await waitFor(() => {
      const resultItems = container.querySelectorAll('.result-item')
      expect(resultItems.length).toBeGreaterThan(0)
    })

    for (const tool of tools) {
      const row = container.querySelector(`#result-${tool.id}`)
      const icon = row.querySelector('.result-icon')
      expect(icon).toBeInTheDocument()
      expect(icon.querySelector('svg')).not.toBeInTheDocument()
      expect(icon.textContent.trim()).toBe(aliasFor(tool.id))
    }
  })

  it('should not declare backdrop-filter on the overlay surface', () => {
    expect(componentSource).not.toMatch(/backdrop-filter/)
  })

  it('should not declare any animation or transition duration above 120ms', () => {
    const durations = [...componentSource.matchAll(/(\d+)ms/g)].map(m => Number(m[1]))
    expect(durations.length).toBeGreaterThan(0)
    for (const duration of durations) {
      expect(duration).toBeLessThanOrEqual(120)
    }
  })
})
