import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import UrlTool from '$lib/tools/UrlTool.svelte'

describe('UrlTool', () => {
  let component

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    localStorage.clear()
    component = render(UrlTool)
  })

  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('should show textarea for text entry on mount', () => {
    const inputArea = screen.getByLabelText(/Text to encode/i)
    expect(inputArea).toBeInTheDocument()
  })

  it('should encode text correctly', async () => {
    const inputArea = screen.getByLabelText(/Text to encode/i)
    await fireEvent.input(inputArea, { target: { value: 'hello world' } })

    vi.advanceTimersByTime(200)
    await waitFor(() => {
      const outputContent = screen.getByTestId('output-content')
      expect(outputContent?.textContent).toBe('hello%20world')
    })
  })

  it('should decode URL-encoded text', async () => {
    const decodeButton = screen.getByRole('tab', { name: /Decode/i })
    await fireEvent.click(decodeButton)

    const inputArea = screen.getByLabelText(/URL-encoded text to decode/i)
    await fireEvent.input(inputArea, { target: { value: 'hello%20world' } })

    vi.advanceTimersByTime(200)
    await waitFor(() => {
      const outputContent = screen.getByTestId('output-content')
      expect(outputContent?.textContent).toBe('hello world')
    })
  })

  it('should show empty state for empty input', async () => {
    const inputArea = screen.getByLabelText(/Text to encode/i)
    await fireEvent.input(inputArea, { target: { value: '' } })

    vi.advanceTimersByTime(200)
    await waitFor(() => {
      const emptyState = document.querySelector('.empty-state')
      expect(emptyState).toBeInTheDocument()
    })
  })

  it('should show error for invalid URL decode', async () => {
    const decodeButton = screen.getByRole('tab', { name: /Decode/i })
    await fireEvent.click(decodeButton)

    const inputArea = screen.getByLabelText(/URL-encoded text to decode/i)
    await fireEvent.input(inputArea, { target: { value: '%invalid' } })

    vi.advanceTimersByTime(200)
    await waitFor(() => {
      const errorElement = screen.getByRole('alert')
      expect(errorElement).toBeInTheDocument()
      expect(errorElement?.textContent).toContain('Invalid input for URL decoding')
    })
  })

  it('should extract path, query and hash from URL in encode mode', async () => {
    const inputArea = screen.getByLabelText(/Text to encode/i)
    await fireEvent.input(inputArea, { target: { value: 'https://example.com/path/to/page?param=value#section' } })

    vi.advanceTimersByTime(200)

    const extractButton = screen.getByRole('button', { name: /Extract path, query and hash from URL/i })
    await fireEvent.click(extractButton)

    await waitFor(() => {
      const outputContent = screen.getByTestId('output-content')
      expect(outputContent?.textContent).toBe('%2Fpath%2Fto%2Fpage%3Fparam%3Dvalue%23section')
    })
  })

  it('should extract pathname from URL', async () => {
    const inputArea = screen.getByLabelText(/Text to encode/i)
    await fireEvent.input(inputArea, { target: { value: 'https://example.com/path/to/page?param=value' } })

    vi.advanceTimersByTime(200)

    const extractButton = screen.getByRole('button', { name: /Extract pathname from URL/i })
    await fireEvent.click(extractButton)

    await waitFor(() => {
      const outputContent = screen.getByTestId('output-content')
      expect(outputContent?.textContent).toBe('%2Fpath%2Fto%2Fpage')
    })
  })

  it('should extract query parameters from URL', async () => {
    const inputArea = screen.getByLabelText(/Text to encode/i)
    await fireEvent.input(inputArea, { target: { value: 'https://example.com/path?param1=value1&param2=value2' } })

    vi.advanceTimersByTime(200)

    const extractButton = screen.getByRole('button', { name: /Extract query parameters from URL/i })
    await fireEvent.click(extractButton)

    await waitFor(() => {
      const outputContent = screen.getByTestId('output-content')
      expect(outputContent?.textContent).toBe('param1%3Dvalue1%26param2%3Dvalue2')
    })
  })

  it('should show error for invalid URL when extracting', async () => {
    const inputArea = screen.getByLabelText(/Text to encode/i)
    await fireEvent.input(inputArea, { target: { value: 'not-a-url' } })

    const extractButton = screen.getByRole('button', { name: /Extract path, query and hash from URL/i })
    await fireEvent.click(extractButton)

    await waitFor(() => {
      const errorElement = screen.getByRole('alert')
      expect(errorElement?.textContent?.toLowerCase()).toMatch(/invalid|error/)
    })
  })

  it('should clear all fields when clear button is clicked', async () => {
    const inputArea = screen.getByLabelText(/Text to encode/i)
    await fireEvent.input(inputArea, { target: { value: 'test text' } })

    vi.advanceTimersByTime(200)

    const clearButton = screen.getByRole('button', { name: /Clear/i })
    await fireEvent.click(clearButton)

    expect((/** @type {HTMLTextAreaElement} */ (inputArea)).value).toBe('')

    const emptyState = document.querySelector('.empty-state')
    expect(emptyState).toBeInTheDocument()
  })

  it('should debounce input changes', async () => {
    const inputArea = screen.getByLabelText(/Text to encode/i)

    await fireEvent.input(inputArea, { target: { value: 'test' } })
    await fireEvent.input(inputArea, { target: { value: 'test 2' } })
    await fireEvent.input(inputArea, { target: { value: 'test 3' } })

    vi.advanceTimersByTime(300)

    await waitFor(() => {
      const outputContent = screen.getByTestId('output-content')
      expect(outputContent?.textContent).toBe('test%203')
    })
  })

  it('should maintain mode switching state correctly', async () => {
    const encodeTab = screen.getByRole('tab', { name: /Encode/i })
    const decodeTab = screen.getByRole('tab', { name: /Decode/i })

    expect(encodeTab).toHaveAttribute('aria-selected', 'true')
    expect(decodeTab).toHaveAttribute('aria-selected', 'false')

    await fireEvent.click(decodeTab)

    expect(decodeTab).toHaveAttribute('aria-selected', 'true')
    expect(encodeTab).toHaveAttribute('aria-selected', 'false')
  })

  describe('localStorage persistence', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    it('should save input to localStorage', async () => {
      const inputArea = screen.getByLabelText(/Text to encode/i)
      await fireEvent.input(inputArea, { target: { value: 'test input' } })

      vi.advanceTimersByTime(700)

      expect(localStorage.getItem('devutils-url-input')).toBe('test input')
    })

    it('should save mode to localStorage', async () => {
      const decodeTab = screen.getByRole('tab', { name: /Decode/i })
      await fireEvent.click(decodeTab)

      vi.advanceTimersByTime(700)

      expect(localStorage.getItem('devutils-url-mode')).toBe('decode')
    })

    it.skip('should load saved input from localStorage on mount', async () => {
      localStorage.setItem('devutils-url-input', 'saved input')
      localStorage.setItem('devutils-url-mode', 'decode')

      const { container } = render(UrlTool)

      vi.advanceTimersByTime(500)

      const inputArea = container.querySelector('.input-area')
      expect((/** @type {HTMLTextAreaElement} */ (inputArea)).value).toBe('saved input')
    })

    it('should clear localStorage when clear button is clicked', async () => {
      const inputArea = screen.getByLabelText(/Text to encode/i)
      await fireEvent.input(inputArea, { target: { value: 'test input' } })

      vi.advanceTimersByTime(700)

      expect(localStorage.getItem('devutils-url-input')).toBe('test input')

      const clearButton = screen.getByRole('button', { name: /Clear/i })
      await fireEvent.click(clearButton)

      expect(localStorage.getItem('devutils-url-input')).toBeNull()
      expect(localStorage.getItem('devutils-url-mode')).toBeNull()
    })
  })

  describe('Unicode support', () => {
    it('should handle Unicode characters in encoding', async () => {
      const inputArea = screen.getByLabelText(/Text to encode/i)
      await fireEvent.input(inputArea, { target: { value: 'Hello 世界 🌍' } })

      vi.advanceTimersByTime(200)

      await waitFor(() => {
        const outputContent = screen.getByTestId('output-content')
        expect(outputContent?.textContent).toBe('Hello%20%E4%B8%96%E7%95%8C%20%F0%9F%8C%8D')
      })
    })

    it('should handle Unicode characters in decoding', async () => {
      const decodeTab = screen.getByRole('tab', { name: /Decode/i })
      await fireEvent.click(decodeTab)

      const inputArea = screen.getByLabelText(/URL-encoded text to decode/i)
      await fireEvent.input(inputArea, { target: { value: 'Hello%20%E4%B8%96%E7%95%8C%20%F0%9F%8C%8D' } })

      vi.advanceTimersByTime(200)

      await waitFor(() => {
        const outputContent = screen.getByTestId('output-content')
        expect(outputContent?.textContent).toBe('Hello 世界 🌍')
      })
    })
  })

  describe('Mode switching with content', () => {
    it('should re-process content when switching modes', async () => {
      const inputArea = screen.getByLabelText(/Text to encode/i)
      await fireEvent.input(inputArea, { target: { value: 'hello%ZZworld' } })

      vi.advanceTimersByTime(200)

      await waitFor(() => {
        const outputContent = screen.getByTestId('output-content')
        expect(outputContent?.textContent).toBe('hello%25ZZworld')
      })

      const decodeTab = screen.getByRole('tab', { name: /Decode/i })
      await fireEvent.click(decodeTab)

      vi.runAllTimers()

      await waitFor(() => {
        const errorElement = document.querySelector('.error-state')
        expect(errorElement).toBeInTheDocument()
      })
    })

    it('should switch from decode to encode successfully with encoded input', async () => {
      const decodeTab = screen.getByRole('tab', { name: /Decode/i })
      await fireEvent.click(decodeTab)

      const inputArea = screen.getByLabelText(/URL-encoded text to decode/i)
      await fireEvent.input(inputArea, { target: { value: 'hello%20world' } })

      vi.advanceTimersByTime(200)

      await waitFor(() => {
        const outputContent = screen.getByTestId('output-content')
        expect(outputContent?.textContent).toBe('hello world')
      })

      const encodeTab = screen.getByRole('tab', { name: /Encode/i })
      await fireEvent.click(encodeTab)

      await waitFor(() => {
        const outputContent = screen.getByTestId('output-content')
        expect(outputContent?.textContent).toBe('hello%2520world')
      })
    })
  })

  describe('CopyButton integration', () => {
    it('should show CopyButton when there is output', async () => {
      const inputArea = screen.getByLabelText(/Text to encode/i)
      await fireEvent.input(inputArea, { target: { value: 'hello world' } })

      vi.advanceTimersByTime(200)

      await waitFor(() => {
        const copyButton = document.querySelector('.copy-btn')
        expect(copyButton).toBeInTheDocument()
      })
    })

    it('should not show CopyButton when there is no output', () => {
      const copyButton = document.querySelector('.copy-btn')
      expect(copyButton).not.toBeInTheDocument()
    })
  })

  describe('Character count badge', () => {
    it('should show correct input character count', async () => {
      const inputArea = screen.getByLabelText(/Text to encode/i)
      await fireEvent.input(inputArea, { target: { value: 'hello world' } })

      vi.advanceTimersByTime(200)

      const inputCount = screen.getByTestId('input-char-count')
      expect(inputCount?.textContent).toBe('11 chars')
    })

    it('should show correct output character count', async () => {
      const inputArea = screen.getByLabelText(/Text to encode/i)
      await fireEvent.input(inputArea, { target: { value: 'hello world' } })

      vi.advanceTimersByTime(200)

      await waitFor(() => {
        const outputCount = screen.getByTestId('output-char-count')
        expect(outputCount?.textContent).toBe('13 chars')
      })
    })
  })

  describe('Whitespace handling', () => {
    it('should treat whitespace-only input as empty', async () => {
      const inputArea = screen.getByLabelText(/Text to encode/i)
      await fireEvent.input(inputArea, { target: { value: '   \t\n  ' } })

      vi.advanceTimersByTime(200)

      const emptyState = document.querySelector('.empty-state')
      expect(emptyState).toBeInTheDocument()
    })
  })

  describe('Long input handling', () => {
    it('should handle very long input strings', async () => {
      const longInput = 'a'.repeat(10000)
      const inputArea = screen.getByLabelText(/Text to encode/i)
      await fireEvent.input(inputArea, { target: { value: longInput } })

      vi.advanceTimersByTime(200)

      await waitFor(() => {
        const outputContent = screen.getByTestId('output-content')
        expect(outputContent?.textContent).toHaveLength(10000)
      })
    })

    it('should respect maxlength attribute', () => {
      const inputArea = screen.getByLabelText(/Text to encode/i)
      expect(inputArea).toHaveAttribute('maxlength', '100000')
    })
  })

  describe('Accessibility', () => {
    it('should have role="tablist" on mode toggle container', () => {
      const modeToggle = document.querySelector('.mode-toggle')
      expect(modeToggle).toHaveAttribute('role', 'tablist')
    })

    it('should have aria-selected on mode buttons', () => {
      const encodeTab = screen.getByRole('tab', { name: /Encode/i })
      const decodeTab = screen.getByRole('tab', { name: /Decode/i })

      expect(encodeTab).toHaveAttribute('aria-selected', 'true')
      expect(decodeTab).toHaveAttribute('aria-selected', 'false')
    })

    it('should have role="alert" on error state', async () => {
      const decodeTab = screen.getByRole('tab', { name: /Decode/i })
      await fireEvent.click(decodeTab)

      const inputArea = screen.getByLabelText(/URL-encoded text to decode/i)
      await fireEvent.input(inputArea, { target: { value: '%invalid' } })

      vi.advanceTimersByTime(200)

      await waitFor(() => {
        const errorElement = document.querySelector('.error-state')
        expect(errorElement).toHaveAttribute('role', 'alert')
      })
    })

    it('should have aria-label on extract buttons', () => {
      const extractButton = screen.getByRole('button', { name: /Extract path, query and hash from URL/i })
      expect(extractButton).toBeInTheDocument()
    })

    it('should have aria-label on textarea', () => {
      const inputArea = screen.getByLabelText(/Text to encode/i)
      expect(inputArea).toBeInTheDocument()
    })

    it('should have type="button" on all buttons', () => {
      const buttons = document.querySelectorAll('button')
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button')
      })
    })
  })
})
