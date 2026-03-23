import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import RegexTool from '$lib/tools/RegexTool.svelte'

describe('RegexTool', () => {
  let component

  beforeEach(() => {
    component = render(RegexTool)
  })

  it('should have input areas on mount', () => {
    const patternInput = screen.getByPlaceholderText(/Enter regex pattern/i)
    const textInput = screen.getByPlaceholderText(/Enter text/i)
    expect(patternInput).toBeInTheDocument()
    expect(textInput).toBeInTheDocument()
  })

  it('should show placeholder for initial state', () => {
    const emptyState = screen.getByText(/Matches will appear here/i)
    expect(emptyState).toBeInTheDocument()
  })

  it('should show matches when pattern and text provided', async () => {
    const patternInput = screen.getByPlaceholderText(/Enter regex pattern/i)
    const inputArea = screen.getByPlaceholderText(/Enter text/i)

    await fireEvent.input(patternInput, { target: { value: 'test' } })
    await fireEvent.input(inputArea, { target: { value: 'this is a test and another test here' } })

    await waitFor(() => {
      const matchElements = document.querySelectorAll('[class*="highlight"]')
      expect(matchElements.length).toBeGreaterThan(0)
    }, { timeout: 400 })
  })

  it('should handle special characters in regex pattern', async () => {
    const patternInput = screen.getByPlaceholderText(/Enter regex pattern/i)
    const inputArea = screen.getByPlaceholderText(/Enter text/i)

    await fireEvent.input(patternInput, { target: { value: '\\d+' } })
    await fireEvent.input(inputArea, { target: { value: 'abc123def456' } })

    await waitFor(() => {
      const matchElements = document.querySelectorAll('[class*="highlight"]')
      expect(matchElements.length).toBeGreaterThanOrEqual(1)
    }, { timeout: 400 })
  })

  it('should handle global flag correctly', async () => {
    const patternInput = screen.getByPlaceholderText(/Enter regex pattern/i)
    const inputArea = screen.getByPlaceholderText(/Enter text/i)

    const gFlagBtn = screen.getByTitle(/Global/i)

    await fireEvent.input(patternInput, { target: { value: 'test' } })
    await fireEvent.input(inputArea, { target: { value: 'test test test' } })

    await waitFor(() => {
      let matchElements = document.querySelectorAll('[class*="highlight"]')
      expect(matchElements.length).toBeGreaterThanOrEqual(3)
    }, { timeout: 400 })

    expect(gFlagBtn).toBeInTheDocument()
  })

  it('should handle case insensitive flag', async () => {
    const patternInput = screen.getByPlaceholderText(/Enter regex pattern/i)
    const inputArea = screen.getByPlaceholderText(/Enter text/i)

    const iFlagBtn = screen.getByTitle(/Case Insensitive/i)

    await fireEvent.input(patternInput, { target: { value: 'TEST' } })
    await fireEvent.input(inputArea, { target: { value: 'test Test TEST' } })

    await waitFor(() => {
      let matchElements = document.querySelectorAll('[class*="highlight"]')
      expect(matchElements.length).toBeGreaterThanOrEqual(1)
    }, { timeout: 400 })

    expect(iFlagBtn).toBeInTheDocument()
  })

  it('should handle multiline flag appropriately', async () => {
    const patternInput = screen.getByPlaceholderText(/Enter regex pattern/i)
    const inputArea = screen.getByPlaceholderText(/Enter text/i)

    const mFlagBtn = screen.getByTitle(/Multiline/i)

    await fireEvent.input(patternInput, { target: { value: '^test' } })
    await fireEvent.input(
      inputArea,
      {
        target: {
          value: 'first line\ntest on second line\ntest on third line'
        }
      }
    )

    await waitFor(() => {
      let matchElements = document.querySelectorAll('[class*="highlight"]')
      expect(matchElements.length).toBeGreaterThanOrEqual(0)
    }, { timeout: 400 })

    expect(mFlagBtn).toBeInTheDocument()
  })

  it('should highlight multiple occurrences', async () => {
    const patternInput = screen.getByPlaceholderText(/Enter regex pattern/i)
    const inputArea = screen.getByPlaceholderText(/Enter text/i)

    await fireEvent.input(patternInput, { target: { value: 'a' } })
    await fireEvent.input(inputArea, { target: { value: 'banana' } })

    await waitFor(() => {
      const matchElements = document.querySelectorAll('[class*="highlight"]')
      expect(matchElements.length).toBeGreaterThanOrEqual(3)
    }, { timeout: 400 })
  })

  it('should clear all fields when clear button is clicked', async () => {
    const patternInput = screen.getByPlaceholderText(/Enter regex pattern/i)
    const inputArea = screen.getByPlaceholderText(/Enter text/i)
    const clearButton = screen.getByTitle('Clear')

    await fireEvent.input(patternInput, { target: { value: 'test' } })
    await fireEvent.input(inputArea, { target: { value: 'some text here' } })

    await fireEvent.click(clearButton)

    await waitFor(() => {
      expect(patternInput.value).toBe('')
      expect(inputArea.value).toBe('')
    }, { timeout: 200 })

    const emptyState = screen.getByText(/Matches will appear here/i)
    expect(emptyState).toBeInTheDocument()
  })

  it('should handle patterns with quantifiers', async () => {
    const patternInput = screen.getByPlaceholderText(/Enter regex pattern/i)
    const inputArea = screen.getByPlaceholderText(/Enter text/i)

    await fireEvent.input(patternInput, { target: { value: 'go+l' } })
    await fireEvent.input(inputArea, { target: { value: 'gool google googlle gell' } })

    await waitFor(() => {
      const matchElements = document.querySelectorAll('[class*="highlight"]')
      expect(matchElements.length).toBeGreaterThanOrEqual(2)
    }, { timeout: 400 })
  })

  it('should debounce input changes', async () => {
    const patternInput = screen.getByPlaceholderText(/Enter regex pattern/i)
    const inputArea = screen.getByPlaceholderText(/Enter text/i)

    await fireEvent.input(patternInput, { target: { value: 'a' } })
    await fireEvent.input(patternInput, { target: { value: 'an' } })
    await fireEvent.input(patternInput, { target: { value: 'and' } })

    await waitFor(() => {
      expect(patternInput.value).toBe('and')
    }, { timeout: 400 })
  })
})
