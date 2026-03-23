import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import UnicodeTool from '$lib/tools/UnicodeTool.svelte'

function waitForDebounce(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('UnicodeTool', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with tool header', () => {
    render(UnicodeTool)
    expect(screen.getByText('Unicode Inspector')).toBeInTheDocument()
  })

  it('should have search input', () => {
    const { container } = render(UnicodeTool)

    expect(container.querySelector('.search-input')).toBeInTheDocument()
  })

  it('should display common characters grid', () => {
    render(UnicodeTool)

    expect(screen.getByText('Common Characters')).toBeInTheDocument()
  })

  it('should show character details when character clicked', async () => {
    const { container } = render(UnicodeTool)

    const charButtons = container.querySelectorAll('.char-btn')
    expect(charButtons.length).toBeGreaterThan(0)

    if (charButtons.length > 0) {
      await fireEvent.click(charButtons[0])

      await waitFor(() => {
        expect(container.querySelector('.char-card')).toBeInTheDocument()
      }, { timeout: 500 })
    }
  })

  it('should search for characters', async () => {
    const { container } = render(UnicodeTool)

    const searchInput = container.querySelector('.search-input')
    await fireEvent.input(searchInput, { target: { value: 'copyright' } })

    await waitForDebounce(400)

    const results = container.querySelector('.results')
    expect(results).toBeInTheDocument()
  })

  it('should show character information including codepoint', async () => {
    const { container } = render(UnicodeTool)

    const searchInput = container.querySelector('.search-input')
    await fireEvent.input(searchInput, { target: { value: 'a' } })

    await waitForDebounce(400)

    const results = container.querySelector('.results')
    expect(results?.textContent).toContain('U+')
  })

  it('should show empty message when no results', async () => {
    const { container } = render(UnicodeTool)

    const searchInput = container.querySelector('.search-input')
    await fireEvent.input(searchInput, { target: { value: 'xyz123nonexistent' } })

    await waitForDebounce(400)

    expect(screen.getByText('No characters found')).toBeInTheDocument()
  })

  it('should display character codes', async () => {
    const { container } = render(UnicodeTool)

    const searchInput = container.querySelector('.search-input')
    await fireEvent.input(searchInput, { target: { value: 'A' } })

    await waitForDebounce(400)

    const results = container.querySelector('.results')
    expect(results?.textContent).toContain('Dec:')
    expect(results?.textContent).toContain('HTML:')
    expect(results?.textContent).toContain('JS:')
  })

  it('should have copy buttons for characters', async () => {
    const { container } = render(UnicodeTool)

    const searchInput = container.querySelector('.search-input')
    await fireEvent.input(searchInput, { target: { value: 'A' } })

    await waitForDebounce(400)

    const copyButtons = container.querySelectorAll('.char-actions .copy-btn')
    expect(copyButtons.length).toBeGreaterThan(0)
  })

  it('should render character grid with clickable buttons', () => {
    const { container } = render(UnicodeTool)

    const charGrid = container.querySelector('.char-grid')
    expect(charGrid).toBeInTheDocument()

    const charButtons = container.querySelectorAll('.char-btn')
    expect(charButtons.length).toBeGreaterThan(0)
  })
})
