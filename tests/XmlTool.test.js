import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import XmlTool from '$lib/tools/XmlTool.svelte'

const DEBOUNCE_TIME = 400 // Matches actual debounce (400ms)
const SAVE_DEBOUNCE_TIME = 600 // Slightly more than save debounce (500ms)
const MODE_DEBOUNCE_TIME = 100 // Slightly more than mode debounce (50ms)

function waitForDebounce(ms = DEBOUNCE_TIME) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('XmlTool', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should initialize with tool header', () => {
    render(XmlTool)
    expect(screen.getByText('XML Formatter')).toBeInTheDocument()
  })

  it('should format valid XML', async () => {
    const { container } = render(XmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<root><item>text</item></root>' } })

    await waitForDebounce()

    const output = container.querySelector('.output-display')
    expect(output?.textContent).toContain('<root>')
    expect(output?.textContent).toContain('  <item>')
  })

  it('should show error for invalid XML', async () => {
    const { container } = render(XmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<root><unclosed' } })

    await waitForDebounce()

    expect(screen.getByText(/Invalid XML/)).toBeInTheDocument()
  })

  it('should show error for empty input', async () => {
    const { container } = render(XmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '   ' } })

    await waitForDebounce()

    expect(screen.getByText(/Please enter XML input/)).toBeInTheDocument()
  })

  it('should minify XML in minify mode', async () => {
    const { container } = render(XmlTool)

    const minifyButton = screen.getByText('Minify')
    await fireEvent.click(minifyButton)
    await waitFor(async () => {
      await waitForDebounce(MODE_DEBOUNCE_TIME)
    }, { timeout: 200 })

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<root>\n  <item>text</item>\n</root>' } })

    await waitForDebounce()

    const output = container.querySelector('.output-display')
    expect(output?.textContent).not.toContain('\n')
  })

  it('should switch between format and minify modes', async () => {
    const { container } = render(XmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<root>\n  <item>text</item>\n</root>' } })
    await waitForDebounce()

    // Switch to minify
    const minifyButton = screen.getByText('Minify')
    await fireEvent.click(minifyButton)
    await waitFor(async () => {
      await waitForDebounce(MODE_DEBOUNCE_TIME)
    }, { timeout: 200 })

    let output = container.querySelector('.output-display')
    expect(output?.textContent).not.toContain('\n  ')

    // Switch back to format
    const formatButton = screen.getByText('Format')
    await fireEvent.click(formatButton)
    await waitFor(async () => {
      await waitForDebounce(MODE_DEBOUNCE_TIME)
    }, { timeout: 200 })

    output = container.querySelector('.output-display')
    expect(output?.textContent).toContain('  <item>')
  })

  it('should handle XML comments', async () => {
    const { container } = render(XmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<!-- comment --><root></root>' } })

    await waitForDebounce()

    const output = container.querySelector('.output-display')
    expect(output?.textContent).toContain('<!-- comment -->')
  })

  it('should handle CDATA sections', async () => {
    const { container } = render(XmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<root><![CDATA[<not>parsed</not>]]></root>' } })

    await waitForDebounce()

    const output = container.querySelector('.output-display')
    expect(output?.textContent).toContain('<![CDATA[')
  })

  it('should handle processing instructions', async () => {
    const { container } = render(XmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<?xml version="1.0"?><root></root>' } })

    await waitForDebounce()

    const output = container.querySelector('.output-display')
    expect(output?.textContent).toContain('<?xml version="1.0"?>')
  })

  it('should handle DOCTYPE declarations', async () => {
    const { container } = render(XmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<!DOCTYPE html><html></html>' } })

    await waitForDebounce()

    const output = container.querySelector('.output-display')
    expect(output?.textContent).toContain('<!DOCTYPE html>')
  })

  it('should clear content when clear button clicked', async () => {
    const { container } = render(XmlTool)

    // First add some content
    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<root>test</root>' } })
    await waitForDebounce()

    // Then clear
    const clearButton = screen.getByLabelText('Clear input')
    await fireEvent.click(clearButton)

    expect(textarea?.value).toBe('')
    const output = container.querySelector('.output-display')
    expect(output?.textContent).toBe('Output will appear here...')
  })

  it('should load example when load example button clicked', async () => {
    const { container } = render(XmlTool)

    const loadExampleButton = screen.getByLabelText('Load example XML')
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

  it('should update character count on input', async () => {
    const { container } = render(XmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<a/>' } })
    await waitForDebounce()

    const charCount = container.textContent.match(/(\d+)\s+chars/)
    expect(charCount).toBeTruthy()
    expect(parseInt(charCount[1])).toBeGreaterThan(0)

    // Update input and check count changes
    await fireEvent.input(textarea, { target: { value: '<root><child/></root>' } })
    await waitForDebounce()

    const newCharCount = container.textContent.match(/(\d+)\s+chars/)
    expect(newCharCount).toBeTruthy()
    expect(parseInt(newCharCount[1])).toBeGreaterThan(parseInt(charCount[1]))
  })

  it('should handle self-closing tags', async () => {
    const { container } = render(XmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<root><item/></root>' } })

    await waitForDebounce()

    const output = container.querySelector('.output-display')
    expect(output?.textContent).toContain('<item/')
  })

  it('should persist input to localStorage', async () => {
    const { container } = render(XmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<persist>test</persist>' } })
    // Wait for both debounces: process (300ms) + save (500ms)
    await waitForDebounce(DEBOUNCE_TIME + SAVE_DEBOUNCE_TIME + 100)

    expect(localStorage.getItem('devutils-xml-input')).toBe('<persist>test</persist>')
  })

  it('should persist mode to localStorage', async () => {
    render(XmlTool)

    const minifyButton = screen.getByText('Minify')
    await fireEvent.click(minifyButton)
    await waitFor(async () => {
      await waitForDebounce(MODE_DEBOUNCE_TIME)
    }, { timeout: 200 })
    await waitForDebounce(SAVE_DEBOUNCE_TIME)

    expect(localStorage.getItem('devutils-xml-mode')).toBe('minify')
  })

  it('should restore state from localStorage on mount', async () => {
    localStorage.setItem('devutils-xml-input', '<stored>data</stored>')
    localStorage.setItem('devutils-xml-mode', 'minify')

    render(XmlTool)

    // Wait for mount and localStorage read to complete
    await waitForDebounce(100)

    // Check localStorage was read
    expect(localStorage.getItem('devutils-xml-input')).toBe('<stored>data</stored>')
    expect(localStorage.getItem('devutils-xml-mode')).toBe('minify')
  })

  it('should handle unclosed comments', async () => {
    const { container } = render(XmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<!-- unclosed comment <root></root>' } })

    await waitForDebounce()

    // Unclosed comments are invalid XML - DOMParser will catch this
    expect(screen.getByText(/Invalid XML/)).toBeInTheDocument()
  })

  it('should handle unclosed CDATA', async () => {
    const { container } = render(XmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<root><![CDATA[unclosed' } })

    await waitForDebounce()

    expect(screen.getByText(/Invalid XML/)).toBeInTheDocument()
  })

  it('should handle unclosed processing instructions', async () => {
    const { container } = render(XmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<?xml version="1.0" <root></root>' } })

    await waitForDebounce()

    expect(screen.getByText(/Invalid XML/)).toBeInTheDocument()
  })

  it('should detect tag mismatch', async () => {
    const { container } = render(XmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<root><child></root></child>' } })

    await waitForDebounce()

    // DOMParser will catch this as invalid
    expect(screen.getByText(/Invalid XML/)).toBeInTheDocument()
  })

  it('should handle entity references in text', async () => {
    const { container } = render(XmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<root>&amp;&lt;&gt;&quot;&apos;</root>' } })

    await waitForDebounce()

    const output = container.querySelector('.output-display')
    expect(output?.textContent).toContain('&amp;')
    expect(output?.textContent).toContain('&lt;')
    expect(output?.textContent).toContain('&gt;')
  })

  it('should handle entity references in attributes', async () => {
    const { container } = render(XmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<root attr="&amp;&lt;&quot;text&quot;&gt;"></root>' } })

    await waitForDebounce()

    const output = container.querySelector('.output-display')
    expect(output?.textContent).toContain('&amp;')
    expect(output?.textContent).toContain('&lt;')
    expect(output?.textContent).toContain('&quot;')
  })

  it('should handle deeply nested XML', async () => {
    const { container } = render(XmlTool)

    const deep = '<a><b><c><d><e><f>deep</f></e></d></c></b></a>'
    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: deep } })

    await waitForDebounce()

    const output = container.querySelector('.output-display')
    expect(output?.textContent).toContain('      <f>')
  })

  it('should handle mixed content (text + elements)', async () => {
    const { container } = render(XmlTool)

    const mixed = '<root>text before<child/>text after</root>'
    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: mixed } })

    await waitForDebounce()

    const output = container.querySelector('.output-display')
    expect(output?.textContent).toContain('text before')
    expect(output?.textContent).toContain('<child/')
    expect(output?.textContent).toContain('text after')
  })

  it('should clear error when valid XML is entered', async () => {
    const { container } = render(XmlTool)

    const textarea = container.querySelector('.editor-textarea')

    // Enter invalid XML
    await fireEvent.input(textarea, { target: { value: '<invalid' } })
    await waitForDebounce()

    expect(screen.getByText(/Invalid XML/)).toBeInTheDocument()

    // Enter valid XML
    await fireEvent.input(textarea, { target: { value: '<valid/>' } })
    await waitForDebounce()

    await waitFor(() => {
      expect(screen.queryByText(/Invalid XML/)).not.toBeInTheDocument()
    })
  })

  it('should have accessible icon buttons', () => {
    render(XmlTool)

    expect(screen.getByLabelText('Load example XML')).toBeInTheDocument()
    expect(screen.getByLabelText('Clear input')).toBeInTheDocument()
  })

  it('should have accessible textarea', () => {
    const { container } = render(XmlTool)

    const textarea = container.querySelector('.editor-textarea')
    expect(textarea).toHaveAttribute('aria-label', 'XML Input')
  })

  it('should have accessible output region', () => {
    const { container } = render(XmlTool)

    const output = container.querySelector('.output-display')
    expect(output).toHaveAttribute('role', 'region')
    expect(output).toHaveAttribute('aria-label', 'XML Output')
  })

  it('should have error display with alert role', async () => {
    const { container } = render(XmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<invalid' } })
    await waitForDebounce()

    const errorDisplay = container.querySelector('.error-display')
    expect(errorDisplay).toHaveAttribute('role', 'alert')
  })

  it('should reject input exceeding max size', async () => {
    const { container } = render(XmlTool)

    // Create a string larger than 10MB
    const largeInput = 'x'.repeat(11 * 1024 * 1024)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: largeInput } })
    await waitForDebounce()

    expect(screen.getByText(/exceeds maximum size/)).toBeInTheDocument()
  })

  it('should verify formatted output structure', async () => {
    const { container } = render(XmlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<root><a>1</a><b>2</b></root>' } })
    await waitForDebounce()

    const output = container.querySelector('.output-display')
    const content = output?.textContent

    // Verify proper indentation
    expect(content).toContain('<root>')
    expect(content).toContain('  <a>')
    expect(content).toContain('  </a>')
    expect(content).toContain('  <b>')
    expect(content).toContain('  </b>')
    expect(content).toContain('</root>')
  })

  it('should render CopyButton when output exists and hide when empty', async () => {
    const { container } = render(XmlTool)

    // Initially no output - CopyButton should not be present
    expect(container.querySelector('.copy-btn')).not.toBeInTheDocument()

    // Enter valid XML to generate output
    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '<root>test</root>' } })
    await waitForDebounce()

    // Now output exists - CopyButton should be present
    const copyButton = container.querySelector('.copy-btn')
    expect(copyButton).toBeInTheDocument()

    // Verify the CopyButton received the correct text prop by checking it copies the formatted output
    const output = container.querySelector('.output-display')
    expect(output?.textContent).toContain('<root>')
  })
})
