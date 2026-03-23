import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import CssTool from '$lib/tools/CssTool.svelte'

function waitForDebounce(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('CssTool', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with tool header', () => {
    render(CssTool)
    expect(screen.getByText('CSS Formatter')).toBeInTheDocument()
  })

  it('should have beautify and minify modes', () => {
    render(CssTool)

    expect(screen.getByText('Beautify')).toBeInTheDocument()
    expect(screen.getByText('Minify')).toBeInTheDocument()
  })

  it('should have input and output areas', () => {
    render(CssTool)

    expect(screen.getByText('CSS Input')).toBeInTheDocument()
    expect(screen.getByText('CSS Output')).toBeInTheDocument()
  })

  it('should beautify CSS input', async () => {
    const { container } = render(CssTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '.class{color:red;}' } })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    expect(output).toBeInTheDocument()
    const text = output?.textContent || ''
    expect(text).toContain('{')
    expect(text).toContain('color:')
  })

  it('should minify CSS in minify mode', async () => {
    const { container } = render(CssTool)

    const minifyButton = screen.getByText('Minify')
    await fireEvent.click(minifyButton)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '.class {\n  color: red;\n}' } })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    const text = output?.textContent || ''
    expect(text).not.toContain('\n')
  })

  it('should clear content when clear button clicked', async () => {
    const { container } = render(CssTool)

    const clearButton = container.querySelector('[title="Clear"]')
    await fireEvent.click(clearButton)

    const textarea = container.querySelector('.editor-textarea')
    expect(textarea?.value).toBe('')
  })

  it('should load example when load example button clicked', async () => {
    const { container } = render(CssTool)

    const loadExampleButton = container.querySelector('[title="Load Example"]')
    await fireEvent.click(loadExampleButton)

    const textarea = container.querySelector('.editor-textarea')
    expect(textarea?.value).toContain('.container')
  })

  it('should show character count', async () => {
    const { container } = render(CssTool)

    await waitFor(() => {
      expect(container.textContent).toContain('chars')
    }, { timeout: 500 })
  })

  it('should handle CSS with comments', async () => {
    const { container } = render(CssTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '/* comment */\n.class { color: red; }' } })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    expect(output?.textContent).toContain('.class')
  })

  it('should handle nested selectors', async () => {
    const { container } = render(CssTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '.parent .child { color: blue; }' } })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    expect(output?.textContent).toContain('.parent .child')
  })

  it('should debounce input processing', async () => {
    const { container } = render(CssTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '.' } })
    await fireEvent.input(textarea, { target: { value: '.c' } })
    await fireEvent.input(textarea, { target: { value: '.cl' } })

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      const text = output?.textContent || ''
      expect(text).toContain('.cl')
    }, { timeout: 500 })
  })
})
