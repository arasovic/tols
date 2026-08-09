import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import CommandStrip from '$lib/ui/CommandStrip.svelte'

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src')
const componentSource = readFileSync(join(SRC, 'lib', 'ui', 'CommandStrip.svelte'), 'utf8')

describe('CommandStrip', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }
    })
  })

  it('renders the command for the current tool state', () => {
    const { container } = render(CommandStrip, {
      props: { toolId: 'json', action: 'fmt', input: '{"a":1}' }
    })
    expect(container.querySelector('.command-text')?.textContent?.trim())
      .toBe(`tols json fmt '{"a":1}'`)
  })

  it('shows and copies the canonical Diff file command', async () => {
    const { container } = render(CommandStrip, {
      props: { toolId: 'diff', action: 'run' }
    })
    const expected = 'tols diff @old.txt @new.txt'
    expect(container.querySelector('.command-text')?.textContent?.trim()).toBe(expected)

    await fireEvent.click(container.querySelector('.command-copy'))
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expected)
    })
  })

  it('shows a prompt marker that is not part of the copied text', async () => {
    const { container } = render(CommandStrip, {
      props: { toolId: 'json', action: 'fmt', input: '{}' }
    })
    expect(container.querySelector('.command-prompt')?.textContent).toBe('$')
    await fireEvent.click(container.querySelector('.command-copy'))
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(`tols json fmt '{}'`)
    })
  })

  it('falls back to the tool default action when none is given', () => {
    const { container } = render(CommandStrip, { props: { toolId: 'json', input: '{}' } })
    expect(container.querySelector('.command-text')?.textContent?.trim())
      .toBe(`tols json fmt '{}'`)
  })

  it('switches to the @file form for multiline input', () => {
    const { container } = render(CommandStrip, {
      props: { toolId: 'json', action: 'fmt', input: '{\n  "a": 1\n}' }
    })
    expect(container.querySelector('.command-text')?.textContent?.trim())
      .toBe('tols json fmt @input.json')
  })

  it('updates the command when input changes', async () => {
    const { container, component } = render(CommandStrip, {
      props: { toolId: 'base64', action: 'enc', input: 'a' }
    })
    await component.$set({ input: 'b' })
    await waitFor(() => {
      expect(container.querySelector('.command-text')?.textContent?.trim())
        .toBe('tols base64 enc b')
    })
  })

  it('exposes the command to assistive tech as a labelled region', () => {
    render(CommandStrip, { props: { toolId: 'json', action: 'fmt', input: '{}' } })
    expect(screen.getByLabelText('Equivalent tols command')).toBeInTheDocument()
  })

  it('renders nothing for an unknown tool id', () => {
    const { container } = render(CommandStrip, { props: { toolId: 'nope', input: 'x' } })
    expect(container.querySelector('.command-strip')).toBeNull()
  })

  it('never writes an empty command to the clipboard', async () => {
    // With an unknown tool id the whole markup is behind {#if template}, so
    // there is no visible copy button — but copy() is exported and ⌘⇧C still
    // reaches it. Unguarded, that silently replaced the user's clipboard with ''.
    const { component } = render(CommandStrip, { props: { toolId: 'not-a-tool', input: 'x' } })
    await component.copy()
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled()
  })

  it('freezes the caret solid under prefers-reduced-motion instead of leaving it dim', () => {
    // jsdom cannot evaluate media queries, so this asserts on the component's
    // own stylesheet the way tests/design-tokens.test.js asserts on app.css.
    const reducedMotionBlock = componentSource.match(
      /@media \(prefers-reduced-motion: reduce\)\s*{([\s\S]*?)}\s*}/
    )
    expect(reducedMotionBlock).not.toBeNull()
    const guard = reducedMotionBlock[1]
    expect(guard).toMatch(/\.command-caret/)
    expect(guard).toMatch(/animation:\s*none/)
    expect(guard).toMatch(/opacity:\s*1/)
  })

  it('exposes a state-appropriate accessible name on the copy button', async () => {
    const { container } = render(CommandStrip, {
      props: { toolId: 'json', action: 'fmt', input: '{}' }
    })
    expect(screen.getByLabelText('Copy command to clipboard')).toBeInTheDocument()
    await fireEvent.click(container.querySelector('.command-copy'))
    await waitFor(() => {
      expect(screen.getByLabelText('Command copied to clipboard')).toBeInTheDocument()
    })
  })

  it('surfaces a visible failure state when the clipboard write rejects', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('nope')) }
    })
    const { container } = render(CommandStrip, {
      props: { toolId: 'json', action: 'fmt', input: '{}' }
    })
    const button = container.querySelector('.command-copy')
    await fireEvent.click(button)
    await waitFor(() => {
      expect(button.textContent?.trim()).toMatch(/^failed/)
      expect(button.classList.contains('is-failed')).toBe(true)
      expect(button.getAttribute('aria-label')).toBe('Failed to copy command')
    })
  })

  it('sizes the caret off the type scale, not raw px', () => {
    // jsdom cannot evaluate media queries or layout, so this asserts on the
    // component's own stylesheet, the same way the reduced-motion test does.
    // Isolate the .command-caret block specifically so these assertions can't
    // be satisfied by a declaration living in some other rule.
    const caretBlock = componentSource.match(/\.command-caret\s*{([^}]*)}/)
    expect(caretBlock).not.toBeNull()
    const block = caretBlock[1]
    expect(block).not.toMatch(/width:\s*\d+px/)
    expect(block).not.toMatch(/height:\s*\d+px/)
    expect(block).toMatch(/width:\s*1ch/)
    expect(block).toMatch(/height:\s*1em/)
    expect(block).toMatch(/font-family:\s*var\(--font-mono\)/)
  })

  it('keeps the caret next to the command and the command out of the copy button', () => {
    // jsdom computes no layout, so this pins the two declarations whose absence
    // produced the real defects: `flex: 1` on .command-text stretched the box
    // across the strip and stranded the caret at the far edge, and no overflow
    // on a `white-space: pre` box let a long command paint over .command-copy.
    const textBlock = componentSource.match(/\.command-text\s*{([^}]*)}/)
    expect(textBlock).not.toBeNull()
    expect(textBlock[1]).not.toMatch(/flex:\s*1\s*;/)
    expect(textBlock[1]).toMatch(/flex:\s*0 1 auto/)
    expect(textBlock[1]).toMatch(/overflow-x:\s*auto/)

    const copyBlock = componentSource.match(/\.command-copy\s*{([^}]*)}/)
    expect(copyBlock).not.toBeNull()
    expect(copyBlock[1]).toMatch(/margin-left:\s*auto/)
  })
})
