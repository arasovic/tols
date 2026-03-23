import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import HashTool from '$lib/tools/HashTool.svelte'

describe('HashTool', () => {
  let component

  beforeEach(() => {
    component = render(HashTool)
  })

  it('should accept input for hashing', () => {
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')
    expect(inputArea).toBeInTheDocument()
  })

  it('should show empty state for empty input', async () => {
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')
    await fireEvent.input(inputArea, { target: { value: 'something' } })
    await fireEvent.input(inputArea, { target: { value: '' } })

    await waitForDebounce(200)

    const emptyState = screen.getByText('Enter text to generate hash')
    expect(emptyState).toBeInTheDocument()
  })

  it('should hash text with SHA-256 algorithm', async () => {
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')
    await fireEvent.input(inputArea, { target: { value: 'hello world' } })

    await waitForDebounce(200)

    const hashElement = document.querySelector('.hash-output code')
    expect(hashElement.textContent).toMatch(/^[a-f0-9]{64}$/)
  })

  it('should hash text with SHA-1 algorithm', async () => {
    const sha1Button = screen.getByText('SHA-1')
    await fireEvent.click(sha1Button)

    const inputArea = screen.getByPlaceholderText('Enter text to hash...')
    await fireEvent.input(inputArea, { target: { value: 'hello world' } })

    await waitForDebounce(200)

    const hashElement = document.querySelector('.hash-output code')
    expect(hashElement.textContent).toMatch(/^[a-f0-9]{40}$/)
  })

  it('should hash text with MD5 algorithm', async () => {
    const md5Button = screen.getByText('MD5')
    await fireEvent.click(md5Button)

    const inputArea = screen.getByPlaceholderText('Enter text to hash...')
    await fireEvent.input(inputArea, { target: { value: 'hello world' } })

    await waitForDebounce(200)

    const hashElement = document.querySelector('.hash-output code')
    expect(hashElement.textContent).toMatch(/^[a-f0-9]{32}$/)
  })

  it('should update hash algorithm display when algorithm changes', async () => {
    const initialHashTypeElement = document.querySelector('.hash-type')
    expect(initialHashTypeElement.textContent).toBe('SHA-256')

    const sha1Button = screen.getByText('SHA-1')
    await fireEvent.click(sha1Button)

    await waitForDebounce(150)

    const updatedHashTypeElement = document.querySelector('.hash-type')
    expect(updatedHashTypeElement.textContent).toBe('SHA-1')
  })

  it('should clear all fields when clear button is clicked', async () => {
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')
    await fireEvent.input(inputArea, { target: { value: 'test text' } })

    await waitForDebounce(200)

    const clearButton = screen.getByTitle('Clear')
    await fireEvent.click(clearButton)

    expect(inputArea.value).toBe('')
    const emptyState = screen.getByText('Enter text to generate hash')
    expect(emptyState).toBeInTheDocument()
  })

  it('should debounce input changes', async () => {
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')

    await fireEvent.input(inputArea, { target: { value: 'test' } })
    await fireEvent.input(inputArea, { target: { value: 'test 2' } })
    await fireEvent.input(inputArea, { target: { value: 'test 3' } })

    const hashElement = document.querySelector('.hash-output code')

    await waitForDebounce(300)

    const updatedHashElement = document.querySelector('.hash-output code')
    expect(updatedHashElement.textContent).toMatch(/^[a-f0-9]+$/)
  })

  it('should handle special characters in input', async () => {
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')
    await fireEvent.input(inputArea, { target: { value: 'test@#$%^&*()_+<>?' } })

    await waitForDebounce(200)

    const hashElement = document.querySelector('.hash-output code')
    expect(hashElement.textContent).toMatch(/^[a-f0-9]+$/)
  })

  it('should produce consistent hashes for same input', async () => {
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')

    await fireEvent.input(inputArea, { target: { value: 'consistent test' } })
    await waitForDebounce(300)

    const hashElement = document.querySelector('.hash-output code')
    const firstHash = hashElement.textContent

    const clearButton = screen.getByTitle('Clear')
    await fireEvent.click(clearButton)

    await waitForDebounce(200)

    await fireEvent.input(inputArea, { target: { value: 'consistent test' } })
    await waitForDebounce(300)

    const updatedHashElement = document.querySelector('.hash-output code')
    const secondHash = updatedHashElement.textContent

    expect(firstHash).toBe(secondHash)
  })
})

function waitForDebounce(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
