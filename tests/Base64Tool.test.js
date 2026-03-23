import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import Base64Tool from '$lib/tools/Base64Tool.svelte'

function waitForDebounce(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('Base64Tool', () => {
  let component

  beforeEach(() => {
    component = render(Base64Tool)
  })

  it('should initialize correctly', () => {
    expect(screen.getByText('Encode')).toBeInTheDocument()
    expect(screen.getByText('Decode')).toBeInTheDocument()
  })

  it('should encode text to Base64', async () => {
    const inputArea = screen.getByPlaceholderText('Enter text to encode...')
    await fireEvent.input(inputArea, { target: { value: 'hello world' } })

    await waitForDebounce(200)

    const outputContentEl = document.querySelector('.output-content')
    expect(outputContentEl.textContent).toBe('aGVsbG8gd29ybGQ=')
  })

  it('should decode Base64 text', async () => {
    const decodeButton = screen.getByText('Decode')
    await fireEvent.click(decodeButton)

    const inputArea = screen.getByPlaceholderText('Enter Base64 to decode...')
    await fireEvent.input(inputArea, { target: { value: 'aGVsbG8gd29ybGQ=' } })

    await waitForDebounce(200)

    const outputContentEl = document.querySelector('.output-content')
    expect(outputContentEl.textContent).toBe('hello world')
  })

  it('should show empty state for empty input', async () => {
    const inputArea = screen.getByPlaceholderText('Enter text to encode...')
    await fireEvent.input(inputArea, { target: { value: '' } })

    await waitForDebounce(200)

    const emptyState = document.querySelector('.empty-state')
    expect(emptyState).toBeInTheDocument()
  })

  it('should show error for invalid Base64 when decoding', async () => {
    const decodeButton = screen.getByText('Decode')
    await fireEvent.click(decodeButton)

    const inputArea = screen.getByPlaceholderText('Enter Base64 to decode...')
    await fireEvent.input(inputArea, { target: { value: 'invalid-base64!' } })

    await waitForDebounce(200)

    const errorDiv = document.querySelector('.error-state span')
    expect(errorDiv.textContent).toContain('Invalid input for Base64 decode')
  })

  it('should handle special characters in encoding', async () => {
    const inputArea = screen.getByPlaceholderText('Enter text to encode...')
    await fireEvent.input(inputArea, { target: { value: 'test@#$%^&*()_+<>?' } })

    await waitForDebounce(200)

    const outputContent = document.querySelector('.output-content')
    expect(outputContent.textContent).toBeTruthy()
    expect(outputContent.textContent).toMatch(/^[A-Za-z0-9+/=]+$/)
  })

  it('should handle Unicode characters in encoding', async () => {
    const inputArea = screen.getByPlaceholderText('Enter text to encode...')
    await fireEvent.input(inputArea, { target: { value: 'こんにちは世界' } })

    await waitForDebounce(200)

    const encoded = document.querySelector('.output-content').textContent
    expect(encoded).toBeTruthy()

    const decodeButton = screen.getByText('Decode')
    await fireEvent.click(decodeButton)

    const decodeInputArea = screen.getByPlaceholderText('Enter Base64 to decode...')
    await fireEvent.input(decodeInputArea, { target: { value: encoded } })

    await waitForDebounce(200)

    const decodedContent = document.querySelector('.output-content').textContent
    expect(decodedContent).toBe('こんにちは世界')
  })

  it('should maintain mode switching state', async () => {
    const encodeBtn = document.querySelector('.mode-btn.active')
    expect(encodeBtn.textContent).toContain('Encode')

    const decodeBtn = screen.getByText('Decode')
    await fireEvent.click(decodeBtn)

    const activeBtn = document.querySelector('.mode-btn.active')
    expect(activeBtn.textContent).toContain('Decode')
  })

  it('should clear all fields when clear button is clicked', async () => {
    const inputArea = screen.getByPlaceholderText('Enter text to encode...')
    await fireEvent.input(inputArea, { target: { value: 'test text' } })

    const clearButton = document.querySelector('.btn-ghost[title="Clear"]')
    await fireEvent.click(clearButton)

    expect(inputArea.value).toBe('')
  })

  it('should debounce input changes', async () => {
    const inputArea = screen.getByPlaceholderText('Enter text to encode...')

    await fireEvent.input(inputArea, { target: { value: 'test' } })
    await fireEvent.input(inputArea, { target: { value: 'test 2' } })
    await fireEvent.input(inputArea, { target: { value: 'test 3' } })

    const outputContent = document.querySelector('.output-content')
    const initialOutput = outputContent?.textContent || ''

    await waitForDebounce(300)

    const finalOutput = document.querySelector('.output-content')
    expect(finalOutput.textContent).toBe('dGVzdCAz')
  })

  it('should handle large strings', async () => {
    const inputArea = screen.getByPlaceholderText('Enter text to encode...')
    const largeString = 'x'.repeat(10000)
    await fireEvent.input(inputArea, { target: { value: largeString } })

    await waitForDebounce(200)

    const outputContent = document.querySelector('.output-content')
    expect(outputContent.textContent).toBeTruthy()
    expect(outputContent.textContent.length).toBeGreaterThan(10000)
  })

  it('should be consistent with encoding/decoding', async () => {
    const simpleString = 'hello world'
    const expectedEncoded = 'aGVsbG8gd29ybGQ='

    const inputArea = screen.getByPlaceholderText('Enter text to encode...')
    await fireEvent.input(inputArea, { target: { value: simpleString } })

    await waitForDebounce(200)

    const outputContent = document.querySelector('.output-content')
    expect(outputContent.textContent).toBe(expectedEncoded)

    const clearButton = document.querySelector('.btn-ghost[title="Clear"]')
    await fireEvent.click(clearButton)

    const decodeButton = screen.getByText('Decode')
    await fireEvent.click(decodeButton)

    const decodeInputArea = screen.getByPlaceholderText('Enter Base64 to decode...')
    await fireEvent.input(decodeInputArea, { target: { value: expectedEncoded } })

    await waitForDebounce(200)

    const decodedOutput = document.querySelector('.output-content')
    expect(decodedOutput.textContent).toBe(simpleString)
  })

  it('should handle empty strings after encoding', async () => {
    const inputArea = screen.getByPlaceholderText('Enter text to encode...')
    await fireEvent.input(inputArea, { target: { value: '' } })

    await waitForDebounce(200)

    expect(document.querySelector('.error-state span')).toBeNull()

    const emptyStateEl = document.querySelector('.empty-state span')
    expect(emptyStateEl).not.toBeNull()
    expect(emptyStateEl.textContent).toContain('Enter text to encode')
  })
})
