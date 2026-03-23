import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import LoremTool from '$lib/tools/LoremTool.svelte'

describe('LoremTool', () => {
  let component

  beforeEach(() => {
    component = render(LoremTool)
  })

  it('should generate lorem ipsum text when input is made', async () => {
    const paragraphsInputs = screen.getAllByRole('spinbutton')
    const paragraphsInput = paragraphsInputs[0]

    await fireEvent.input(paragraphsInput, { target: { value: '1' } })

    await waitFor(() => {
      const outputBox = document.querySelector('.output-content')
      expect(outputBox).toBeInTheDocument()
      expect(outputBox.textContent).toBeTruthy()
      expect(outputBox.textContent.toLowerCase()).toContain('lorem')
    }, { timeout: 400 })
  })

  it('should generate specified number of paragraphs', async () => {
    const paragraphsInputs = screen.getAllByRole('spinbutton')
    const paragraphsInput = paragraphsInputs[0]

    await fireEvent.input(paragraphsInput, { target: { value: '3' } })

    await waitFor(() => {
      const outputBox = document.querySelector('.output-content')
      const paragraphs = outputBox.textContent.split('\n\n').filter(p => p.trim())
      expect(paragraphs).toHaveLength(3)
    }, { timeout: 400 })
  })

  it('should generate specified words per paragraph', async () => {
    const paragraphsInputs = screen.getAllByRole('spinbutton')
    const wordsInput = paragraphsInputs[1]
    const paragraphsInput = paragraphsInputs[0]

    await fireEvent.input(paragraphsInput, { target: { value: '1' } })
    await fireEvent.input(wordsInput, { target: { value: '10' } })

    await waitFor(() => {
      const outputBox = document.querySelector('.output-content')
      expect(outputBox).toBeInTheDocument()
      const words = outputBox.textContent.split(' ').filter(word => word.trim() !== '')
      expect(words.length).toBe(10)
    }, { timeout: 400 })
  })

  it('should respect start with Lorem checkbox', async () => {
    const startLoremCheckbox = screen.getByRole('checkbox')
    const paragraphsInputs = screen.getAllByRole('spinbutton')
    const paragraphsInput = paragraphsInputs[0]

    await fireEvent.input(paragraphsInput, { target: { value: '1' } })

    await waitFor(() => {
      const outputBox = document.querySelector('.output-content')
      expect(outputBox.textContent.charAt(0)).toBe('L')
    }, { timeout: 400 })

    await fireEvent.click(startLoremCheckbox)
    await fireEvent.input(paragraphsInput, { target: { value: '0' } })

    await waitFor(() => {
      const outputBox = document.querySelector('.output-content')
      expect(outputBox.textContent.charAt(0)).toBe('l')
    }, { timeout: 400 })
  })

  it('should not generate output when paragraphs < 1', async () => {
    const paragraphsInputs = screen.getAllByRole('spinbutton')
    const paragraphsInput = paragraphsInputs[0]

    await fireEvent.input(paragraphsInput, { target: { value: '0' } })

    await waitFor(() => {
      const emptyState = document.querySelector('.empty-state')
      expect(emptyState).toBeInTheDocument()
    }, { timeout: 400 })
  })

  it('should reset fields when clear button is clicked', async () => {
    const clearButton = screen.getByTitle('Clear')

    const paragraphsInputs = screen.getAllByRole('spinbutton')
    const paragraphsInput = paragraphsInputs[0]
    const wordsInput = paragraphsInputs[1]

    await fireEvent.input(paragraphsInput, { target: { value: '2' } })
    await fireEvent.input(wordsInput, { target: { value: '20' } })

    await waitFor(() => {
      const outputBox = document.querySelector('.output-content')
      expect(outputBox).toBeInTheDocument()
    }, { timeout: 400 })

    await fireEvent.click(clearButton)

    await waitFor(() => {
      expect(paragraphsInput.value).toBe('3')
      expect(wordsInput.value).toBe('50')
    }, { timeout: 200 })
  })

  it('should use default word count when not specified', async () => {
    const paragraphsInputs = screen.getAllByRole('spinbutton')
    const paragraphsInput = paragraphsInputs[0]
    const wordsInput = paragraphsInputs[1]

    await fireEvent.input(paragraphsInput, { target: { value: '1' } })

    await waitFor(() => {
      const outputBox = document.querySelector('.output-content')
      const words = outputBox.textContent.split(' ').filter(word => word.trim() !== '')
      expect(words.length).toBeGreaterThanOrEqual(40)
      expect(words.length).toBeLessThanOrEqual(60)
    }, { timeout: 400 })
  })

  it('should debounce input changes', async () => {
    const paragraphsInputs = screen.getAllByRole('spinbutton')
    const paragraphsInput = paragraphsInputs[0]

    await fireEvent.input(paragraphsInput, { target: { value: '2' } })
    await fireEvent.input(paragraphsInput, { target: { value: '5' } })
    await fireEvent.input(paragraphsInput, { target: { value: '3' } })

    await waitFor(() => {
      const outputBox = document.querySelector('.output-content')
      const paragraphs = outputBox.textContent.split('\n\n').filter(p => p.trim())
      expect(paragraphs).toHaveLength(3)
    }, { timeout: 400 })
  })
})
