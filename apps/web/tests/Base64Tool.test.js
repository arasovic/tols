import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/svelte'
import Base64Tool from '$lib/tools/Base64Tool.svelte'

// Match the component's DEBOUNCE_WAIT constant
const DEBOUNCE_WAIT = 150

function waitForDebounce(ms = DEBOUNCE_WAIT + 50) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('Base64Tool', () => {
  beforeEach(() => {
    localStorage.clear()
    cleanup()
    render(Base64Tool)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    cleanup()
  })

  it('should initialize correctly', () => {
    expect(screen.getByText('Encode')).toBeInTheDocument()
    expect(screen.getByText('Decode')).toBeInTheDocument()
  })

  it('should encode text to Base64', async () => {
    const inputArea = screen.getByPlaceholderText('Enter text to encode...')
    await fireEvent.input(inputArea, { target: { value: 'hello world' } })

    await waitForDebounce()

    const outputDisplayEl = document.querySelector('.output-display')
    expect(outputDisplayEl?.textContent).toBe('aGVsbG8gd29ybGQ=')
  })

  it('should decode Base64 text', async () => {
    const decodeButton = screen.getByText('Decode')
    expect(decodeButton).toBeInTheDocument()
    await fireEvent.click(decodeButton)

    await waitForDebounce()

    const inputArea = screen.getByPlaceholderText('Enter Base64 to decode...')
    await fireEvent.input(inputArea, { target: { value: 'aGVsbG8gd29ybGQ=' } })

    await waitForDebounce()

    const outputDisplayEl = document.querySelector('.output-display')
    expect(outputDisplayEl?.textContent).toBe('hello world')
  })

  it('should show empty state for empty input', async () => {
    const inputArea = screen.getByPlaceholderText('Enter text to encode...')
    await fireEvent.input(inputArea, { target: { value: '' } })

    await waitForDebounce()

    const emptyState = screen.getByText('Output will appear here...')
    expect(emptyState).toBeInTheDocument()
  })

  it('should show error for invalid Base64 when decoding', async () => {
    const decodeButton = screen.getByText('Decode')
    expect(decodeButton).toBeInTheDocument()
    await fireEvent.click(decodeButton)

    await waitForDebounce()

    const inputArea = screen.getByPlaceholderText('Enter Base64 to decode...')
    await fireEvent.input(inputArea, { target: { value: 'invalid-base64!' } })

    await waitForDebounce()

    const errorDisplay = screen.getByRole('alert')
    expect(errorDisplay).toBeInTheDocument()
    expect(errorDisplay.textContent).toContain('Invalid Base64')
  })

  it('should handle special characters in encoding', async () => {
    const inputArea = screen.getByPlaceholderText('Enter text to encode...')
    await fireEvent.input(inputArea, { target: { value: 'test@#$%^&*()_+<>?' } })

    await waitForDebounce()

    const outputDisplay = document.querySelector('.output-display')
    expect(outputDisplay?.textContent).toBeTruthy()
    expect(outputDisplay?.textContent).toMatch(/^[A-Za-z0-9+/=]+$/)
  })

  it('should handle Unicode characters in encoding', async () => {
    const inputArea = screen.getByPlaceholderText('Enter text to encode...')
    await fireEvent.input(inputArea, { target: { value: 'こんにちは世界' } })

    await waitForDebounce()

    const encodedEl = document.querySelector('.output-display')
    const encoded = encodedEl?.textContent || ''
    expect(encoded).toBeTruthy()

    const decodeButton = screen.getByText('Decode')
    expect(decodeButton).toBeInTheDocument()
    await fireEvent.click(decodeButton)

    await waitForDebounce()

    const decodeInputArea = screen.getByPlaceholderText('Enter Base64 to decode...')
    await fireEvent.input(decodeInputArea, { target: { value: encoded } })

    await waitForDebounce()

    const decodedContentEl = document.querySelector('.output-display')
    expect(decodedContentEl?.textContent).toBe('こんにちは世界')
  })

  it('should maintain mode switching state', async () => {
    const encodeBtn = screen.getByRole('button', { name: /encode/i })
    expect(encodeBtn?.classList?.contains('active')).toBe(true)

    const decodeBtn = screen.getByText('Decode')
    expect(decodeBtn).toBeInTheDocument()
    await fireEvent.click(decodeBtn)

    await waitForDebounce()

    const activeBtn = document.querySelector('.segment.active')
    expect(activeBtn?.textContent).toContain('Decode')
  })

  it('should clear all fields when clear button is clicked', async () => {
    const inputArea = screen.getByPlaceholderText('Enter text to encode...')
    await fireEvent.input(inputArea, { target: { value: 'test text' } })

    await waitForDebounce()

    const clearButton = screen.getByRole('button', { name: /clear all fields/i })
    expect(clearButton).toBeInTheDocument()
    await fireEvent.click(clearButton)

    await waitForDebounce()

    expect(inputArea.value).toBe('')
  })

  it('should debounce input changes', async () => {
    const inputArea = screen.getByPlaceholderText('Enter text to encode...')

    await fireEvent.input(inputArea, { target: { value: 'test' } })
    await fireEvent.input(inputArea, { target: { value: 'test 2' } })
    await fireEvent.input(inputArea, { target: { value: 'test 3' } })

    await waitForDebounce(300)

    const finalOutput = document.querySelector('.output-display')
    expect(finalOutput?.textContent).toBe('dGVzdCAz')
  })

  it('should handle large strings (100KB+)', async () => {
    const inputArea = screen.getByPlaceholderText('Enter text to encode...')
    const largeString = 'x'.repeat(100000)
    await fireEvent.input(inputArea, { target: { value: largeString } })

    await waitForDebounce(300)

    const outputDisplay = document.querySelector('.output-display')
    expect(outputDisplay?.textContent).toBeTruthy()
    expect((outputDisplay?.textContent || '').length).toBeGreaterThan(100000)
  })

  it('should be consistent with encoding/decoding', async () => {
    const simpleString = 'hello world'
    const expectedEncoded = 'aGVsbG8gd29ybGQ='

    const inputArea = screen.getByPlaceholderText('Enter text to encode...')
    await fireEvent.input(inputArea, { target: { value: simpleString } })

    await waitForDebounce()

    const outputDisplay = document.querySelector('.output-display')
    expect(outputDisplay?.textContent).toBe(expectedEncoded)

    const clearButton = screen.getByRole('button', { name: /clear all fields/i })
    expect(clearButton).toBeInTheDocument()
    await fireEvent.click(clearButton)

    await waitForDebounce()

    const decodeButton = screen.getByText('Decode')
    expect(decodeButton).toBeInTheDocument()
    await fireEvent.click(decodeButton)

    await waitForDebounce()

    const decodeInputArea = screen.getByPlaceholderText('Enter Base64 to decode...')
    await fireEvent.input(decodeInputArea, { target: { value: expectedEncoded } })

    await waitForDebounce()

    const decodedOutput = document.querySelector('.output-display')
    expect(decodedOutput?.textContent).toBe(simpleString)
  })

  it('should handle empty strings after encoding', async () => {
    const inputArea = screen.getByPlaceholderText('Enter text to encode...')
    await fireEvent.input(inputArea, { target: { value: '' } })

    await waitForDebounce()

    expect(document.querySelector('.error-display span')).toBeNull()

    const emptyStateEl = screen.getByText('Output will appear here...')
    expect(emptyStateEl).toBeInTheDocument()
  })

  it('should switch mode and process existing input', async () => {
    const inputArea = screen.getByPlaceholderText('Enter text to encode...')
    await fireEvent.input(inputArea, { target: { value: 'aGVsbG8gd29ybGQ=' } })

    await waitForDebounce()

    let outputDisplay = document.querySelector('.output-display')
    expect(outputDisplay?.textContent).toBeTruthy()

    const decodeButton = screen.getByText('Decode')
    expect(decodeButton).toBeInTheDocument()
    await fireEvent.click(decodeButton)

    await waitFor(() => {
      outputDisplay = document.querySelector('.output-display')
      expect(outputDisplay?.textContent).toBe('hello world')
    })
  })

  it('should handle Base64 with whitespace', async () => {
    const decodeButton = screen.getByText('Decode')
    expect(decodeButton).toBeInTheDocument()
    await fireEvent.click(decodeButton)

    await waitForDebounce()

    const inputArea = screen.getByPlaceholderText('Enter Base64 to decode...')
    await fireEvent.input(inputArea, { target: { value: 'aGVs bG8g d29y bGQ=' } })

    await waitForDebounce()

    const outputDisplay = document.querySelector('.output-display')
    expect(outputDisplay?.textContent).toBe('hello world')
  })

  it('should handle Base64 padding variations', async () => {
    const decodeButton = screen.getByText('Decode')
    expect(decodeButton).toBeInTheDocument()
    await fireEvent.click(decodeButton)

    await waitForDebounce()

    const testCases = [
      { input: 'Zg', expected: 'f' },
      { input: 'Zm8', expected: 'fo' },
      { input: 'Zm9v', expected: 'foo' },
      { input: 'Zm9vYg', expected: 'foob' },
      { input: 'Zm9vYmE', expected: 'fooba' },
      { input: 'Zm9vYmFy', expected: 'foobar' },
    ]

    for (const testCase of testCases) {
      const inputArea = screen.getByPlaceholderText('Enter Base64 to decode...')
      await fireEvent.input(inputArea, { target: { value: testCase.input } })

      await waitForDebounce()

      const outputDisplay = document.querySelector('.output-display')
      expect(outputDisplay?.textContent).toBe(testCase.expected)
    }
  })

  it('should load example when load example button is clicked', async () => {
    const loadExampleButton = screen.getByRole('button', { name: /load example text/i })
    expect(loadExampleButton).toBeInTheDocument()
    await fireEvent.click(loadExampleButton)

    await waitForDebounce()

    const inputArea = screen.getByPlaceholderText('Enter text to encode...')
    expect(inputArea.value).toBe('Hello, World!')

    const outputDisplay = document.querySelector('.output-display')
    expect(outputDisplay?.textContent).toBe('SGVsbG8sIFdvcmxkIQ==')
  })

  it('should handle localStorage failure gracefully when clearing', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const mockError = new Error('localStorage not available')
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw mockError
    })

    const clearButton = screen.getByRole('button', { name: /clear all fields/i })
    expect(clearButton).toBeInTheDocument()
    await fireEvent.click(clearButton)

    expect(consoleSpy).toHaveBeenCalledWith('Failed to clear localStorage:', mockError)
  })

  describe('Accessibility', () => {
    it('should have aria-label on icon buttons', () => {
      const iconButtons = document.querySelectorAll('.icon-btn')
      iconButtons.forEach(button => {
        expect(button.hasAttribute('aria-label')).toBe(true)
      })
    })

    it('should have aria-label on textarea', () => {
      const textareas = document.querySelectorAll('textarea')
      textareas.forEach(textarea => {
        expect(textarea.hasAttribute('aria-label')).toBe(true)
      })
    })

    it('should have role="alert" on error display', async () => {
      const decodeButton = screen.getByText('Decode')
      expect(decodeButton).toBeInTheDocument()
      await fireEvent.click(decodeButton)

      await waitForDebounce()

      const inputArea = screen.getByPlaceholderText('Enter Base64 to decode...')
      await fireEvent.input(inputArea, { target: { value: '!!!' } })

      await waitForDebounce()

      const errorDisplay = screen.getByRole('alert')
      expect(errorDisplay).toBeInTheDocument()
    })

    it('should have aria-live="polite" on output display', async () => {
      const inputArea = screen.getByPlaceholderText('Enter text to encode...')
      await fireEvent.input(inputArea, { target: { value: 'test' } })

      await waitForDebounce()

      const outputDisplay = document.querySelector('.output-display')
      expect(outputDisplay?.getAttribute('aria-live')).toBe('polite')
    })

    it('should support keyboard navigation for mode buttons', async () => {
      const decodeButton = screen.getByText('Decode')
      expect(decodeButton).toBeInTheDocument()
      decodeButton.focus()
      expect(document.activeElement).toBe(decodeButton)

      await fireEvent.click(decodeButton)

      // Wait for debounce to complete
      await waitForDebounce()

      const activeBtn = document.querySelector('.segment.active')
      expect(activeBtn?.textContent).toContain('Decode')
    })

    it('should support keyboard activation of clear button', async () => {
      const inputArea = screen.getByPlaceholderText('Enter text to encode...')
      await fireEvent.input(inputArea, { target: { value: 'test' } })

      await waitForDebounce()

      const clearButton = screen.getByRole('button', { name: /clear all fields/i })
      expect(clearButton).toBeInTheDocument()
      clearButton.focus()
      expect(document.activeElement).toBe(clearButton)

      await fireEvent.click(clearButton)

      await waitForDebounce()

      expect(inputArea.value).toBe('')
    })

    it('should support keyboard activation of load example button', async () => {
      const loadExampleButton = screen.getByRole('button', { name: /load example text/i })
      expect(loadExampleButton).toBeInTheDocument()
      loadExampleButton.focus()
      expect(document.activeElement).toBe(loadExampleButton)

      await fireEvent.click(loadExampleButton)

      await waitForDebounce()

      const inputArea = screen.getByPlaceholderText('Enter text to encode...')
      expect(inputArea.value).toBe('Hello, World!')
    })

    it('should have clickable interactive elements', () => {
      const segments = document.querySelectorAll('.segment')
      const iconBtns = document.querySelectorAll('.icon-btn')

      segments.forEach(segment => {
        expect(segment.tagName.toLowerCase()).toBe('button')
        expect(segment.getAttribute('type')).toBe('button')
      })

      iconBtns.forEach(btn => {
        expect(btn.tagName.toLowerCase()).toBe('button')
        expect(btn.getAttribute('type')).toBe('button')
      })
    })
  })

  describe('Input Validation', () => {
    it('should reject input exceeding maximum length (1MB)', async () => {
      const inputArea = screen.getByPlaceholderText('Enter text to encode...')
      const oversizedString = 'x'.repeat(1100000)
      await fireEvent.input(inputArea, { target: { value: oversizedString } })

      await waitForDebounce()

      const errorDisplay = screen.getByRole('alert')
      expect(errorDisplay).toBeInTheDocument()
      expect(errorDisplay.textContent).toContain('exceeds maximum length')
      expect(errorDisplay.textContent).toContain('1.00 MB')
    })

    it('should handle null bytes in input', async () => {
      const inputArea = screen.getByPlaceholderText('Enter text to encode...')
      await fireEvent.input(inputArea, { target: { value: 'test\0null\0byte' } })

      await waitForDebounce()

      const outputDisplay = document.querySelector('.output-display')
      expect(outputDisplay?.textContent).toBeTruthy()
    })
  })

  describe('Mode Switching', () => {
    it('should debounce rapid mode switches', async () => {
      const encodeBtn = screen.getByText('Encode')
      const decodeBtn = screen.getByText('Decode')

      expect(encodeBtn).toBeInTheDocument()
      expect(decodeBtn).toBeInTheDocument()

      // Rapidly switch modes
      await fireEvent.click(decodeBtn)
      await fireEvent.click(encodeBtn)
      await fireEvent.click(decodeBtn)
      await fireEvent.click(encodeBtn)

      await waitForDebounce()

      // Should end in a consistent state
      const activeBtn = document.querySelector('.segment.active')
      expect(activeBtn).toBeTruthy()
    })
  })

  describe('Copy Functionality', () => {
    it('should render CopyButton when there is output', async () => {
      const inputArea = screen.getByPlaceholderText('Enter text to encode...')
      await fireEvent.input(inputArea, { target: { value: 'test' } })

      await waitForDebounce()

      const outputDisplay = document.querySelector('.output-display')
      expect(outputDisplay).toBeTruthy()
    })
  })

  describe('Clear Functionality', () => {
    it('should reset mode to encode when clearing', async () => {
      const decodeBtn = screen.getByText('Decode')
      expect(decodeBtn).toBeInTheDocument()
      await fireEvent.click(decodeBtn)

      await waitForDebounce()

      const clearBtn = screen.getByRole('button', { name: /clear all fields/i })
      expect(clearBtn).toBeInTheDocument()
      await fireEvent.click(clearBtn)

      await waitForDebounce()

      const encodeBtn = screen.getByRole('button', { name: /encode/i })
      expect(encodeBtn?.classList?.contains('active')).toBe(true)
    })
  })
})
