import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/svelte'
import ToolCard from '$lib/components/ToolCard.svelte'
import SearchOverlay from '$lib/components/SearchOverlay.svelte'
import { Code } from 'lucide-svelte'
import { escapeHtml } from '$lib/utils/html.js'

vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}))

vi.mock('$app/environment', () => ({
  browser: true
}))

vi.mock('$lib/config/searchConfig.js', async () => {
  const { Code } = await import('lucide-svelte')
  const searchTools = [
    {
      id: 'evil',
      name: '<img src=x onerror=alert(1)>',
      description: 'a & b <script>',
      category: 'data',
      categoryLabel: 'Data',
      icon: Code,
      path: '/evil',
      aliases: []
    },
    {
      id: 'dz',
      name: 'ǆungel',
      description: 'decomposed test',
      category: 'data',
      categoryLabel: 'Data',
      icon: Code,
      path: '/dz',
      aliases: []
    },
    {
      id: 'cafe',
      name: 'café',
      description: 'diacritic test',
      category: 'data',
      categoryLabel: 'Data',
      icon: Code,
      path: '/cafe',
      aliases: []
    }
  ]
  return {
    searchTools,
    searchToolsFuzzy: (query) => (query.trim() ? searchTools : [])
  }
})

vi.mock('$lib/stores/recentTools.js', () => ({
  recentTools: {
    subscribe: vi.fn((cb) => {
      cb([])
      return () => {}
    })
  },
  addRecent: vi.fn()
}))

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)> & "q" \'a\'')).toBe(
      '&lt;img src=x onerror=alert(1)&gt; &amp; &quot;q&quot; &#39;a&#39;'
    )
  })

  it('leaves plain text unchanged', () => {
    expect(escapeHtml('plain text 123')).toBe('plain text 123')
  })
})

describe('ToolCard highlightMatch', () => {
  const icon = Code

  it('escapes HTML in the name and marks only genuine matches', () => {
    const { container } = render(ToolCard, {
      props: {
        tool: { path: 'evil', name: '<img src=x onerror=alert(1)>', desc: 'a & b <script>', icon },
        query: 'img'
      }
    })
    const name = container.querySelector('.tool-name')
    expect(name.innerHTML).toBe('&lt;<mark>img</mark> src=x onerror=alert(1)&gt;')
    const desc = container.querySelector('.tool-desc')
    expect(desc.innerHTML).toBe('a &amp; b &lt;script&gt;')
  })

  it('keeps plain highlighting unchanged', () => {
    const { container } = render(ToolCard, {
      props: {
        tool: { path: 'json', name: 'JSON Formatter', desc: 'Format JSON', icon },
        query: 'json'
      }
    })
    const name = container.querySelector('.tool-name')
    expect(name.innerHTML).toBe('<mark>JSON</mark> Formatter')
  })
})

describe('SearchOverlay highlightMatch', () => {
  async function openWithQuery(component, container, value) {
    component.open()
    await waitFor(() => {
      expect(container.querySelector('.search-input')).toBeInTheDocument()
    })
    const input = container.querySelector('.search-input')
    await fireEvent.input(input, { target: { value } })
    await waitFor(() => {
      expect(container.querySelectorAll('.result-title').length).toBeGreaterThan(0)
    })
  }

  it('escapes HTML in results and marks only genuine matches', async () => {
    const { component, container } = render(SearchOverlay)
    await openWithQuery(component, container, 'img')

    const resultTitle = container.querySelector('.result-title')
    expect(resultTitle.innerHTML).toContain('&lt;')
    expect(resultTitle.innerHTML).toContain('<mark>i</mark><mark>m</mark><mark>g</mark>')
    expect(resultTitle.innerHTML).not.toContain('<img')
  })

  it('highlights decomposed characters without duplicating them', async () => {
    const { component, container } = render(SearchOverlay)
    await openWithQuery(component, container, 'dz')

    const titles = Array.from(container.querySelectorAll('.result-title'))
    const dzTitle = titles.find(t => t.textContent.includes('ǆ'))
    expect(dzTitle).toBeDefined()
    expect(dzTitle.innerHTML).toBe('<mark>ǆ</mark>ungel')
    expect(dzTitle.innerHTML.match(/ǆ/g)).toHaveLength(1)
  })

  it('highlights the original accented character for a normalized query', async () => {
    const { component, container } = render(SearchOverlay)
    await openWithQuery(component, container, 'cafe')

    const titles = Array.from(container.querySelectorAll('.result-title'))
    const cafeTitle = titles.find(t => t.textContent.includes('café'))
    expect(cafeTitle).toBeDefined()
    expect(cafeTitle.innerHTML).toContain('<mark>é</mark>')
  })
})