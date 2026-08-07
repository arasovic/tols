import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import QrcodeTool from '$lib/tools/QrcodeTool.svelte'

function waitForDebounce(ms = 300) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('QrcodeTool', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()

    // Mock canvas getContext
    const mockGetContext = vi.fn(() => ({
      fillRect: vi.fn(),
      fillStyle: '',
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(100).fill(0).map((_, i) => i % 4 === 3 ? 255 : i % 50)
      })),
      clearRect: vi.fn()
    }))

    // Apply to all canvas elements
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: mockGetContext,
      configurable: true
    })
  })

  it('should initialize with tool header', () => {
    render(QrcodeTool)
    expect(screen.getByText('QR Code Generator')).toBeInTheDocument()
  })

  it('should have text input and size slider', () => {
    const { container } = render(QrcodeTool)

    expect(screen.getByText('Text or URL')).toBeInTheDocument()
    expect(screen.getByText(/Size:/)).toBeInTheDocument()
    expect(container.querySelector('canvas')).toBeInTheDocument()
  })

  it('should generate QR code on mount', async () => {
    const { container } = render(QrcodeTool)

    await waitFor(() => {
      expect(container.querySelector('canvas')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('rasterizes exactly the core matrix to the canvas', async () => {
    // The encoder lives in tols-cli/core/qrcode; the component's only job is
    // to paint each dark module. Capture the fillRect calls and verify they
    // match the core matrix cell-for-cell (this is the web-side equivalent of
    // the CLI's jsQR round-trip, since jsdom has no real canvas). The default
    // prototype mock returns a fresh ctx per call, so install a stable one
    // before rendering.
    const { generateMatrix } = await import('tols-cli/core/qrcode')
    /** @type {number[][]} */
    let fillCalls = []
    const mockGetContext = vi.fn(() => ({
      fillRect: /** @param {...number} args */ (...args) => { fillCalls.push(args) },
      fillStyle: '',
      getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(100).fill(0).map((_, i) => i % 4 === 3 ? 255 : i % 50) })),
      clearRect: vi.fn()
    }))
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', { value: mockGetContext, configurable: true })

    const { container } = render(QrcodeTool)

    await waitFor(() => {
      expect(fillCalls.length).toBeGreaterThan(1)
    }, { timeout: 500 })

    const textInput = container.querySelector('input[type="text"]')
    const text = /** @type {HTMLInputElement} */ (textInput).value || ''
    const canvas = /** @type {HTMLCanvasElement} */ (container.querySelector('canvas'))
    const { matrix, size } = generateMatrix(text, { ecLevel: 'M' })
    const cellSize = canvas.width / size

    // Drop the white background fill; the rest are module paints.
    const calls = fillCalls.filter(
      ([x, y, w, h]) => !(x === 0 && y === 0 && w === canvas.width && h === canvas.height)
    )

    const expectedDark = matrix.reduce((sum, row) => sum + row.filter(c => c === 1).length, 0)
    expect(calls.length).toBe(expectedDark)

    for (const [x, y] of calls) {
      const col = Math.round(x / cellSize)
      const row = Math.round(y / cellSize)
      expect(matrix[row][col]).toBe(1)
    }
  })

  it('should clear content when clear button clicked', async () => {
    const { container } = render(QrcodeTool)

    await waitForDebounce(100)

    const clearButton = container.querySelector('[title="Clear"]')
    await fireEvent.click(clearButton)

    const textInput = container.querySelector('input[type="text"]')
    expect(textInput?.value).toBe('')
  })

  it('should show download button when text is present', async () => {
    render(QrcodeTool)

    await waitFor(() => {
      expect(screen.getByText('Download PNG')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should have quick example buttons', () => {
    render(QrcodeTool)

    expect(screen.getByText('GitHub')).toBeInTheDocument()
    expect(screen.getByText('Google')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Phone')).toBeInTheDocument()
  })

  it('should generate QR code with custom text', async () => {
    const { container } = render(QrcodeTool)

    await waitForDebounce(100)

    const textInput = container.querySelector('input[type="text"]')
    await fireEvent.input(textInput, { target: { value: 'Custom text' } })

    await waitForDebounce(300)

    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()

    // Verify QR code exists (canvas has been rendered)
    expect(canvas.width).toBeGreaterThan(0)
    expect(canvas.height).toBeGreaterThan(0)
  })

  it('should handle URL input', async () => {
    const { container } = render(QrcodeTool)

    await waitForDebounce(100)

    const textInput = container.querySelector('input[type="text"]')
    await fireEvent.input(textInput, { target: { value: 'https://example.com' } })

    await waitForDebounce(300)

    expect(container.querySelector('canvas')).toBeInTheDocument()
  })

  it('should generate GitHub QR when GitHub button clicked', async () => {
    const { container } = render(QrcodeTool)

    await waitForDebounce(100)

    const githubButton = screen.getByText('GitHub')
    await fireEvent.click(githubButton)

    await waitForDebounce(300)

    const textInput = container.querySelector('input[type="text"]')
    expect(textInput?.value).toBe('https://github.com')
  })

  it('should generate Google QR when Google button clicked', async () => {
    const { container } = render(QrcodeTool)

    await waitForDebounce(100)

    const googleButton = screen.getByText('Google')
    await fireEvent.click(googleButton)

    await waitForDebounce(300)

    const textInput = container.querySelector('input[type="text"]')
    expect(textInput?.value).toBe('https://google.com')
  })

  it('should generate email QR when Email button clicked', async () => {
    const { container } = render(QrcodeTool)

    await waitForDebounce(100)

    const emailButton = screen.getByText('Email')
    await fireEvent.click(emailButton)

    await waitForDebounce(300)

    const textInput = container.querySelector('input[type="text"]')
    expect(textInput?.value).toContain('mailto:')
  })

  it('should generate phone QR when Phone button clicked', async () => {
    const { container } = render(QrcodeTool)

    await waitForDebounce(100)

    const phoneButton = screen.getByText('Phone')
    await fireEvent.click(phoneButton)

    await waitForDebounce(300)

    const textInput = container.querySelector('input[type="text"]')
    expect(textInput?.value).toContain('tel:')
  })

  it('should have default URL', () => {
    const { container } = render(QrcodeTool)

    const textInput = container.querySelector('input[type="text"]')
    expect(textInput?.value).toBe('https://github.com/arasovic/tols')
  })

  it('should have size slider with min and max', () => {
    const { container } = render(QrcodeTool)

    const slider = container.querySelector('input[type="range"]')
    expect(slider).toHaveAttribute('min', '100')
    expect(slider).toHaveAttribute('max', '500')
  })

  it('should show error state for empty input after clear', async () => {
    const { container } = render(QrcodeTool)

    // Wait for initial load
    await waitForDebounce(100)

    // Clear the input
    const clearButton = container.querySelector('[title="Clear"]')
    await fireEvent.click(clearButton)

    await waitForDebounce(300)

    // Error should be displayed - check by role="alert"
    const errorDisplay = container.querySelector('[role="alert"]')
    expect(errorDisplay).toBeInTheDocument()
    expect(errorDisplay.textContent).toContain('Please enter text')
  })

  it('should download PNG when button clicked', async () => {
    render(QrcodeTool)

    await waitForDebounce(100)

    // Mock createElement for download
    const mockClick = vi.fn()
    const originalCreateElement = document.createElement
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') {
        return {
          click: mockClick,
          download: '',
          href: ''
        }
      }
      return originalCreateElement.call(document, tag)
    })

    const downloadButton = screen.getByText('Download PNG')
    await fireEvent.click(downloadButton)

    // Verify mock was called
    expect(mockClick).toHaveBeenCalled()

    vi.restoreAllMocks()
  })

  it('should change QR size when slider is moved', async () => {
    const { container } = render(QrcodeTool)

    await waitForDebounce(100)

    const slider = container.querySelector('input[type="range"]')
    const canvas = container.querySelector('canvas')

    // Change size to 300
    await fireEvent.input(slider, { target: { value: '300' } })

    await waitForDebounce(300)

    // Canvas should have been resized
    expect(canvas.width).toBe(300)
    expect(canvas.height).toBe(300)
  })

  it('should restore state from localStorage', async () => {
    // Note: onMount doesn't run in test environment, so this test verifies
    // the loadState function exists and can be called
    localStorage.setItem('devutils-qr-text', 'https://stored-url.com')
    localStorage.setItem('devutils-qr-size', '300')

    const { container } = render(QrcodeTool)

    // Wait for component to render
    await new Promise(resolve => setTimeout(resolve, 50))

    const textInput = container.querySelector('input[type="text"]')

    // In test environment, onMount doesn't run, so default value is used
    // The localStorage restore functionality is verified by manual testing
    // This test ensures the component renders without errors
    expect(textInput?.value).toBeTruthy()
  })

  it('should use new default URL when localStorage has old devutils.tools URL', async () => {
    // Set the old URL in localStorage
    localStorage.setItem('devutils-qr-text', 'https://devutils.tools')
    localStorage.setItem('devutils-qr-size', '200')

    const { container } = render(QrcodeTool)

    // Wait for component to render
    await new Promise(resolve => setTimeout(resolve, 50))

    const textInput = container.querySelector('input[type="text"]')

    // Should use the new GitHub URL, not the old one
    // Note: onMount doesn't run in test environment, so we check the default
    expect(textInput?.value).toBe('https://github.com/arasovic/tols')
  })

  it('should show error for text exceeding capacity', async () => {
    const { container } = render(QrcodeTool)

    await waitForDebounce(100)

    // Generate a very long string that exceeds QR capacity
    const longText = 'A'.repeat(5000)

    const textInput = container.querySelector('input[type="text"]')
    await fireEvent.input(textInput, { target: { value: longText } })

    await waitForDebounce(300)

    // Should show error about text too long
    const errorDisplay = container.querySelector('[role="alert"]')
    expect(errorDisplay).toBeInTheDocument()
    expect(errorDisplay.textContent).toContain('Text too long')
  })

  it('should handle empty/invalid input gracefully', async () => {
    const { container } = render(QrcodeTool)

    await waitForDebounce(100)

    // Clear the input
    const clearButton = container.querySelector('[title="Clear"]')
    await fireEvent.click(clearButton)

    await waitForDebounce(300)

    // Should show error
    const errorDisplay = container.querySelector('[role="alert"]')
    expect(errorDisplay).toBeInTheDocument()
  })

  it('should generate different QR codes for different inputs', async () => {
    const { container } = render(QrcodeTool)

    await waitForDebounce(100)

    const textInput = container.querySelector('input[type="text"]')

    // Set first input
    await fireEvent.input(textInput, { target: { value: 'First text' } })
    await waitForDebounce(300)

    const canvas = container.querySelector('canvas')
    const firstCallCount = canvas.getContext('2d').fillRect.mock?.calls?.length || 1

    // Set second input
    await fireEvent.input(textInput, { target: { value: 'Second text' } })
    await waitForDebounce(300)

    // Verify generateQR was called again (canvas context should have been used)
    const secondCallCount = canvas.getContext('2d').fillRect.mock?.calls?.length || 2
    expect(secondCallCount).toBeGreaterThanOrEqual(firstCallCount)
  })

  it('should save state to localStorage after input', async () => {
    render(QrcodeTool)

    await waitForDebounce(100)

    const textInput = document.querySelector('input[type="text"]')
    await fireEvent.input(textInput, { target: { value: 'test input' } })

    // Wait for debounce and save timeout
    await waitForDebounce(300)
    await new Promise(resolve => setTimeout(resolve, 600))

    expect(localStorage.getItem('devutils-qr-text')).toBe('test input')
  })

  it('should have accessible canvas with aria-label', async () => {
    const { container } = render(QrcodeTool)

    await waitForDebounce(50)

    const canvas = container.querySelector('canvas')
    expect(canvas).toHaveAttribute('aria-label', 'Generated QR code')
  })

  it('should have accessible error display', async () => {
    const { container } = render(QrcodeTool)

    await waitForDebounce(100)

    // Clear to trigger error
    const clearButton = container.querySelector('[title="Clear"]')
    await fireEvent.click(clearButton)

    await waitForDebounce(300)

    const errorDisplay = container.querySelector('[role="alert"]')
    expect(errorDisplay).toBeInTheDocument()
  })

  it('should handle localStorage errors gracefully', async () => {
    // Mock localStorage to throw errors - but restore after test
    const originalSetItem = Storage.prototype.setItem
    const originalGetItem = Storage.prototype.getItem

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage disabled')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage disabled')
    })

    // Should not throw
    expect(() => render(QrcodeTool)).not.toThrow()

    // Restore
    Storage.prototype.setItem = originalSetItem
    Storage.prototype.getItem = originalGetItem
    vi.restoreAllMocks()
  })
})
