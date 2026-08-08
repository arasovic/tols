import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import LoremTool from '$lib/tools/LoremTool.svelte'

describe('LoremTool', () => {
  beforeEach(() => {
    // The tool restores `startWithLorem` from localStorage on mount, and this
    // file never cleared it between tests: once a test's 500ms save debounce
    // wrote `startwith=false`, every later render started from a random word,
    // and "should load example" — which asserts the output contains "lorem" —
    // failed depending on which tests had run first. Seen failing in a full
    // suite run and passing in isolation.
    localStorage.clear()
    vi.useFakeTimers()
    vi.stubGlobal('crypto', {
      getRandomValues: (/** @type {Uint32Array} */ array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 100)
        }
        return array
      }
    })
    render(LoremTool)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('should expose accessible names for paragraph stepper buttons', () => {
    expect(screen.getByRole('button', { name: 'Decrease paragraph count' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Increase paragraph count' })).toBeInTheDocument()
  })

  it('should generate lorem ipsum text when input is made', async () => {
    const paragraphsInputs = screen.getAllByRole('spinbutton')
    const paragraphsInput = paragraphsInputs[0]

    await fireEvent.input(paragraphsInput, { target: { value: '1' } })
    vi.advanceTimersByTime(200)

    await waitFor(() => {
      const outputBox = document.querySelector('.output-content')
      expect(outputBox).toBeInTheDocument()
      expect(outputBox?.textContent).toBeTruthy()
      expect(outputBox?.textContent?.toLowerCase()).toContain('lorem')
    }, { timeout: 400 })
  })

  it('should generate specified number of paragraphs', async () => {
    const paragraphsInputs = screen.getAllByRole('spinbutton')
    const paragraphsInput = paragraphsInputs[0]

    await fireEvent.input(paragraphsInput, { target: { value: '3' } })
    vi.advanceTimersByTime(200)

    await waitFor(() => {
      const outputBox = document.querySelector('.output-content')
      expect(outputBox).toBeInTheDocument()
      const text = outputBox?.textContent || ''
      const paragraphs = text.split('\n\n').filter(p => p.trim())
      expect(paragraphs).toHaveLength(3)
    }, { timeout: 400 })
  })

  async function disableStartWithLorem() {
    // The core now applies the "Start with Lorem" toggle (the web's old
    // generate() never read it). These word-count tests measure the word
    // settings, so turn the opener off explicitly and keep their assertions
    // meaningful. The opener itself is covered by a dedicated test below.
    const toggle = /** @type {HTMLInputElement | null} */ (document.querySelector('.toggle input[type="checkbox"]'))
    if (toggle && toggle.checked) {
      await fireEvent.click(toggle)
      vi.advanceTimersByTime(200)
    }
  }

  it('should generate specified words per paragraph', async () => {
    const paragraphsInputs = screen.getAllByRole('spinbutton')
    const wordsInput = paragraphsInputs[1]
    const paragraphsInput = paragraphsInputs[0]

    await disableStartWithLorem()
    await fireEvent.input(wordsInput, { target: { value: '10' } })
    vi.advanceTimersByTime(200)
    await fireEvent.input(paragraphsInput, { target: { value: '1' } })
    vi.advanceTimersByTime(200)

    await waitFor(() => {
      const outputBox = document.querySelector('.output-content')
      expect(outputBox).toBeInTheDocument()
      const text = outputBox?.textContent || ''
      const words = text.match(/\b\w+\b/g)
      expect(words?.length).toBe(10)
    }, { timeout: 400 })
  })

  it('should start with the classic opener when Start with Lorem is on', async () => {
    const paragraphsInputs = screen.getAllByRole('spinbutton')
    const paragraphsInput = paragraphsInputs[0]

    await fireEvent.input(paragraphsInput, { target: { value: '1' } })
    vi.advanceTimersByTime(200)

    await waitFor(() => {
      const outputBox = document.querySelector('.output-content')
      expect(outputBox?.textContent).toContain('Lorem ipsum dolor sit amet, consectetur adipiscing elit.')
    }, { timeout: 400 })
  })

  it('should always capitalize first letter of paragraphs', async () => {
    const paragraphsInputs = screen.getAllByRole('spinbutton')
    const paragraphsInput = paragraphsInputs[0]

    await fireEvent.input(paragraphsInput, { target: { value: '1' } })
    vi.advanceTimersByTime(200)

    await waitFor(() => {
      const outputBox = document.querySelector('.output-content')
      expect(outputBox).toBeInTheDocument()
      const firstChar = outputBox?.textContent?.charAt(0)
      expect(firstChar).toBe(firstChar?.toUpperCase())
    }, { timeout: 400 })
  })

  it('should clear output when paragraphs is set to 0', async () => {
    const paragraphsInputs = screen.getAllByRole('spinbutton')
    const paragraphsInput = paragraphsInputs[0]

    await fireEvent.input(paragraphsInput, { target: { value: '1' } })
    vi.advanceTimersByTime(200)

    await waitFor(() => {
      const outputBox = document.querySelector('.output-content')
      expect(outputBox).toBeInTheDocument()
    }, { timeout: 400 })

    await fireEvent.input(paragraphsInput, { target: { value: '0' } })
    vi.advanceTimersByTime(200)

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
    vi.advanceTimersByTime(200)
    await fireEvent.input(wordsInput, { target: { value: '20' } })
    vi.advanceTimersByTime(200)

    await waitFor(() => {
      const outputBox = document.querySelector('.output-content')
      expect(outputBox).toBeInTheDocument()
    }, { timeout: 400 })

    await fireEvent.click(clearButton)

    await waitFor(() => {
      const outputBox = document.querySelector('.empty-state')
      expect(outputBox).toBeInTheDocument()
    }, { timeout: 400 })
  })

  it('should use default word count when not specified', async () => {
    const paragraphsInputs = screen.getAllByRole('spinbutton')
    const paragraphsInput = paragraphsInputs[0]
    const wordsInput = paragraphsInputs[1]

    await disableStartWithLorem()
    await fireEvent.input(wordsInput, { target: { value: '0' } })
    vi.advanceTimersByTime(200)
    await fireEvent.input(paragraphsInput, { target: { value: '1' } })
    vi.advanceTimersByTime(200)

    await waitFor(() => {
      const outputBox = document.querySelector('.output-content')
      expect(outputBox).toBeInTheDocument()
      const text = outputBox?.textContent || ''
      const words = text.match(/\b\w+\b/g)
      expect(words?.length).toBeGreaterThanOrEqual(10)
      expect(words?.length).toBeLessThanOrEqual(30)
    }, { timeout: 400 })
  })

  it('should debounce input changes', async () => {
    const paragraphsInputs = screen.getAllByRole('spinbutton')
    const paragraphsInput = paragraphsInputs[0]

    await fireEvent.input(paragraphsInput, { target: { value: '2' } })
    vi.advanceTimersByTime(50)
    await fireEvent.input(paragraphsInput, { target: { value: '5' } })
    vi.advanceTimersByTime(50)
    await fireEvent.input(paragraphsInput, { target: { value: '3' } })
    vi.advanceTimersByTime(50)

    vi.advanceTimersByTime(200)

    await waitFor(() => {
      const outputBox = document.querySelector('.output-content')
      expect(outputBox).toBeInTheDocument()
      const text = outputBox?.textContent || ''
      const paragraphs = text.split('\n\n').filter(p => p.trim())
      expect(paragraphs).toHaveLength(3)
    }, { timeout: 400 })
  })

  it('should respect max 50 paragraphs boundary', async () => {
    const paragraphsInputs = screen.getAllByRole('spinbutton')
    const paragraphsInput = paragraphsInputs[0]

    await fireEvent.input(paragraphsInput, { target: { value: '60' } })
    vi.advanceTimersByTime(200)

    await waitFor(() => {
      const outputBox = document.querySelector('.output-content')
      expect(outputBox).toBeInTheDocument()
      const text = outputBox?.textContent || ''
      const paragraphs = text.split('\n\n').filter(p => p.trim())
      expect(paragraphs.length).toBeLessThanOrEqual(50)
    }, { timeout: 400 })
  })

  it('should respect max 500 words boundary', async () => {
    const paragraphsInputs = screen.getAllByRole('spinbutton')
    const wordsInput = paragraphsInputs[1]
    const paragraphsInput = paragraphsInputs[0]

    await disableStartWithLorem()
    await fireEvent.input(wordsInput, { target: { value: '600' } })
    vi.advanceTimersByTime(200)
    await fireEvent.input(paragraphsInput, { target: { value: '1' } })
    vi.advanceTimersByTime(200)

    await waitFor(() => {
      const outputBox = document.querySelector('.output-content')
      expect(outputBox).toBeInTheDocument()
      const text = outputBox?.textContent || ''
      const words = text.match(/\b\w+\b/g)
      expect(words?.length).toBeLessThanOrEqual(500)
    }, { timeout: 400 })
  })

  it('should load example when load example button is clicked', async () => {
    const loadExampleButton = screen.getByTitle('Load Example')

    await fireEvent.click(loadExampleButton)

    const outputBox = document.querySelector('.output-content')
    expect(outputBox).toBeInTheDocument()
    expect(outputBox?.textContent).toBeTruthy()
    expect(outputBox?.textContent?.toLowerCase()).toContain('lorem')
  })

  it('should have CopyButton when output exists', async () => {
    const paragraphsInputs = screen.getAllByRole('spinbutton')
    const paragraphsInput = paragraphsInputs[0]

    await fireEvent.input(paragraphsInput, { target: { value: '1' } })
    vi.advanceTimersByTime(200)

    await waitFor(() => {
      const copyButton = document.querySelector('[title="Copy to clipboard"], [aria-label*="Copy"]')
      expect(copyButton).toBeInTheDocument()
    }, { timeout: 400 })
  })

  it('should persist state to localStorage', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    const paragraphsInputs = screen.getAllByRole('spinbutton')
    const paragraphsInput = paragraphsInputs[0]

    await fireEvent.input(paragraphsInput, { target: { value: '5' } })
    vi.advanceTimersByTime(200)
    vi.advanceTimersByTime(500)

    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith('devutils-lorem-paragraphs', '5')
    }, { timeout: 800 })

    setItemSpy.mockRestore()
  })
})
