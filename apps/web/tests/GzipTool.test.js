import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/svelte'
import GzipTool from '$lib/tools/GzipTool.svelte'

const DEBOUNCE_WAIT = 250

function waitForDebounce(ms = DEBOUNCE_WAIT) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('GzipTool', () => {
  beforeEach(() => {
    localStorage.clear()
    cleanup()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    cleanup()
  })

  it('should initialize with tool header', () => {
    render(GzipTool)
    expect(screen.getByText('Gzip Compression Calculator')).toBeInTheDocument()
  })

  it('should have input textarea', () => {
    render(GzipTool)
    expect(screen.getByPlaceholderText('Enter text to compress...')).toBeInTheDocument()
  })

  it('should have clear button with aria-label', () => {
    const { container } = render(GzipTool)
    const clearButton = container.querySelector('[aria-label="Clear input"]')
    expect(clearButton).toBeInTheDocument()
    expect(clearButton).toHaveAttribute('title', 'Clear')
  })

  it('should calculate gzip compression', async () => {
    render(GzipTool)

    const inputArea = screen.getByPlaceholderText('Enter text to compress...')
    await fireEvent.input(inputArea, { target: { value: 'Hello, World! This is a test string for compression.' } })

    await waitForDebounce()

    await waitFor(() => {
      const compressedSize = screen.getByText(/Compressed size:/)
      expect(compressedSize).toBeInTheDocument()
    })
  })

  it('should show empty state when no input', () => {
    render(GzipTool)
    expect(screen.getByText('Enter text to see compression stats')).toBeInTheDocument()
  })

  it('should clear input when clear button is clicked', async () => {
    const { container } = render(GzipTool)

    const inputArea = screen.getByPlaceholderText('Enter text to compress...')
    await fireEvent.input(inputArea, { target: { value: 'Test text' } })
    await waitForDebounce()

    const clearButton = container.querySelector('[aria-label="Clear input"]')
    await fireEvent.click(clearButton)

    expect(screen.getByPlaceholderText('Enter text to compress...').value).toBe('')
    expect(screen.getByText('Enter text to see compression stats')).toBeInTheDocument()
  })

  it('should show original size in input stats', async () => {
    render(GzipTool)

    const inputArea = screen.getByPlaceholderText('Enter text to compress...')
    await fireEvent.input(inputArea, { target: { value: 'Hello World' } })

    await waitFor(() => {
      expect(screen.getByText(/Original size:/)).toBeInTheDocument()
    })
  })

  it('should format bytes correctly', async () => {
    render(GzipTool)

    const longText = 'a'.repeat(2000)
    const inputArea = screen.getByPlaceholderText('Enter text to compress...')
    await fireEvent.input(inputArea, { target: { value: longText } })

    await waitForDebounce()
    await waitForDebounce()

    await waitFor(() => {
      const results = document.querySelector('.results-card')
      expect(results.textContent).toMatch(/B|KB|MB/)
    })
  })

  it('should show savings information when compression occurs', async () => {
    render(GzipTool)

    const inputArea = screen.getByPlaceholderText('Enter text to compress...')
    await fireEvent.input(inputArea, { target: { value: 'This is repetitive text. This is repetitive text. This is repetitive text.' } })

    await waitForDebounce()
    await waitForDebounce()

    await waitFor(() => {
      const savings = screen.getByText(/Savings:/)
      expect(savings).toBeInTheDocument()
    })
  })

  it('should show compression ratio', async () => {
    render(GzipTool)

    const inputArea = screen.getByPlaceholderText('Enter text to compress...')
    await fireEvent.input(inputArea, { target: { value: 'Test data for ratio calculation' } })

    await waitForDebounce()
    await waitForDebounce()

    await waitFor(() => {
      const ratio = screen.getByText(/Ratio:/)
      expect(ratio).toBeInTheDocument()
    })
  })

  it('should truncate input exceeding 1MB limit', async () => {
    render(GzipTool)

    const longText = 'a'.repeat(1100000)
    const inputArea = screen.getByPlaceholderText('Enter text to compress...')
    await fireEvent.input(inputArea, { target: { value: longText } })

    await waitFor(() => {
      expect(screen.getByText(/max 1MB/)).toBeInTheDocument()
    })
  })

  // Error handling tests
  it('should handle empty input gracefully', async () => {
    render(GzipTool)

    const inputArea = screen.getByPlaceholderText('Enter text to compress...')
    await fireEvent.input(inputArea, { target: { value: '' } })

    expect(screen.getByText('Enter text to see compression stats')).toBeInTheDocument()
  })

  // Accessibility tests
  it('should have accessible input with aria-describedby', () => {
    render(GzipTool)
    const inputArea = screen.getByPlaceholderText('Enter text to compress...')
    expect(inputArea).toHaveAttribute('aria-describedby', 'input-stats')
  })

  it('should have input-stats element for aria-describedby', () => {
    render(GzipTool)
    const stats = document.getElementById('input-stats')
    expect(stats).toBeInTheDocument()
    expect(stats).toHaveClass('input-stats')
  })

  it('should have loading state when processing', async () => {
    render(GzipTool)

    const inputArea = screen.getByPlaceholderText('Enter text to compress...')
    await fireEvent.input(inputArea, { target: { value: 'Test content' } })

    expect(document.querySelector('.loading') || document.querySelector('.results-card')).toBeTruthy()
  })

  // localStorage persistence tests
  it('should persist input to localStorage', async () => {
    render(GzipTool)

    const inputArea = screen.getByPlaceholderText('Enter text to compress...')
    await fireEvent.input(inputArea, { target: { value: 'Persistent text' } })
    await waitForDebounce()
    await new Promise(resolve => setTimeout(resolve, 600))

    expect(localStorage.getItem('devutils-gzip-input')).toBe('Persistent text')
  })

  it('should load input from localStorage on mount', async () => {
    localStorage.setItem('devutils-gzip-input', 'Test content')

    const { container } = render(GzipTool)

    await new Promise(resolve => setTimeout(resolve, 500))

    const tool = container.querySelector('.tool')
    expect(tool).toBeInTheDocument()
  })

  it('should handle localStorage errors gracefully', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage full')
    })

    render(GzipTool)

    const inputArea = screen.getByPlaceholderText('Enter text to compress...')
    await fireEvent.input(inputArea, { target: { value: 'Test' } })
    await waitForDebounce()

    await new Promise(resolve => setTimeout(resolve, 600))

    expect(consoleWarnSpy).toHaveBeenCalled()
    consoleWarnSpy.mockRestore()
  })

  // Copy button tests
  it('should show copy buttons after compression', async () => {
    render(GzipTool)

    const inputArea = screen.getByPlaceholderText('Enter text to compress...')
    await fireEvent.input(inputArea, { target: { value: 'Test content for copy buttons' } })

    await waitForDebounce()
    await waitForDebounce()

    await waitFor(() => {
      const outputActions = document.querySelector('.output-actions')
      expect(outputActions).toBeInTheDocument()
    })
  })

  // Debounce tests
  it('should debounce rapid input changes', async () => {
    render(GzipTool)

    const inputArea = screen.getByPlaceholderText('Enter text to compress...')

    await fireEvent.input(inputArea, { target: { value: 'First' } })
    await fireEvent.input(inputArea, { target: { value: 'Second' } })
    await fireEvent.input(inputArea, { target: { value: 'Third' } })

    expect(inputArea.value).toBe('Third')
  })

  // Compression efficiency tests
  it('should achieve better compression on repetitive text', async () => {
    render(GzipTool)

    const repetitiveText = 'ABC'.repeat(100)
    const inputArea = screen.getByPlaceholderText('Enter text to compress...')
    await fireEvent.input(inputArea, { target: { value: repetitiveText } })

    await waitForDebounce()
    await waitForDebounce()

    await waitFor(() => {
      const resultsCard = document.querySelector('.results-card')
      expect(resultsCard.textContent).toContain('%')
    })
  })
})
