import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import HtmlTool from '$lib/tools/HtmlTool.svelte'

function waitForDebounce(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('HtmlTool', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with tool header', () => {
    render(HtmlTool)
    expect(screen.getByText('HTML Formatter')).toBeInTheDocument()
  })

  it('should beautify HTML input', async () => {
    const { container } = render(HtmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<div><p>Text</p></div>' } })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    expect(output?.textContent).toContain('<div>')
  })

  it('should handle invalid HTML gracefully', async () => {
    const { container } = render(HtmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<div><p>Unclosed' } })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    expect(output?.textContent).toBeTruthy()
  })

  it('should switch to minify mode', async () => {
    const { container } = render(HtmlTool)

    const minifyButton = screen.getByText('Minify')
    await fireEvent.click(minifyButton)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<div>   <p>Text</p>   </div>' } })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    expect(output?.textContent).not.toContain('   ')
  })

  it('should clear content when clear button clicked', async () => {
    const { container } = render(HtmlTool)

    const clearButton = container.querySelector('[title="Clear"]')
    await fireEvent.click(clearButton)

    const textarea = container.querySelector('.editor-textarea')
    expect(textarea?.value).toBe('')
  })

  it('should load example when load example button clicked', async () => {
    const { container } = render(HtmlTool)

    const loadExampleButton = container.querySelector('[title="Load Example"]')
    await fireEvent.click(loadExampleButton)

    const textarea = container.querySelector('.editor-textarea')
    expect(textarea?.value).toContain('<!DOCTYPE html>')
  })

  it('should remove comments in minify mode', async () => {
    const { container } = render(HtmlTool)

    const minifyButton = screen.getByText('Minify')
    await fireEvent.click(minifyButton)

    await waitForDebounce(200)

    // Verify checkbox exists before clicking
    const removeCommentsCheckbox = container.querySelector('input[type="checkbox"]')
    if (removeCommentsCheckbox) {
      await fireEvent.click(removeCommentsCheckbox)
    }

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<div><!-- comment --></div>' } })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    expect(output?.textContent).not.toContain('comment')
  })

  it('should handle self-closing tags', async () => {
    const { container } = render(HtmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<br><img src="test.jpg"><input>' } })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    expect(output?.textContent).toContain('<br>')
    expect(output?.textContent).toContain('<img')
  })

  it('should preserve content within textarea and pre', async () => {
    const { container } = render(HtmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<pre>  preserved  </pre>' } })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    expect(output?.textContent).toContain('preserved')
  })

  it('should handle DOCTYPE declaration', async () => {
    const { container } = render(HtmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<!DOCTYPE html><html><body></body></html>' } })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    expect(output?.textContent).toContain('<!DOCTYPE html>')
  })
})
