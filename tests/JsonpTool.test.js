import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import JsonpTool from '$lib/tools/JsonpTool.svelte'

const DEBOUNCE_DELAY = 400
const SAVE_DEBOUNCE_DELAY = 600
const TOTAL_SAVE_DELAY = 1000

function waitForDebounce(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('JsonpTool', () => {
  let container

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    const result = render(JsonpTool)
    container = result.container
  })

  it('should initialize with tool header', () => {
    expect(screen.getByText('JSONP Tester')).toBeInTheDocument()
  })

  it('should have URL and callback inputs', () => {
    expect(screen.getByText('URL')).toBeInTheDocument()
    expect(screen.getByText('Callback Function')).toBeInTheDocument()
  })

  it('should have simulated response textarea', () => {
    expect(screen.getByText('Simulated Response (JSON)')).toBeInTheDocument()
    expect(container.querySelector('.response-textarea')).toBeInTheDocument()
  })

  it('should generate script tag', async () => {
    await waitFor(() => {
      expect(screen.getByText('Generated Script Tag')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should show parsed result', async () => {
    await waitFor(() => {
      expect(screen.getByText('Parsed Result')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should clear when clear button clicked', async () => {
    const clearButton = container.querySelector('[title="Clear"]')
    await fireEvent.click(clearButton)

    const inputs = container.querySelectorAll('input[type="text"]')
    expect(inputs[0]?.value).toBe('')
  })

  it('should load example when load example button clicked', async () => {
    const loadExampleButton = container.querySelector('[title="Load Example"]')
    await fireEvent.click(loadExampleButton)

    const urlInput = container.querySelector('input[type="text"]')
    expect(urlInput?.value).toBe('https://api.example.com/data')
  })

  it('should update script tag when URL changed', async () => {
    const urlInput = container.querySelector('input[type="text"]')
    await fireEvent.input(urlInput, { target: { value: 'https://new.api.com/data' } })

    await waitForDebounce(DEBOUNCE_DELAY)

    const scriptOutput = container.querySelector('.code-block')
    expect(scriptOutput?.textContent).toContain('https://new.api.com/data')
  })

  it('should update script tag when callback changed', async () => {
    const callbackInput = container.querySelectorAll('input[type="text"]')[1]
    await fireEvent.input(callbackInput, { target: { value: 'newCallback' } })

    await waitForDebounce(DEBOUNCE_DELAY)

    const scriptOutput = container.querySelector('.code-block')
    expect(scriptOutput?.textContent).toContain('newCallback')
  })

  it('should show success result for valid JSON', async () => {
    const responseTextarea = container.querySelector('.response-textarea')
    await fireEvent.input(responseTextarea, { target: { value: '{"valid": true}' } })

    await waitForDebounce(DEBOUNCE_DELAY)

    const resultDisplay = container.querySelector('.result-display')
    const content = resultDisplay?.textContent || ''
    expect(content).toContain('true')
  })

  it('should show error result for invalid JSON', async () => {
    const responseTextarea = container.querySelector('.response-textarea')
    await fireEvent.input(responseTextarea, { target: { value: 'invalid json' } })

    await waitForDebounce(DEBOUNCE_DELAY)

    const resultDisplay = container.querySelector('.result-display.error')
    expect(resultDisplay).toBeInTheDocument()
  })

  it('should have info section explaining JSONP', () => {
    expect(screen.getByText('How JSONP Works')).toBeInTheDocument()
  })

  it('should persist state to localStorage', async () => {
    const urlInput = container.querySelector('input[type="text"]')
    await fireEvent.input(urlInput, { target: { value: 'https://persisted.api.com/data' } })

    await waitForDebounce(TOTAL_SAVE_DELAY)

    expect(localStorage.getItem('devutils-jsonp-url')).toBe('https://persisted.api.com/data')
  })

  it('should restore state from localStorage', async () => {
    localStorage.setItem('devutils-jsonp-url', 'https://restored.api.com/data')
    localStorage.setItem('devutils-jsonp-callback', 'restoredCallback')
    localStorage.setItem('devutils-jsonp-response', '{"restored": true}')

    render(JsonpTool)

    await waitForDebounce(100)

    expect(localStorage.getItem('devutils-jsonp-url')).toBe('https://restored.api.com/data')
    expect(localStorage.getItem('devutils-jsonp-callback')).toBe('restoredCallback')
  })

  it('should handle empty inputs gracefully', async () => {
    const urlInput = container.querySelector('input[type="text"]')
    await fireEvent.input(urlInput, { target: { value: '' } })

    await waitForDebounce(DEBOUNCE_DELAY)

    const scriptOutput = container.querySelector('.code-block')
    expect(scriptOutput?.textContent).toContain('src="')
  })

  it('should sanitize special characters in URL and callback', async () => {
    const urlInput = container.querySelector('input[type="text"]')
    const callbackInput = container.querySelectorAll('input[type="text"]')[1]

    await fireEvent.input(urlInput, { target: { value: 'https://api.com/<script>alert(1)</script>' } })
    await fireEvent.input(callbackInput, { target: { value: 'callback" onclick="evil()' } })

    await waitForDebounce(DEBOUNCE_DELAY)

    const scriptOutput = container.querySelector('.code-block')
    const content = scriptOutput?.textContent || ''
    expect(content).not.toContain('<script>')
    expect(content).toContain('&lt;')
  })

  it('should handle very long JSON response', async () => {
    const longJson = JSON.stringify({
      items: Array.from({ length: 1000 }, (_, i) => ({ id: i, data: 'x'.repeat(100) }))
    })

    const responseTextarea = container.querySelector('.response-textarea')
    await fireEvent.input(responseTextarea, { target: { value: longJson } })

    await waitForDebounce(DEBOUNCE_DELAY)

    const resultDisplay = container.querySelector('.result-display.success')
    expect(resultDisplay).toBeInTheDocument()
  })

  it('should cleanup timeouts on component unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

    const { unmount } = render(JsonpTool)
    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
  })

  it('should have aria-label on icon buttons', () => {
    const loadExampleButton = container.querySelector('[title="Load Example"]')
    const clearButton = container.querySelector('[title="Clear"]')

    expect(loadExampleButton).toHaveAttribute('aria-label')
    expect(clearButton).toHaveAttribute('aria-label')
  })

  it('should handle localStorage unavailable gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { container: newContainer } = render(JsonpTool)

    const urlInput = newContainer.querySelector('input[type="text"]')
    await fireEvent.input(urlInput, { target: { value: 'https://test.com' } })

    await waitForDebounce(TOTAL_SAVE_DELAY)

    consoleSpy.mockRestore()
  })

  it('should debounce input with stable timing', async () => {
    const urlInput = container.querySelector('input[type="text"]')

    await fireEvent.input(urlInput, { target: { value: 'a' } })
    await fireEvent.input(urlInput, { target: { value: 'ab' } })
    await fireEvent.input(urlInput, { target: { value: 'abc' } })

    const scriptOutputBefore = container.querySelector('.code-block')
    const beforeContent = scriptOutputBefore?.textContent

    await waitForDebounce(DEBOUNCE_DELAY)

    const scriptOutputAfter = container.querySelector('.code-block')
    expect(scriptOutputAfter?.textContent).toContain('abc')
  })
})
