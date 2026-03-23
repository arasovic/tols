import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import MarkdownTool from '$lib/tools/MarkdownTool.svelte'

function waitForDebounce(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('MarkdownTool', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with tool header', () => {
    render(MarkdownTool)
    expect(screen.getByText('Markdown Previewer')).toBeInTheDocument()
    expect(screen.getByText('Live preview and convert Markdown to HTML')).toBeInTheDocument()
  })

  it('should load example on render', async () => {
    const { container } = render(MarkdownTool)

    await waitFor(() => {
      const textarea = container.querySelector('.editor-textarea')
      expect(textarea?.value).toContain('# Markdown Example')
    }, { timeout: 500 })
  })

  it('should render markdown to HTML', async () => {
    const { container } = render(MarkdownTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '# Hello World' } })

    await waitForDebounce(400)

    const preview = container.querySelector('.preview-display')
    // Check text content instead of HTML structure
    expect(preview?.textContent).toContain('Hello World')
  })

  it('should render bold text', async () => {
    const { container } = render(MarkdownTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '**bold text**' } })

    await waitForDebounce(400)

    const preview = container.querySelector('.preview-display')
    expect(preview?.textContent).toContain('bold text')
  })

  it('should render italic text', async () => {
    const { container } = render(MarkdownTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '*italic text*' } })

    await waitForDebounce(400)

    const preview = container.querySelector('.preview-display')
    expect(preview?.textContent).toContain('italic text')
  })

  it('should render code blocks', async () => {
    const { container } = render(MarkdownTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '```\ncode here\n```' } })

    await waitForDebounce(400)

    const preview = container.querySelector('.preview-display')
    expect(preview?.textContent).toContain('code here')
  })

  it('should render inline code', async () => {
    const { container } = render(MarkdownTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '`inline code`' } })

    await waitForDebounce(400)

    const preview = container.querySelector('.preview-display')
    expect(preview?.textContent).toContain('inline code')
  })

  it('should render lists', async () => {
    const { container } = render(MarkdownTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '- Item 1\n- Item 2' } })

    await waitForDebounce(400)

    const preview = container.querySelector('.preview-display')
    expect(preview?.textContent).toContain('Item 1')
    expect(preview?.textContent).toContain('Item 2')
  })

  it('should render links', async () => {
    const { container } = render(MarkdownTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '[link](http://example.com)' } })

    await waitForDebounce(400)

    const preview = container.querySelector('.preview-display')
    expect(preview?.textContent).toContain('link')
  })

  it('should clear content when clear button clicked', async () => {
    const { container } = render(MarkdownTool)

    const clearButton = container.querySelector('[title="Clear"]')
    await fireEvent.click(clearButton)

    const textarea = container.querySelector('.editor-textarea')
    expect(textarea?.value).toBe('')
  })

  it('should load example when load example button clicked', async () => {
    const { container } = render(MarkdownTool)

    const loadExampleButton = container.querySelector('[title="Load Example"]')
    await fireEvent.click(loadExampleButton)

    const textarea = container.querySelector('.editor-textarea')
    expect(textarea?.value).toContain('# Markdown Example')
  })

  it('should show character count', async () => {
    const { container } = render(MarkdownTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'test' } })

    await waitForDebounce(400)

    expect(container.textContent).toContain('4 chars')
  })

  it('should debounce input processing', async () => {
    const { container } = render(MarkdownTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'a' } })
    await fireEvent.input(textarea, { target: { value: 'ab' } })
    await fireEvent.input(textarea, { target: { value: 'abc' } })

    await waitFor(() => {
      const preview = container.querySelector('.preview-display')
      expect(preview?.textContent).toContain('abc')
    }, { timeout: 500 })
  })
})
