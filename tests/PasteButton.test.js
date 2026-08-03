import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/svelte'
import PasteButton from '$lib/components/PasteButton.svelte'

describe('PasteButton', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      clipboard: {
        readText: vi.fn().mockResolvedValue('pasted text'),
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('emits the clipboard text via the text event', async () => {
    const { component, getByRole } = render(PasteButton)

    const received = []
    component.$on('text', (/** @type {CustomEvent<{text: string}>} */ e) => {
      received.push(e.detail.text)
    })

    await fireEvent.click(getByRole('button', { name: /paste from clipboard/i }))

    await waitFor(() => {
      expect(received).toEqual(['pasted text'])
    })
  })

  it('shows Pasted feedback on success', async () => {
    const { getByRole } = render(PasteButton)

    await fireEvent.click(getByRole('button', { name: /paste from clipboard/i }))

    await waitFor(() => {
      expect(getByRole('button', { name: /paste from clipboard/i }).textContent).toContain('Pasted')
    })
  })

  it('reports an error for an empty clipboard', async () => {
    navigator.clipboard.readText.mockResolvedValue('')
    const { getByRole } = render(PasteButton)

    await fireEvent.click(getByRole('button', { name: /paste from clipboard/i }))

    await waitFor(() => {
      expect(getByRole('button', { name: /paste from clipboard/i }).textContent).toContain('No clipboard')
    })
  })

  it('reports an error when the clipboard API is unavailable', async () => {
    vi.stubGlobal('navigator', {})
    const { getByRole } = render(PasteButton)

    await fireEvent.click(getByRole('button', { name: /paste from clipboard/i }))

    await waitFor(() => {
      expect(getByRole('button', { name: /paste from clipboard/i }).textContent).toContain('No clipboard')
    })
  })
})
