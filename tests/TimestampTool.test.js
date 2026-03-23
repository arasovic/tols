import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import TimestampTool from '$lib/tools/TimestampTool.svelte'

describe('TimestampTool', () => {
  let component

  beforeEach(() => {
    component = render(TimestampTool)
  })

  it('should not show error for empty input on mount - should have default input', () => {
    const inputField = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    expect(inputField).toBeInTheDocument()
  })

  it('should convert Unix timestamp to human readable date', async () => {
    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    await fireEvent.input(inputArea, { target: { value: '1609459200' } }) // 2021-01-01 00:00:00 UTC

    await waitForDebounce(200)

    const outputContentPre = document.querySelector('.output-content pre')
    expect(outputContentPre.textContent).toContain('2021')
  })

  it('should convert Unix timestamp (milliseconds) to human readable date', async () => {
    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    await fireEvent.input(inputArea, { target: { value: '1609459200000' } }) // 2021-01-01 00:00:00 UTC in milliseconds

    await waitForDebounce(200)

    const outputContentPre = document.querySelector('.output-content pre')
    expect(outputContentPre.textContent).toContain('2021')
  })

  it('should convert human readable date to Unix timestamp', async () => {
    const toUnixButton = screen.getByText('Human → Unix')
    await fireEvent.click(toUnixButton)

    const inputArea = screen.getByPlaceholderText('Enter date (e.g., 2024-01-01 00:00:00)...')
    await fireEvent.input(inputArea, { target: { value: '2024-01-15 14:30:00' } })

    await waitForDebounce(200)

    const outputContentPre = document.querySelector('.output-content pre')
    expect(outputContentPre.textContent).toContain('unix')
    expect(parseInt(JSON.parse(outputContentPre.textContent).unix)).toBeGreaterThan(1600000000)
  })

  it('should handle timezone conversion', async () => {
    const newYorkButton = screen.getByText('New York (EST/EDT)')
    await fireEvent.click(newYorkButton)

    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    await fireEvent.input(inputArea, { target: { value: '1609459200' } }) // 2021-01-01 00:00:00 UTC

    await waitForDebounce(200)

    const outputContentPre = document.querySelector('.output-content pre')
    // New York is UTC-5 (EST), so 2021-01-01 00:00:00 UTC is 2020-12-31 19:00:00 EST
    expect(outputContentPre.textContent).toContain('2020')
  })

  it('should show error for invalid timestamp', async () => {
    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    await fireEvent.input(inputArea, { target: { value: 'not-a-timestamp' } })

    await waitForDebounce(200)

    const errorDiv = screen.getByText('Invalid timestamp format')
    expect(errorDiv).toBeInTheDocument()
  })

  it('should show error for invalid date', async () => {
    const toUnixButton = screen.getByText('Human → Unix')
    await fireEvent.click(toUnixButton)

    const inputArea = screen.getByPlaceholderText('Enter date (e.g., 2024-01-01 00:00:00)...')
    await fireEvent.input(inputArea, { target: { value: 'invalid-date' } })

    await waitForDebounce(200)

    const errorDiv = screen.getByText('Invalid date format')
    expect(errorDiv).toBeInTheDocument()
  })

  it('should set current timestamp when "Now" button is clicked', async () => {
    const nowButton = screen.getByRole('button', { name: 'Now' })
    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')

    await fireEvent.click(nowButton)

    const timestamp = parseInt(inputArea.value)
    const currentTime = Math.floor(Date.now() / 1000)
    expect(timestamp).toBeGreaterThanOrEqual(currentTime - 5)
    expect(timestamp).toBeLessThanOrEqual(currentTime + 5)
  })

  it('should not show "Now" button in Human → Unix mode', async () => {
    const toUnixButton = screen.getByText('Human → Unix')
    await fireEvent.click(toUnixButton)

    const nowButton = screen.queryByRole('button', { name: 'Now' })
    expect(nowButton).not.toBeInTheDocument()
  })

  it('should handle timezone selector visibility', () => {
    const timezoneSection = screen.getByText('Output Timezone')
    expect(timezoneSection).toBeInTheDocument()
  })

  it('should clear all fields when clear button is clicked', async () => {
    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    await fireEvent.input(inputArea, { target: { value: '1609459200' } })

    const clearButton = screen.getByTitle('Clear')
    await fireEvent.click(clearButton)

    expect(inputArea.value).toBe('')
    expect(screen.queryByText('2021')).not.toBeInTheDocument()
  })

  it('should debounce input changes', async () => {
    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')

    await fireEvent.input(inputArea, { target: { value: '1609459200' } })
    await fireEvent.input(inputArea, { target: { value: '1609459201' } })
    await fireEvent.input(inputArea, { target: { value: '1609459202' } })

    await waitForDebounce(200)

    const outputContent = document.querySelector('.output-content pre')
    expect(outputContent.textContent).toContain('2021')
  })

  it('should handle ISO date format', async () => {
    const toUnixButton = screen.getByText('Human → Unix')
    await fireEvent.click(toUnixButton)

    const inputArea = screen.getByPlaceholderText('Enter date (e.g., 2024-01-01 00:00:00)...')
    await fireEvent.input(inputArea, { target: { value: '2024-01-15T14:30:00Z' } })

    await waitForDebounce(200)

    const outputContentPre = document.querySelector('.output-content pre')
    expect(outputContentPre.textContent).toContain('unix')
    expect(parseInt(JSON.parse(outputContentPre.textContent).unix)).toBeGreaterThan(1600000000)
  })

  it('should handle timezone abbreviations', async () => {
    const londonButton = screen.getByText('London (GMT/BST)')
    await fireEvent.click(londonButton)

    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    await fireEvent.input(inputArea, { target: { value: '1609459200' } })

    await waitForDebounce(200)

    const outputContent = document.querySelector('.output-content pre')
    expect(outputContent.textContent).toBeTruthy()
  })

  it('should handle local timezone correctly', async () => {
    const localButton = screen.getByText('Local Time')
    await fireEvent.click(localButton)

    const inputArea = screen.getByPlaceholderText('Enter Unix timestamp (e.g., 1704067200)...')
    await fireEvent.input(inputArea, { target: { value: '1609459200' } })

    await waitForDebounce(200)

    const outputContent = document.querySelector('.output-content pre')
    expect(outputContent.textContent).toBeTruthy()
  })
})

function waitForDebounce(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
