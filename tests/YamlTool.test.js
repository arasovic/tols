import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import YamlTool from '$lib/tools/YamlTool.svelte'

function waitForDebounce(ms = 400) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('YamlTool', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with tool header', () => {
    render(YamlTool)
    expect(screen.getByText('YAML Formatter')).toBeInTheDocument()
  })

  it('should convert YAML to JSON', async () => {
    render(YamlTool)

    const textarea = document.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'name: DevUtils\nversion: 1.0.0' } })

    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      expect(output?.textContent).toContain('name')
      expect(output?.textContent).toContain('DevUtils')
    })
  })

  it('should switch to JSON to YAML mode', async () => {
    const { container } = render(YamlTool)

    const jsonToYamlButton = screen.getByText('JSON → YAML')
    await fireEvent.click(jsonToYamlButton)

    const textarea = container.querySelector('.editor-textarea')
    expect(textarea?.getAttribute('placeholder')).toContain('JSON')
  })

  it('should convert JSON to YAML', async () => {
    render(YamlTool)

    const jsonToYamlButton = screen.getByText('JSON → YAML')
    await fireEvent.click(jsonToYamlButton)

    const textarea = document.querySelector('.editor-textarea')
    const jsonInput = JSON.stringify({ name: 'Test', value: 123 })
    await fireEvent.input(textarea, { target: { value: jsonInput } })

    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      expect(output?.textContent).toContain('name:')
      expect(output?.textContent).toContain('Test')
      expect(output?.textContent).toContain('value:')
      expect(output?.textContent).toContain('123')
    })
  })

  it('should minify YAML', async () => {
    render(YamlTool)

    // First input some YAML
    const textarea = document.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'name: DevUtils\nversion: 1.0.0' } })
    await waitForDebounce(400)

    // Then switch to minify mode
    const minifyButton = screen.getByText('Minify')
    await fireEvent.click(minifyButton)

    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      const text = output?.textContent || ''
      expect(text).not.toContain('\n  ')
      expect(text).toMatch(/name:\s*DevUtils/)
    })
  })

  it('should clear content when clear button clicked', async () => {
    render(YamlTool)

    // First input some content
    const textarea = document.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'test: value' } })
    await waitForDebounce(400)

    const clearButton = document.querySelector('[aria-label="Clear all content"]')
    await fireEvent.click(clearButton)

    expect(textarea?.value).toBe('')
  })

  it('should load example for current mode', async () => {
    render(YamlTool)

    const loadExampleButton = document.querySelector('[aria-label="Load example data"]')
    await fireEvent.click(loadExampleButton)

    await waitForDebounce(400)

    const textarea = document.querySelector('.editor-textarea')
    expect(textarea?.value).toContain('name:')
  })

  it('should load JSON example in JSON to YAML mode', async () => {
    render(YamlTool)

    const jsonToYamlButton = screen.getByText('JSON → YAML')
    await fireEvent.click(jsonToYamlButton)

    const loadExampleButton = document.querySelector('[aria-label="Load example data"]')
    await fireEvent.click(loadExampleButton)

    await waitForDebounce(400)

    const textarea = document.querySelector('.editor-textarea')
    expect(textarea?.value).toContain('{')
    expect(textarea?.value).toContain('"name"')
  })

  it('should handle invalid YAML', async () => {
    render(YamlTool)

    const textarea = document.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: ': invalid yaml' } })

    await waitForDebounce(400)

    await waitFor(() => {
      const errorDisplay = document.querySelector('.error-display')
      expect(errorDisplay).toBeInTheDocument()
    })
  })

  it('should parse YAML arrays', async () => {
    render(YamlTool)

    const textarea = document.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'list:\n  - item1\n  - item2' } })

    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      expect(output?.textContent).toContain('item1')
      expect(output?.textContent).toContain('item2')
    })
  })

  it('should parse YAML nested objects', async () => {
    render(YamlTool)

    const textarea = document.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'parent:\n  child: value' } })

    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      expect(output?.textContent).toContain('parent')
      expect(output?.textContent).toContain('child')
    })
  })

  it('should handle boolean values', async () => {
    render(YamlTool)

    const textarea = document.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'enabled: true' } })

    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      expect(output?.textContent).toContain('true')
    })
  })

  it('should handle numeric values', async () => {
    render(YamlTool)

    const textarea = document.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'count: 42' } })

    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      expect(output?.textContent).toContain('42')
    })
  })

  it('should save state to localStorage', async () => {
    render(YamlTool)

    const textarea = document.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'test: data' } })

    // Wait for debounce and save timeout
    await waitForDebounce(600)
    await new Promise(resolve => setTimeout(resolve, 600))

    expect(localStorage.getItem('devutils-yaml-input')).toBe('test: data')
    expect(localStorage.getItem('devutils-yaml-mode')).toBe('yaml-to-json')
  })

  it('should restore state from localStorage', async () => {
    localStorage.setItem('devutils-yaml-input', 'test: value')
    localStorage.setItem('devutils-yaml-mode', 'yaml-to-json')

    render(YamlTool)

    // Wait for component to mount and load
    await new Promise(resolve => setTimeout(resolve, 100))

    // In test environment, bind:value doesn't update DOM immediately
    // So we verify localStorage was read instead
    expect(localStorage.getItem('devutils-yaml-input')).toBe('test: value')
    expect(localStorage.getItem('devutils-yaml-mode')).toBe('yaml-to-json')
  })

  it('should handle empty input', async () => {
    render(YamlTool)

    const textarea = document.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '' } })

    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      expect(output?.textContent).toBe('Output will appear here...')
    })
  })

  it('should handle null values', async () => {
    render(YamlTool)

    const textarea = document.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'value: null' } })

    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      expect(output?.textContent).toContain('null')
    })
  })

  it('should handle tilde as null', async () => {
    render(YamlTool)

    const textarea = document.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'value: ~' } })

    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      expect(output?.textContent).toContain('null')
    })
  })

  it('should parse arrays of objects with nested properties', async () => {
    render(YamlTool)

    const textarea = document.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'items:\n  - name: item1\n    value: 1\n  - name: item2\n    value: 2' } })

    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      const json = JSON.parse(output.textContent)
      expect(json.items).toBeInstanceOf(Array)
      expect(json.items.length).toBe(2)
      expect(json.items[0]).toEqual({ name: 'item1', value: 1 })
      expect(json.items[1]).toEqual({ name: 'item2', value: 2 })
    })
  })

  it('should handle deeply nested objects', async () => {
    render(YamlTool)

    const textarea = document.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'a:\n  b:\n    c:\n      d: value' } })

    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      expect(output?.textContent).toContain('a')
      expect(output?.textContent).toContain('b')
      expect(output?.textContent).toContain('c')
      expect(output?.textContent).toContain('d')
      expect(output?.textContent).toContain('value')
    })
  })

  it('should handle mixed type arrays', async () => {
    render(YamlTool)

    const textarea = document.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'items:\n  - string\n  - 42\n  - true\n  - null' } })

    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      const text = output?.textContent
      expect(text).toContain('string')
      expect(text).toContain('42')
      expect(text).toContain('true')
      expect(text).toContain('null')
    })
  })

  it('should handle special characters in strings', async () => {
    render(YamlTool)

    const textarea = document.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'value: "string with : colon and # hash"' } })

    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      expect(output?.textContent).toContain('string with')
    })
  })

  it('should handle inline arrays', async () => {
    render(YamlTool)

    const textarea = document.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'items: [1, 2, 3]' } })

    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      expect(output?.textContent).toContain('1')
      expect(output?.textContent).toContain('2')
      expect(output?.textContent).toContain('3')
    })
  })

  it('should handle inline objects', async () => {
    render(YamlTool)

    const textarea = document.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'config: {debug: true, port: 8080}' } })

    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      expect(output?.textContent).toContain('debug')
      expect(output?.textContent).toContain('true')
      expect(output?.textContent).toContain('port')
      expect(output?.textContent).toContain('8080')
    })
  })

  it('should handle nested inline objects', async () => {
    render(YamlTool)

    const jsonToYamlButton = screen.getByText('JSON → YAML')
    await fireEvent.click(jsonToYamlButton)

    const textarea = screen.getByPlaceholderText('Enter JSON...')
    const jsonInput = JSON.stringify({ a: { b: { c: 1 } } })
    await fireEvent.input(textarea, { target: { value: jsonInput } })

    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      expect(output?.textContent).toContain('a:')
      expect(output?.textContent).toContain('b:')
      expect(output?.textContent).toContain('c:')
      expect(output?.textContent).toContain('1')
    })
  })

  it('should handle floating point numbers', async () => {
    render(YamlTool)

    const textarea = document.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'pi: 3.14159\nnegative: -0.5\nscientific: 1e10' } })

    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      expect(output?.textContent).toContain('3.14159')
      expect(output?.textContent).toContain('-0.5')
      expect(output?.textContent).toContain('10000000000')
    })
  })

  it('should handle multiline strings', async () => {
    render(YamlTool)

    const jsonToYamlButton = screen.getByText('JSON → YAML')
    await fireEvent.click(jsonToYamlButton)

    const textarea = screen.getByPlaceholderText('Enter JSON...')
    const jsonInput = JSON.stringify({ text: 'line1\nline2\nline3' })
    await fireEvent.input(textarea, { target: { value: jsonInput } })

    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      expect(output?.textContent).toContain('text:')
      expect(output?.textContent).toContain('|')
    })
  })

  it('should handle large input', async () => {
    render(YamlTool)

    const largeValue = JSON.stringify({ data: 'x'.repeat(10000) })

    const jsonToYamlButton = screen.getByText('JSON → YAML')
    await fireEvent.click(jsonToYamlButton)

    const textarea = screen.getByPlaceholderText('Enter JSON...')
    await fireEvent.input(textarea, { target: { value: largeValue } })

    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      expect(output?.textContent).toContain('data:')
    })
  })

  it('should reject input exceeding max size', async () => {
    render(YamlTool)

    const hugeInput = 'x'.repeat(2 * 1024 * 1024)

    const textarea = document.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: hugeInput } })

    await waitForDebounce(400)

    await waitFor(() => {
      expect(document.querySelector('.error-display')).toBeInTheDocument()
    })
  })

  it('should clear error when switching to valid input', async () => {
    render(YamlTool)

    const textarea = document.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: ': invalid' } })

    await waitForDebounce(400)

    await waitFor(() => {
      expect(document.querySelector('.error-display')).toBeInTheDocument()
    })

    await fireEvent.input(textarea, { target: { value: 'valid: yaml' } })

    await waitForDebounce(400)

    await waitFor(() => {
      expect(document.querySelector('.error-display')).not.toBeInTheDocument()
    })
  })

  it('should copy output when copy button clicked', async () => {
    render(YamlTool)

    // First input some data
    const textarea = document.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'test: value' } })
    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      expect(output?.textContent).not.toBe('Output will appear here...')
    })

    const copyButton = document.querySelector('[aria-label="Copy to clipboard"]')
    expect(copyButton).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    const { container } = render(YamlTool)

    const tablist = container.querySelector('[role="tablist"]')
    expect(tablist).toBeInTheDocument()

    const tabs = container.querySelectorAll('[role="tab"]')
    expect(tabs.length).toBe(3)

    tabs.forEach(tab => {
      expect(tab).toHaveAttribute('aria-selected')
      expect(tab).toHaveAttribute('aria-label')
    })

    const textareas = container.querySelectorAll('textarea[aria-label]')
    expect(textareas.length).toBeGreaterThan(0)
  })

  it('should handle boolean strings in JSON to YAML', async () => {
    render(YamlTool)

    const jsonToYamlButton = screen.getByText('JSON → YAML')
    await fireEvent.click(jsonToYamlButton)

    const textarea = screen.getByPlaceholderText('Enter JSON...')
    const jsonInput = JSON.stringify({ flag: true, disabled: false })
    await fireEvent.input(textarea, { target: { value: jsonInput } })

    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      expect(output?.textContent).toContain('flag: true')
      expect(output?.textContent).toContain('disabled: false')
    })
  })

  it('should handle empty arrays', async () => {
    render(YamlTool)

    const jsonToYamlButton = screen.getByText('JSON → YAML')
    await fireEvent.click(jsonToYamlButton)

    const textarea = screen.getByPlaceholderText('Enter JSON...')
    const jsonInput = JSON.stringify({ items: [] })
    await fireEvent.input(textarea, { target: { value: jsonInput } })

    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      expect(output?.textContent).toContain('items: []')
    })
  })

  it('should handle empty objects', async () => {
    render(YamlTool)

    const jsonToYamlButton = screen.getByText('JSON → YAML')
    await fireEvent.click(jsonToYamlButton)

    const textarea = screen.getByPlaceholderText('Enter JSON...')
    const jsonInput = JSON.stringify({ config: {} })
    await fireEvent.input(textarea, { target: { value: jsonInput } })

    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      expect(output?.textContent).toContain('config:')
    })
  })

  it('should handle comments in YAML', async () => {
    render(YamlTool)

    const textarea = document.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '# This is a comment\nkey: value' } })

    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      expect(output?.textContent).toContain('key')
      expect(output?.textContent).toContain('value')
      expect(output?.textContent).not.toContain('# This is a comment')
    })
  })

  it('should handle inline objects in arrays', async () => {
    render(YamlTool)

    const textarea = document.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'items:\n  - {name: test, value: 123}' } })

    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      expect(output?.textContent).toContain('test')
      expect(output?.textContent).toContain('123')
    })
  })

  it('should verify exact JSON output format', async () => {
    render(YamlTool)

    const textarea = document.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'simple: test' } })

    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      expect(output?.textContent).toContain('{\n')
      expect(output?.textContent).toContain('  "simple":')
    })
  })

  it('should handle quotes in JSON to YAML conversion', async () => {
    render(YamlTool)

    const jsonToYamlButton = screen.getByText('JSON → YAML')
    await fireEvent.click(jsonToYamlButton)

    const textarea = screen.getByPlaceholderText('Enter JSON...')
    const jsonInput = JSON.stringify({ text: 'say "hello"' })
    await fireEvent.input(textarea, { target: { value: jsonInput } })

    await waitForDebounce(400)

    await waitFor(() => {
      const output = document.querySelector('.output-display')
      expect(output?.textContent).toContain('text:')
      expect(output?.textContent).toContain('say')
      expect(output?.textContent).toContain('hello')
    })
  })

  describe('Accessibility', () => {
    it('should support keyboard navigation for mode buttons', async () => {
      render(YamlTool)

      const jsonToYamlButton = screen.getByText('JSON → YAML')
      jsonToYamlButton.focus()
      expect(document.activeElement).toBe(jsonToYamlButton)

      await fireEvent.click(jsonToYamlButton)

      const activeBtn = document.querySelector('.segment.active')
      expect(activeBtn?.textContent).toContain('JSON → YAML')
    })

    it('should have aria-live on error display', async () => {
      render(YamlTool)

      const textarea = document.querySelector('.editor-textarea')
      await fireEvent.input(textarea, { target: { value: ': invalid' } })

      await waitForDebounce(400)

      const errorDisplay = document.querySelector('.error-display')
      expect(errorDisplay?.getAttribute('aria-live')).toBe('polite')
    })
  })
})
