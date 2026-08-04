import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/svelte'
import ShareButton from '$lib/components/ShareButton.svelte'
import { decodeShareState } from '$lib/utils/share.js'

describe('ShareButton', () => {
  beforeEach(() => {
    window.location.hash = ''
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue('')
      }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('copies a share URL whose fragment decodes back to the tool state', async () => {
    const { getByRole } = render(ShareButton, {
      props: { getState: () => ({ input: '{"shared":true}' }) }
    })

    await fireEvent.click(getByRole('button', { name: /shareable link/i }))

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })
    const written = /** @type {string} */ (navigator.clipboard.writeText.mock.calls[0][0])
    expect(written).toContain('#s=')
    const encoded = written.split('#s=')[1]
    expect(decodeShareState(encoded)).toEqual({ input: '{"shared":true}' })
  })

  it('shows feedback after copying', async () => {
    const { getByRole } = render(ShareButton, {
      props: { getState: () => ({ input: 'x' }) }
    })

    await fireEvent.click(getByRole('button', { name: /shareable link/i }))

    await waitFor(() => {
      expect(getByRole('button', { name: /shareable link/i }).textContent).toContain('Copied')
    })
  })

  it('refuses to share state beyond the link limit', async () => {
    const { getByRole } = render(ShareButton, {
      props: { getState: () => ({ input: 'a'.repeat(60_000) }) }
    })

    await fireEvent.click(getByRole('button', { name: /shareable link/i }))

    await waitFor(() => {
      expect(getByRole('button', { name: /shareable link/i }).textContent).toContain('Too large')
    })
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled()
  })

  it('survives clipboard failures without crashing', async () => {
    navigator.clipboard.writeText.mockRejectedValue(new Error('denied'))
    const { getByRole } = render(ShareButton, {
      props: { getState: () => ({ input: 'x' }) }
    })

    await fireEvent.click(getByRole('button', { name: /shareable link/i }))

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })
    // No "Copied" feedback when the copy failed
    expect(getByRole('button', { name: /shareable link/i }).textContent).not.toContain('Copied')
  })
})
