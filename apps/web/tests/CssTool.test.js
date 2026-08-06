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

    expect(screen.getByLabelText('stdin')).toBeInTheDocument()
    expect(screen.getByLabelText('stdout')).toBeInTheDocument()
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

  it('should show byte count', async () => {
    const { container } = render(CssTool)

    await waitFor(() => {
      const metas = [...container.querySelectorAll('.panel-meta')].map((n) => n.textContent.trim())
      expect(metas.some((m) => /\d+ B|\d+ KB/.test(m))).toBe(true)
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

  it('should not add space after pseudo-classes inside @media blocks', async () => {
    const { container } = render(CssTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '@media (max-width: 768px) { a:hover { color: red; } }' } })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    const text = output?.textContent || ''
    expect(text).toContain('a:hover')
    expect(text).not.toContain('a: hover')
    expect(text).toContain('color: red')
  })

  it('should not add space after pseudo-classes inside @supports blocks', async () => {
    const { container } = render(CssTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '@supports (display: grid) { a:focus { color: blue; } }' } })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    const text = output?.textContent || ''
    expect(text).toContain('a:focus')
    expect(text).not.toContain('a: focus')
    expect(text).toContain('color: blue')
  })

  it('should keep property spacing inside @keyframes blocks', async () => {
    const { container } = render(CssTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }' } })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    const text = output?.textContent || ''
    expect(text).toContain('from')
    expect(text).toContain('opacity: 0')
    expect(text).toContain('opacity: 1')
  })

  it('should not add space after pseudo-classes at top level', async () => {
    const { container } = render(CssTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'a:hover { color: red; }' } })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    const text = output?.textContent || ''
    expect(text).toContain('a:hover')
    expect(text).not.toContain('a: hover')
  })

  it('should preserve single spaces between box-shadow value tokens', async () => {
    const { container } = render(CssTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '.shadow { box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }' } })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    const text = output?.textContent || ''
    expect(text).toContain('box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1)')
    expect(text).not.toContain('02px')
  })

  it('should keep the space between url() and format() in @font-face src', async () => {
    const { container } = render(CssTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, {
      target: { value: '@font-face { font-family: "Test"; src: url("https://example.com/font.woff2") format("woff2"); }' },
    })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    const text = output?.textContent || ''
    expect(text).toContain('src: url("https://example.com/font.woff2") format("woff2")')
  })

  it('should preserve calc() operator spacing and multi-function values', async () => {
    const { container } = render(CssTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, {
      target: { value: '.calc { width: calc(100% - 20px); filter: blur(4px) saturate(150%); }' },
    })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    const text = output?.textContent || ''
    expect(text).toContain('width: calc(100% - 20px)')
    expect(text).toContain('filter: blur(4px) saturate(150%)')
  })

  it('should keep required spaces between minified value tokens', async () => {
    const { container } = render(CssTool)

    const minifyButton = screen.getByText('Minify')
    await fireEvent.click(minifyButton)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '.shadow { box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }' } })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    const text = output?.textContent || ''
    expect(text).toContain('box-shadow:0 2px 4px')
    expect(text).not.toContain('02px')
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

  it('rejects input larger than 1MB', async () => {
    const { container } = render(CssTool)

    const textarea = /** @type {HTMLTextAreaElement} */ (container.querySelector('.editor-textarea'))
    await fireEvent.input(textarea, { target: { value: '.x{' + 'a'.repeat(1024 * 1024) + '}' } })

    await waitFor(() => {
      expect(container.textContent).toContain('exceeds maximum size')
    }, { timeout: 1500 })
  })
})
