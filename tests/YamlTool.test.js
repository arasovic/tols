import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import YamlTool from '$lib/tools/YamlTool.svelte'

function waitForDebounce(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('YamlTool', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with tool header', () => {
    render(YamlTool)
    expect(screen.getByText('YAML Formatter')).toBeInTheDocument()
  })

  it('should convert YAML to JSON', async () => {
    const { container } = render(YamlTool)

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      expect(output?.textContent).toContain('{')
    }, { timeout: 500 })
  })

  it('should switch to JSON to YAML mode', async () => {
    const { container } = render(YamlTool)

    const jsonToYamlButton = screen.getByText('JSON → YAML')
    await fireEvent.click(jsonToYamlButton)

    const textarea = container.querySelector('.editor-textarea')
    expect(textarea?.getAttribute('placeholder')).toContain('JSON')
  })

  it('should minify YAML', async () => {
    const { container } = render(YamlTool)

    const minifyButton = screen.getByText('Minify')
    await fireEvent.click(minifyButton)

    const output = container.querySelector('.output-display')
    expect(output).toBeInTheDocument()
  })

  it('should clear content when clear button clicked', async () => {
    const { container } = render(YamlTool)

    const clearButton = container.querySelector('[title="Clear"]')
    await fireEvent.click(clearButton)

    const textarea = container.querySelector('.editor-textarea')
    expect(textarea?.value).toBe('')
  })

  it('should load example for current mode', async () => {
    const { container } = render(YamlTool)

    const loadExampleButton = container.querySelector('[title="Load Example"]')
    await fireEvent.click(loadExampleButton)

    const textarea = container.querySelector('.editor-textarea')
    expect(textarea?.value).toContain('name:')
  })

  it('should handle invalid YAML', async () => {
    const { container } = render(YamlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'invalid: yaml: : :' } })

    await waitForDebounce(400)

    expect(screen.getByText(/Error/)).toBeInTheDocument()
  })

  it('should parse YAML arrays', async () => {
    const { container } = render(YamlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'list:\n  - item1\n  - item2' } })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    expect(output?.textContent).toContain('item1')
    expect(output?.textContent).toContain('item2')
  })

  it('should parse YAML nested objects', async () => {
    const { container } = render(YamlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'parent:\n  child: value' } })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    expect(output?.textContent).toContain('parent')
    expect(output?.textContent).toContain('child')
  })

  it('should handle boolean values', async () => {
    const { container } = render(YamlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'enabled: true' } })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    expect(output?.textContent).toContain('true')
  })

  it('should handle numeric values', async () => {
    const { container } = render(YamlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'count: 42' } })

    await waitForDebounce(400)

    const output = container.querySelector('.output-display')
    expect(output?.textContent).toContain('42')
  })

  it('should save state to localStorage', async () => {
    render(YamlTool)

    await waitFor(() => {
      expect(localStorage.getItem('devutils-yaml-input')).toBeTruthy()
    }, { timeout: 700 })
  })
})
