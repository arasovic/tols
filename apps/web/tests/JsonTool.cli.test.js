import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import JsonTool from '$lib/tools/JsonTool.svelte'

const PLACEHOLDER = '{"name": "Example", "version": "1.0.0"}'

/** @returns {string} the command exactly as the strip renders it */
function displayedCommand(container) {
  return container.querySelector('.command-text')?.textContent ?? ''
}

describe('JsonTool command strip', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    window.location.hash = ''
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    window.location.hash = ''
  })

  it('renders the live command for the current input while prettifying', async () => {
    const { container } = render(JsonTool)
    const inputArea = screen.getByPlaceholderText(PLACEHOLDER)
    await fireEvent.input(inputArea, { target: { value: '{"a":1}' } })

    await waitFor(() => {
      expect(displayedCommand(container)).toBe(`tols json fmt '{"a":1}' --indent=2`)
    })
  })

  it('drops the --indent flag when Minify becomes the active mode', async () => {
    const { container } = render(JsonTool)
    const inputArea = screen.getByPlaceholderText(PLACEHOLDER)
    await fireEvent.input(inputArea, { target: { value: '{"a":1}' } })
    await fireEvent.click(screen.getByText('Minify'))

    await waitFor(() => {
      expect(displayedCommand(container)).toBe(`tols json min '{"a":1}'`)
    })
  })

  it('switches to the @file form for a multi-line document', async () => {
    const { container } = render(JsonTool)
    const inputArea = screen.getByPlaceholderText(PLACEHOLDER)
    await fireEvent.input(inputArea, { target: { value: '{\n  "a": 1\n}' } })

    await waitFor(() => {
      expect(displayedCommand(container)).toBe('tols json fmt @input.json --indent=2')
    })
  })

  it('copies exactly the command the strip displays on Cmd+Shift+C', async () => {
    const { container } = render(JsonTool)
    const inputArea = screen.getByPlaceholderText(PLACEHOLDER)
    await fireEvent.input(inputArea, { target: { value: '{"a":1}' } })

    // Read the expectation out of the DOM rather than hardcoding it: this is
    // the assertion that catches the strip and the shortcut drifting apart.
    const shown = displayedCommand(container)
    expect(shown).not.toBe('')

    await fireEvent.keyDown(window, { key: 'c', metaKey: true, shiftKey: true })
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(shown)
    })

    await fireEvent.click(screen.getByText('Minify'))
    const shownAfter = displayedCommand(container)
    expect(shownAfter).not.toBe(shown)

    await fireEvent.keyDown(window, { key: 'c', metaKey: true, shiftKey: true })
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith(shownAfter)
    })
  })

  it('copies the rendered output on Cmd+Shift+O', async () => {
    const { container } = render(JsonTool)
    const inputArea = screen.getByPlaceholderText(PLACEHOLDER)
    await fireEvent.input(inputArea, { target: { value: '{"a":1}' } })
    vi.advanceTimersByTime(400)

    await waitFor(() => {
      expect(container.querySelector('.output-display')?.textContent).toBe('{\n  "a": 1\n}')
    })

    const shown = container.querySelector('.output-display')?.textContent
    await fireEvent.keyDown(window, { key: 'o', metaKey: true, shiftKey: true })
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(shown)
    })
  })

  it('reprocesses the input on Cmd+Enter without waiting for the debounce', async () => {
    const { container } = render(JsonTool)
    const inputArea = screen.getByPlaceholderText(PLACEHOLDER)
    await fireEvent.input(inputArea, { target: { value: '{"z":9}' } })

    // The debounce has not elapsed, so the pane still shows the previous output.
    expect(container.querySelector('.output-display')?.textContent).not.toContain('"z"')

    await fireEvent.keyDown(window, { key: 'Enter', metaKey: true })
    await waitFor(() => {
      expect(container.querySelector('.output-display')?.textContent).toBe('{\n  "z": 9\n}')
    })
  })
})
