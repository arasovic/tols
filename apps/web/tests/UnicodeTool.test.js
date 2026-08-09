import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import UnicodeTool from '$lib/tools/UnicodeTool.svelte'

const componentSource = readFileSync(
  resolve(process.cwd(), 'src/lib/tools/UnicodeTool.svelte'),
  'utf8'
)

describe('UnicodeTool', () => {
  beforeEach(() => {
    localStorage.clear()
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }
    })
  })

  it('initializes with the Unicode Inspector header', () => {
    render(UnicodeTool)
    expect(screen.getByText('Unicode Inspector')).toBeInTheDocument()
  })

  it('renders the mode-aware text input', () => {
    const { container } = render(UnicodeTool)
    expect(container.querySelector('.search-input')).toHaveAttribute('placeholder', 'Enter a Unicode code point...')
  })

  it('renders the Common Characters grid', () => {
    const { container } = render(UnicodeTool)
    expect(screen.getByText('Common Characters')).toBeInTheDocument()
    expect(container.querySelector('.char-grid')).toBeInTheDocument()
    expect(container.querySelectorAll('.char-btn').length).toBeGreaterThan(0)
  })

  it('keeps character and code-point copy controls on an Inspect result', async () => {
    const { container } = render(UnicodeTool)
    await fireEvent.input(screen.getByLabelText('Unicode code point'), { target: { value: 'A' } })
    expect(container.querySelectorAll('.char-actions .copy-btn')).toHaveLength(2)
  })

  it('defaults to an accessible Inspect mode', () => {
    render(UnicodeTool)
    expect(screen.getByRole('tablist', { name: 'Unicode mode' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Inspect' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Search' })).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByLabelText('Unicode code point')).toBeInTheDocument()
  })

  it('shows the default Unicode info command', () => {
    const { container } = render(UnicodeTool)
    expect(container.querySelector('.command-text')?.textContent?.trim()).toBe('tols unicode info')
  })

  it('inspects one astral code point immediately with every shared field', async () => {
    const { container } = render(UnicodeTool)
    const input = screen.getByLabelText('Unicode code point')
    await fireEvent.input(input, { target: { value: '😀x' } })
    expect(input).toHaveValue('😀')
    expect(container.querySelector('.char-display')?.textContent?.trim()).toBe('😀')
    const text = container.querySelector('.char-card')?.textContent ?? ''
    expect(text).toContain('U+1F600')
    expect(text).toContain('Dec: 128512')
    expect(text).toContain('Hex: 0x1F600')
    expect(text).toContain('HTML: &#128512;')
    expect(text).toContain('CSS: \\1F600')
    expect(text).toContain('JS: \\u{1F600}')
    expect(container.querySelector('.command-text')?.textContent?.trim()).toBe("tols unicode info '😀'")
  })

  it('searches only the common-character table', async () => {
    const { container } = render(UnicodeTool)
    await fireEvent.click(screen.getByRole('tab', { name: 'Search' }))
    await fireEvent.input(screen.getByLabelText('Common character search'), {
      target: { value: 'copyright' }
    })
    expect(container.querySelectorAll('.char-card')).toHaveLength(1)
    expect(container.querySelector('.char-display')?.textContent?.trim()).toBe('©')
    expect(container.textContent).not.toContain('C Character')
    expect(container.querySelector('.command-text')?.textContent?.trim()).toBe('tols unicode search copyright')
  })

  it('accepts a search query longer than the former ten-character cap', async () => {
    const { container } = render(UnicodeTool)
    await fireEvent.click(screen.getByRole('tab', { name: 'Search' }))
    const input = screen.getByLabelText('Common character search')
    await fireEvent.input(input, { target: { value: 'punctuation' } })
    expect(input).toHaveValue('punctuation')
    expect(input).not.toHaveAttribute('maxlength')
    expect(container.querySelectorAll('.char-card').length).toBeGreaterThan(0)
  })

  it('shows an honest empty state for an unmatched search', async () => {
    const { container } = render(UnicodeTool)
    await fireEvent.click(screen.getByRole('tab', { name: 'Search' }))
    await fireEvent.input(screen.getByLabelText('Common character search'), {
      target: { value: 'zzz-nope' }
    })
    expect(screen.getByText('No matching common characters')).toBeInTheDocument()
    expect(container.querySelectorAll('.char-card')).toHaveLength(0)
  })

  it('switches a common-character selection to Inspect', async () => {
    const { container } = render(UnicodeTool)
    await fireEvent.click(screen.getByRole('tab', { name: 'Search' }))
    await fireEvent.click(container.querySelector('.char-btn'))
    expect(screen.getByRole('tab', { name: 'Inspect' })).toHaveAttribute('aria-selected', 'true')
    const value = screen.getByLabelText('Unicode code point').value
    expect(value).not.toBe('')
    expect(container.querySelector('.command-text')?.textContent?.trim()).toBe(`tols unicode info '${value}'`)
  })

  it('copies the same Search command it displays', async () => {
    const { container } = render(UnicodeTool)
    await fireEvent.click(screen.getByRole('tab', { name: 'Search' }))
    await fireEvent.input(screen.getByLabelText('Common character search'), {
      target: { value: 'arrow' }
    })
    const expected = 'tols unicode search arrow'
    expect(container.querySelector('.command-text')?.textContent?.trim()).toBe(expected)
    await fireEvent.click(container.querySelector('.command-copy'))
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expected))
  })

  it('persists the selected mode and input across remount', async () => {
    const first = render(UnicodeTool)
    await fireEvent.click(screen.getByRole('tab', { name: 'Search' }))
    await fireEvent.input(screen.getByLabelText('Common character search'), {
      target: { value: 'arrow' }
    })
    first.unmount()
    const second = render(UnicodeTool)
    expect(screen.getByRole('tab', { name: 'Search' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByLabelText('Common character search')).toHaveValue('arrow')
    expect(second.container.querySelectorAll('.char-card')).toHaveLength(4)
  })

  it('reduces the current query when switching back to Inspect', async () => {
    const { container } = render(UnicodeTool)
    await fireEvent.click(screen.getByRole('tab', { name: 'Search' }))
    await fireEvent.input(screen.getByLabelText('Common character search'), {
      target: { value: 'arrow' }
    })
    await fireEvent.click(screen.getByRole('tab', { name: 'Inspect' }))
    expect(screen.getByLabelText('Unicode code point')).toHaveValue('a')
    expect(container.querySelector('.char-display')?.textContent?.trim()).toBe('a')
    expect(container.querySelector('.command-text')?.textContent?.trim()).toBe('tols unicode info a')
  })

  it('delegates first-code-point selection to the shared analyzer', () => {
    expect(componentSource).toContain("return analyzeChar(value)?.char ?? ''")
    expect(componentSource).not.toContain('Array.from(')
  })

  it('uses a theme token for active-mode contrast', () => {
    const activeRule = componentSource.match(/\.mode-btn\.active\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(activeRule).toContain('color: var(--bg-base)')
    expect(activeRule).not.toMatch(/\bwhite\b|#[0-9a-f]{3,8}/i)
  })
})
