import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { render, fireEvent, waitFor } from '@testing-library/svelte'
import TerminalDemo from '$lib/components/TerminalDemo.svelte'

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src')

describe('TerminalDemo', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the install line and copies it verbatim', async () => {
    const { getByText } = render(TerminalDemo)

    expect(getByText('npm i -g tols-cli')).toBeInTheDocument()

    await fireEvent.click(getByText('copy'))

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('npm i -g tols-cli')
    })
    // The clipboard call alone does not prove the user saw anything happen.
    await waitFor(() => {
      expect(getByText('copied')).toBeInTheDocument()
    })
  })

  it('leaves the copy button in its default state when the clipboard write fails', async () => {
    navigator.clipboard.writeText.mockRejectedValue(new Error('denied'))
    const { getByText } = render(TerminalDemo)

    await fireEvent.click(getByText('copy'))

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })
    expect(getByText('copy')).toBeInTheDocument()
  })

  it('renders every transcript entry with its command and output lines in order', () => {
    const { container } = render(TerminalDemo)

    const transcript = container.querySelector('.transcript')
    expect(transcript).not.toBeNull()
    const text = transcript?.textContent ?? ''

    const bEncIdx = text.indexOf('tols b64 enc hello')
    const bEncOutIdx = text.indexOf('aGVsbG8=')
    const bDecIdx = text.indexOf('echo -n aGVsbG8= | tols b64 dec')
    const bDecOutIdx = text.indexOf('hello', bDecIdx)
    const jsonIdx = text.indexOf("tols json fmt '{\"a\":1,\"b\":[2,3]}'")
    const jsonOutIdx = text.indexOf('{')
    const jsonCloseIdx = text.lastIndexOf('}')

    expect(bEncIdx).toBeGreaterThanOrEqual(0)
    expect(bEncOutIdx).toBeGreaterThan(bEncIdx)
    expect(bDecIdx).toBeGreaterThan(bEncOutIdx)
    expect(bDecOutIdx).toBeGreaterThan(bDecIdx)
    expect(jsonIdx).toBeGreaterThan(bDecOutIdx)
    expect(jsonOutIdx).toBeGreaterThan(jsonIdx)
    expect(jsonCloseIdx).toBeGreaterThan(jsonOutIdx)

    // Every declared output line for the json fmt entry is present, in order.
    const jsonLines = ['{', '  "a": 1,', '  "b": [', '    2,', '    3', '  ]', '}']
    let cursor = jsonIdx
    for (const line of jsonLines) {
      const idx = text.indexOf(line, cursor)
      expect(idx).toBeGreaterThanOrEqual(cursor)
      cursor = idx + line.length
    }
  })

  it('declares no animation (anti-slop rule 6: real output only)', () => {
    const source = readFileSync(join(SRC, 'lib', 'components', 'TerminalDemo.svelte'), 'utf-8')

    expect(source).not.toMatch(/@keyframes/)
    expect(source).not.toMatch(/animation\s*:/)
    expect(source).not.toMatch(/setInterval/)
    expect(source).not.toMatch(/requestAnimationFrame/)
  })
})
