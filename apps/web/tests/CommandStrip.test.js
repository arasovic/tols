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
})
