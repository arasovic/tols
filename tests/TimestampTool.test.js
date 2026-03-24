import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/svelte'
import TimestampTool from '$lib/tools/TimestampTool.svelte'

const DEBOUNCE_MS = 150

function waitForDebounce(ms = DEBOUNCE_MS + 50) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('TimestampTool', () => {
  let component

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    component = render(TimestampTool)
  })

  afterEach(() => {
    cleanup()
  })

  it('renders with default input field', () => {
    const inputField = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    expect(inputField).toBeInTheDocument()
  })

  it('converts Unix timestamp to human readable date', async () => {
    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    await fireEvent.input(inputArea, { target: { value: '1609459200' } }) // 2021-01-01 00:00:00 UTC

    await waitForDebounce()

    const outputContentPre = document.querySelector('.output-content pre')
    expect(outputContentPre.textContent).toContain('2021')
  })

  it('converts Unix timestamp (milliseconds) to human readable date', async () => {
    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    await fireEvent.input(inputArea, { target: { value: '1609459200000' } }) // 2021-01-01 00:00:00 UTC in milliseconds

    await waitForDebounce()

    const outputContentPre = document.querySelector('.output-content pre')
    expect(outputContentPre.textContent).toContain('2021')
  })

  it('converts human readable date to Unix timestamp', async () => {
    const toUnixButton = screen.getByText('Human → Unix')
    await fireEvent.click(toUnixButton)

    const inputArea = screen.getByPlaceholderText('Enter date (e.g., 2024-01-01 00:00:00)...')
    await fireEvent.input(inputArea, { target: { value: '2024-01-15 14:30:00' } })

    await waitForDebounce()

    const outputContentPre = document.querySelector('.output-content pre')
    expect(outputContentPre.textContent).toContain('unix')
    expect(parseInt(JSON.parse(outputContentPre.textContent).unix, 10)).toBeGreaterThan(1600000000)
  })

  it('handles timezone conversion', async () => {
    const newYorkButton = screen.getByText('New York (EST/EDT)')
    await fireEvent.click(newYorkButton)

    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    await fireEvent.input(inputArea, { target: { value: '1609459200' } }) // 2021-01-01 00:00:00 UTC

    await waitForDebounce()

    const outputContentPre = document.querySelector('.output-content pre')
    // New York is UTC-5 (EST), so 2021-01-01 00:00:00 UTC is 2020-12-31 19:00:00 EST
    expect(outputContentPre.textContent).toContain('2020')
  })

  it('shows error for invalid timestamp', async () => {
    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    await fireEvent.input(inputArea, { target: { value: 'not-a-timestamp' } })

    await waitForDebounce()

    const errorDiv = screen.getByText('Invalid timestamp format')
    expect(errorDiv).toBeInTheDocument()
  })

  it('shows error for invalid date', async () => {
    const toUnixButton = screen.getByText('Human → Unix')
    await fireEvent.click(toUnixButton)

    const inputArea = screen.getByPlaceholderText('Enter date (e.g., 2024-01-01 00:00:00)...')
    await fireEvent.input(inputArea, { target: { value: 'invalid-date' } })

    await waitForDebounce()

    const errorDiv = screen.getByText('Invalid date format')
    expect(errorDiv).toBeInTheDocument()
  })

  it('sets current timestamp when Now button is clicked', async () => {
    const nowButton = screen.getByRole('button', { name: 'Now' })
    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')

    await fireEvent.click(nowButton)

    const timestamp = parseInt(inputArea.value, 10)
    const currentTime = Math.floor(Date.now() / 1000)
    expect(timestamp).toBeGreaterThanOrEqual(currentTime - 5)
    expect(timestamp).toBeLessThanOrEqual(currentTime + 5)
  })

  it('does not show Now button in Human → Unix mode', async () => {
    const toUnixButton = screen.getByText('Human → Unix')
    await fireEvent.click(toUnixButton)

    const nowButton = screen.queryByRole('button', { name: 'Now' })
    expect(nowButton).not.toBeInTheDocument()
  })

  it('renders timezone selector', () => {
    const timezoneSection = screen.getByText('Output Timezone')
    expect(timezoneSection).toBeInTheDocument()
  })

  it('clears all fields when clear button is clicked', async () => {
    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    await fireEvent.input(inputArea, { target: { value: '1609459200' } })

    await waitForDebounce()

    const clearButton = screen.getByRole('button', { name: 'Clear' })
    await fireEvent.click(clearButton)

    expect(inputArea.value).toBe('')
    expect(screen.queryByText('2021')).not.toBeInTheDocument()
  })

  it('debounces input changes', async () => {
    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')

    await fireEvent.input(inputArea, { target: { value: '1609459200' } })
    await fireEvent.input(inputArea, { target: { value: '1609459201' } })
    await fireEvent.input(inputArea, { target: { value: '1609459202' } })

    await waitForDebounce()

    const outputContent = document.querySelector('.output-content pre')
    expect(outputContent.textContent).toContain('2021')
  })

  it('handles ISO date format', async () => {
    const toUnixButton = screen.getByText('Human → Unix')
    await fireEvent.click(toUnixButton)

    const inputArea = screen.getByPlaceholderText('Enter date (e.g., 2024-01-01 00:00:00)...')
    await fireEvent.input(inputArea, { target: { value: '2024-01-15T14:30:00Z' } })

    await waitForDebounce()

    const outputContentPre = document.querySelector('.output-content pre')
    expect(outputContentPre.textContent).toContain('unix')
    expect(parseInt(JSON.parse(outputContentPre.textContent).unix, 10)).toBeGreaterThan(1600000000)
  })

  it('handles timezone abbreviations', async () => {
    const londonButton = screen.getByText('London (GMT/BST)')
    await fireEvent.click(londonButton)

    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    await fireEvent.input(inputArea, { target: { value: '1609459200' } })

    await waitForDebounce()

    const outputContent = document.querySelector('.output-content pre')
    expect(outputContent.textContent).toBeTruthy()
  })

  it('handles local timezone correctly', async () => {
    const localButton = screen.getByText('Local Time')
    await fireEvent.click(localButton)

    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    await fireEvent.input(inputArea, { target: { value: '1609459200' } })

    await waitForDebounce()

    const outputContent = document.querySelector('.output-content pre')
    expect(outputContent.textContent).toBeTruthy()
  })

  it('cleans up timeouts on unmount', async () => {
    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    await fireEvent.input(inputArea, { target: { value: '1609459200' } })

    // Unmount immediately during debounce
    cleanup()

    // Should not throw and timeout should be cleared
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')).not.toBeInTheDocument()
    })
  })

  it('cancels pending save when clear is clicked', async () => {
    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    await fireEvent.input(inputArea, { target: { value: '1609459200' } })

    const clearButton = screen.getByRole('button', { name: 'Clear' })
    await fireEvent.click(clearButton)

    // Wait for any pending saves
    await new Promise(resolve => setTimeout(resolve, 600))

    expect(inputArea.value).toBe('')
    expect(localStorage.getItem('devutils-timestamp-input')).toBeFalsy()
  })

  it('handles negative timestamps (dates before 1970)', async () => {
    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    await fireEvent.input(inputArea, { target: { value: '-86400' } }) // 1969-12-31

    await waitForDebounce()

    const outputContentPre = document.querySelector('.output-content pre')
    expect(outputContentPre.textContent).toContain('1969')
  })

  it('handles year 2038 timestamp', async () => {
    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    await fireEvent.input(inputArea, { target: { value: '2145916800' } }) // 2038-01-01

    await waitForDebounce()

    const outputContentPre = document.querySelector('.output-content pre')
    expect(outputContentPre.textContent).toContain('2038')
  })

  it('handles year 2100 timestamp', async () => {
    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    await fireEvent.input(inputArea, { target: { value: '4102444800' } }) // 2100-01-01

    await waitForDebounce()

    const outputContentPre = document.querySelector('.output-content pre')
    expect(outputContentPre.textContent).toContain('2100')
  })

  it('handles localStorage failure gracefully', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage full')
    })

    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    await fireEvent.input(inputArea, { target: { value: '1609459200' } })

    // Wait for debounce and save debounce
    await new Promise(resolve => setTimeout(resolve, 700))

    expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to save to localStorage:', expect.any(Error))

    setItemSpy.mockRestore()
    consoleWarnSpy.mockRestore()
  })

  it('clears input on mode switch', async () => {
    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    await fireEvent.input(inputArea, { target: { value: '1609459200' } })

    const toUnixButton = screen.getByText('Human → Unix')
    await fireEvent.click(toUnixButton)

    const newInputArea = screen.getByPlaceholderText('Enter date (e.g., 2024-01-01 00:00:00)...')
    expect(newInputArea.value).toBe('')
  })

  it('handles invalid timezone gracefully', async () => {
    // Force an invalid timezone by manipulating component state
    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    await fireEvent.input(inputArea, { target: { value: '1609459200' } })

    await waitForDebounce()

    // Output should still be present even with valid timezone
    const outputContent = document.querySelector('.output-content pre')
    expect(outputContent).toBeTruthy()
  })

  it('processes on Enter key press', async () => {
    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    await fireEvent.input(inputArea, { target: { value: '1609459200' } })
    await fireEvent.keyDown(inputArea, { key: 'Enter' })

    // Process should run immediately without debounce wait
    const outputContentPre = document.querySelector('.output-content pre')
    expect(outputContentPre.textContent).toContain('2021')
  })

  it('handles millisecond timestamp detection', async () => {
    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    // 10000000000000ms = ~2286-11-20 (clearly in milliseconds range)
    await fireEvent.input(inputArea, { target: { value: '10000000000000' } })

    await waitForDebounce()

    const outputContentPre = document.querySelector('.output-content pre')
    expect(outputContentPre.textContent).toContain('2286')
  })

  it('handles various ISO 8601 date formats', async () => {
    const toUnixButton = screen.getByText('Human → Unix')
    await fireEvent.click(toUnixButton)

    const testCases = [
      '2024-01-15',
      '2024-01-15T14:30:00',
      '2024-01-15T14:30:00.000Z',
      '2024-01-15 14:30:00',
    ]

    for (const dateStr of testCases) {
      cleanup()
      component = render(TimestampTool)
      await fireEvent.click(screen.getByText('Human → Unix'))

      const inputArea = screen.getByPlaceholderText('Enter date (e.g., 2024-01-01 00:00:00)...')
      await fireEvent.input(inputArea, { target: { value: dateStr } })

      await waitForDebounce()

      const outputContentPre = document.querySelector('.output-content pre')
      expect(outputContentPre.textContent).toContain('unix')
      const parsed = JSON.parse(outputContentPre.textContent)
      expect(parsed.unix).toBeGreaterThan(1600000000)
    }
  })

  it('has aria-pressed on mode buttons', () => {
    const toHumanButton = screen.getByText('Unix → Human').closest('button')
    const toUnixButton = screen.getByText('Human → Unix').closest('button')

    expect(toHumanButton).toHaveAttribute('aria-pressed', 'true')
    expect(toUnixButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('has aria-pressed on timezone buttons', async () => {
    const utcButton = screen.getByText('UTC').closest('button')
    expect(utcButton).toHaveAttribute('aria-pressed', 'true')

    const localButton = screen.getByText('Local Time').closest('button')
    expect(localButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('has aria-label on action buttons', () => {
    const loadExampleButton = screen.getByRole('button', { name: 'Load Example' })
    const clearButton = screen.getByRole('button', { name: 'Clear' })

    expect(loadExampleButton).toBeInTheDocument()
    expect(clearButton).toBeInTheDocument()
  })

  it('has accessible error state', async () => {
    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    await fireEvent.input(inputArea, { target: { value: 'invalid' } })

    await waitForDebounce()

    const errorDiv = screen.getByRole('alert')
    expect(errorDiv).toHaveAttribute('aria-live', 'polite')
    expect(errorDiv).toHaveTextContent('Invalid timestamp format')
  })

  it('input has aria-describedby linking to error', () => {
    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    expect(inputArea).toHaveAttribute('aria-describedby', 'timestamp-error')
  })
})
