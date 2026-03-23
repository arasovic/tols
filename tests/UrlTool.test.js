import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import UrlTool from '$lib/tools/UrlTool.svelte'

describe('UrlTool', () => {
  let component

  beforeEach(() => {
    component = render(UrlTool)
  })

  it('should show textarea for text entry on mount', () => {
    const inputArea = screen.getByPlaceholderText(/Enter text or URL/i)
    expect(inputArea).toBeInTheDocument()
  })

  it('should encode text correctly', async () => {
    const inputArea = screen.getByPlaceholderText(/Enter text or URL/i)
    await fireEvent.input(inputArea, { target: { value: 'hello world' } })

    await waitForDebounce(200)

    const outputContent = document.querySelector('.output-content')
    expect(outputContent?.textContent).toBe('hello%20world')
  })

  it('should decode URL-encoded text', async () => {
    const decodeButton = screen.getByText('Decode')

    await fireEvent.click(decodeButton)

    const inputArea = screen.getByPlaceholderText(/Enter URL-encoded string/i)
    await fireEvent.input(inputArea, { target: { value: 'hello%20world' } })

    await waitForDebounce(200)

    const outputContent = document.querySelector('.output-content')
    expect(outputContent?.textContent).toBe('hello world')
  })

  it('should show empty state for empty input', async () => {
    const inputArea = screen.getByPlaceholderText(/Enter text or URL/i)
    await fireEvent.input(inputArea, { target: { value: '' } })

    await waitForDebounce(200)

    const emptyState = document.querySelector('.empty-state')
    expect(emptyState).toBeInTheDocument()
  })

  it('should show error for invalid URL decode', async () => {
    const decodeButton = screen.getByText('Decode')
    await fireEvent.click(decodeButton)

    const inputArea = screen.getByPlaceholderText(/Enter URL-encoded string/i)
    await fireEvent.input(inputArea, { target: { value: '%invalid' } })

    await waitForDebounce(200)

    const errorElement = document.querySelector('.error-state')
    expect(errorElement).toBeInTheDocument()
    expect(errorElement?.textContent).toContain('Invalid')
  })

  it('should extract path from URL in encode mode', async () => {
    const inputArea = screen.getByPlaceholderText(/Enter text or URL/i)

    await fireEvent.input(inputArea, { target: { value: 'https://example.com/path/to/page?param=value#section' } })

    const extractButton = screen.getByTitle('Extract from URL')
    await fireEvent.click(extractButton)

    await waitForDebounce(200)

    const outputElement = document.querySelector('.output-content')
    expect(outputElement?.textContent).toBeTruthy()
  })

  it('should show error for invalid URL when extracting', async () => {
    const inputArea = screen.getByPlaceholderText(/Enter text or URL/i)
    await fireEvent.input(inputArea, { target: { value: 'not-a-url' } })

    const extractButton = screen.getByTitle('Extract from URL')
    await fireEvent.click(extractButton)

    await waitForDebounce(200)

    const errorElement = document.querySelector('.error-state')
    expect(errorElement?.textContent?.toLowerCase()).toMatch(/invalid|error/)
  })

  it('should clear all fields when clear button is clicked', async () => {
    const inputArea = screen.getByPlaceholderText(/Enter text or URL/i)
    await fireEvent.input(inputArea, { target: { value: 'test text' } })

    const clearButton = screen.getByTitle('Clear')
    await fireEvent.click(clearButton)

    expect(inputArea.value).toBe('')

    const emptyState = document.querySelector('.empty-state')
    const outputArea = document.querySelector('.output-content')
    const outputText = emptyState?.textContent || outputArea?.textContent || ''
    expect(outputText).toMatch(/(enter|empty|clear|input)/i)
  })

  it('should debounce input changes', async () => {
    const inputArea = screen.getByPlaceholderText(/Enter text or URL/i)

    await fireEvent.input(inputArea, { target: { value: 'test' } })
    await fireEvent.input(inputArea, { target: { value: 'test 2' } })
    await fireEvent.input(inputArea, { target: { value: 'test 3' } })

    await waitForDebounce(300)

    const finalOutput = document.querySelector('.output-content')
    expect(finalOutput?.textContent).toBe('test%203')
  })

  it('should maintain mode switching state correctly', async () => {
    expect(screen.getByText('Encode').classList.contains('active') ||
           !screen.getByText('Decode').classList.contains('active')).toBe(true)

    const decodeButton = screen.getByText('Decode')
    await fireEvent.click(decodeButton)

    expect(screen.getByText('Decode').classList.contains('active') ||
           !screen.getByText('Encode').classList.contains('active')).toBe(true)
  })
})

function waitForDebounce(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
