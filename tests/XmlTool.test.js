import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import XmlTool from '$lib/tools/XmlTool.svelte'

function waitForDebounce(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('XmlTool', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with tool header', () => {
    render(XmlTool)
    expect(screen.getByText('XML Formatter')).toBeInTheDocument()
  })

  it('should format valid XML', async () => {
    const { container } = render(XmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<root><item>text</item></root>' } })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    expect(output?.textContent).toContain('<root>')
    expect(output?.textContent).toContain('  <item>')
  })

  it('should show error for invalid XML', async () => {
    const { container } = render(XmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<root><unclosed' } })

    await waitForDebounce(400)

    expect(screen.getByText(/Invalid XML/)).toBeInTheDocument()
  })

  it('should minify XML in minify mode', async () => {
    const { container } = render(XmlTool)

    const minifyButton = screen.getByText('Minify')
    await fireEvent.click(minifyButton)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<root>\n  <item>text</item>\n</root>' } })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    expect(output?.textContent).not.toContain('\n')
  })

  it('should handle XML comments', async () => {
    const { container } = render(XmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<!-- comment --><root></root>' } })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    expect(output?.textContent).toContain('<!-- comment -->')
  })

  it('should handle CDATA sections', async () => {
    const { container } = render(XmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<root><![CDATA[<not>parsed</not>]]></root>' } })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    expect(output?.textContent).toContain('<![CDATA[')
  })

  it('should handle processing instructions', async () => {
    const { container } = render(XmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<?xml version="1.0"?><root></root>' } })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    expect(output?.textContent).toContain('<?xml version="1.0"?>')
  })

  it('should clear content when clear button clicked', async () => {
    const { container } = render(XmlTool)

    const clearButton = container.querySelector('[title="Clear"]')
    await fireEvent.click(clearButton)

    const textarea = container.querySelector('.editor-textarea')
    expect(textarea?.value).toBe('')
  })

  it('should load example when load example button clicked', async () => {
    const { container } = render(XmlTool)

    const loadExampleButton = container.querySelector('[title="Load Example"]')
    await fireEvent.click(loadExampleButton)

    const textarea = container.querySelector('.editor-textarea')
    expect(textarea?.value).toContain('<?xml version="1.0"')
  })

  it('should show character count', async () => {
    const { container } = render(XmlTool)

    await waitFor(() => {
      expect(container.textContent).toContain('chars')
    }, { timeout: 500 })
  })

  it('should handle self-closing tags', async () => {
    const { container } = render(XmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<root><item/></root>' } })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    expect(output?.textContent).toContain('<item/')
  })
})
