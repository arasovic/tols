import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, waitFor } from '@testing-library/svelte'
import JsonTool from '$lib/tools/JsonTool.svelte'
import { encodeShareState } from '$lib/utils/share.js'

describe('JsonTool share links', () => {
  beforeEach(() => {
    localStorage.clear()
    window.location.hash = ''
  })

  afterEach(() => {
    window.location.hash = ''
  })

  it('loads input from a share link and ignores saved state', async () => {
    localStorage.setItem('devutils-json-input', '{"saved":"local"}')
    const encoded = /** @type {string} */ (encodeShareState({ input: '{"shared":"from-link"}' }))
    window.location.hash = `#s=${encoded}`

    const { container } = render(JsonTool)

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      expect(output?.textContent).toContain('from-link')
      expect(output?.textContent).not.toContain('local')
    }, { timeout: 1000 })
  })

  it('honors the compact flag from a share link', async () => {
    const encoded = /** @type {string} */ (
      encodeShareState({ input: '{"a":1,"b":2}', compact: 'true' })
    )
    window.location.hash = `#s=${encoded}`

    const { container } = render(JsonTool)

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      expect(output?.textContent).toContain('{"a":1,"b":2}')
    }, { timeout: 1000 })
  })

  it('falls back to saved state when the fragment is corrupted', async () => {
    localStorage.setItem('devutils-json-input', '{"saved":"local"}')
    window.location.hash = '#s=!!corrupted!!'

    const { container } = render(JsonTool)

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      expect(output?.textContent).toContain('local')
    }, { timeout: 1000 })
  })
})
