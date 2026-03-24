import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/svelte'
import '@testing-library/jest-dom'
import MarkdownTool from '$lib/tools/MarkdownTool.svelte'

describe('MarkdownTool', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllTimers()
  })

  afterEach(() => {
    cleanup()
  })

  it('should initialize with tool header', () => {
    render(MarkdownTool)
    expect(screen.getByText('Markdown Previewer')).toBeInTheDocument()
    expect(screen.getByText('Live preview and convert Markdown to HTML')).toBeInTheDocument()
  })

  it('should load example on render', async () => {
    const { container } = render(MarkdownTool)

    const loadExampleButton = container.querySelector('[title="Load Example"]')
    await fireEvent.click(loadExampleButton)

    const textarea = container.querySelector('.editor-textarea')
    expect(textarea?.value).toContain('# Markdown Example')
  })

  it('should render markdown to HTML', async () => {
    const { container } = render(MarkdownTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '# Hello World' } })

    await waitFor(() => {
      const preview = container.querySelector('.preview-display')
      expect(preview?.textContent).toContain('Hello World')
    }, { timeout: 500 })
  })

  it('should render bold text', async () => {
    const { container } = render(MarkdownTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '**bold text**' } })

    await waitFor(() => {
      const preview = container.querySelector('.preview-display')
      expect(preview?.textContent).toContain('bold text')
    }, { timeout: 500 })
  })

  it('should render italic text', async () => {
    const { container } = render(MarkdownTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '*italic text*' } })

    await waitFor(() => {
      const preview = container.querySelector('.preview-display')
      expect(preview?.textContent).toContain('italic text')
    }, { timeout: 500 })
  })

  it('should render code blocks', async () => {
    const { container } = render(MarkdownTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '```\ncode here\n```' } })

    await waitFor(() => {
      const preview = container.querySelector('.preview-display')
      expect(preview?.textContent).toContain('code here')
    }, { timeout: 500 })
  })

  it('should render inline code', async () => {
    const { container } = render(MarkdownTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '`inline code`' } })

    await waitFor(() => {
      const preview = container.querySelector('.preview-display')
      expect(preview?.textContent).toContain('inline code')
    }, { timeout: 500 })
  })

  it('should render lists', async () => {
    const { container } = render(MarkdownTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '- Item 1\n- Item 2' } })

    await waitFor(() => {
      const preview = container.querySelector('.preview-display')
      expect(preview?.textContent).toContain('Item 1')
      expect(preview?.textContent).toContain('Item 2')
    }, { timeout: 500 })
  })

  it('should render links', async () => {
    const { container } = render(MarkdownTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: '[link](http://example.com)' } })

    await waitFor(() => {
      const preview = container.querySelector('.preview-display')
      expect(preview?.textContent).toContain('link')
    }, { timeout: 500 })
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

    await waitFor(() => {
      expect(container.textContent).toContain('4 chars')
    }, { timeout: 500 })
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

  describe('XSS Prevention', () => {
    it('should block javascript: URLs in links', async () => {
      const { container } = render(MarkdownTool)

      const textarea = container.querySelector('.editor-textarea')
      await fireEvent.input(textarea, { target: { value: '[click](javascript:alert("xss"))' } })

      await waitFor(() => {
        const preview = container.querySelector('.preview-display')
        const link = preview?.querySelector('a')
        expect(link?.getAttribute('href')).toBe('#')
      }, { timeout: 500 })
    })

    it('should block javascript: URLs in images', async () => {
      const { container } = render(MarkdownTool)

      const textarea = container.querySelector('.editor-textarea')
      await fireEvent.input(textarea, { target: { value: '![alt](javascript:alert("xss"))' } })

      await waitFor(() => {
        const preview = container.querySelector('.preview-display')
        const img = preview?.querySelector('img')
        expect(img?.getAttribute('src')).toBe('#')
      }, { timeout: 500 })
    })

    it('should block data: URLs', async () => {
      const { container } = render(MarkdownTool)

      const textarea = container.querySelector('.editor-textarea')
      await fireEvent.input(textarea, { target: { value: '[link](data:text/html,<script>alert("xss")</script>)' } })

      await waitFor(() => {
        const preview = container.querySelector('.preview-display')
        const link = preview?.querySelector('a')
        expect(link?.getAttribute('href')).toBe('#')
      }, { timeout: 500 })
    })

    it('should allow safe http URLs', async () => {
      const { container } = render(MarkdownTool)

      const textarea = container.querySelector('.editor-textarea')
      await fireEvent.input(textarea, { target: { value: '[link](https://example.com)' } })

      await waitFor(() => {
        const preview = container.querySelector('.preview-display')
        const link = preview?.querySelector('a')
        expect(link?.getAttribute('href')).toBe('https://example.com')
      }, { timeout: 500 })
    })

    it('should allow mailto: URLs', async () => {
      const { container } = render(MarkdownTool)

      const textarea = container.querySelector('.editor-textarea')
      await fireEvent.input(textarea, { target: { value: '[email](mailto:test@example.com)' } })

      await waitFor(() => {
        const preview = container.querySelector('.preview-display')
        const link = preview?.querySelector('a')
        expect(link?.getAttribute('href')).toBe('mailto:test@example.com')
      }, { timeout: 500 })
    })

    it('should allow anchor and relative URLs', async () => {
      const { container } = render(MarkdownTool)

      const textarea = container.querySelector('.editor-textarea')
      await fireEvent.input(textarea, { target: { value: '[anchor](#section) [relative](/page)' } })

      await waitFor(() => {
        const preview = container.querySelector('.preview-display')
        const links = preview?.querySelectorAll('a')
        expect(links?.[0]?.getAttribute('href')).toBe('#section')
        expect(links?.[1]?.getAttribute('href')).toBe('/page')
      }, { timeout: 500 })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty input', async () => {
      const { container } = render(MarkdownTool)

      const textarea = container.querySelector('.editor-textarea')
      await fireEvent.input(textarea, { target: { value: '' } })

      await waitFor(() => {
        const preview = container.querySelector('.preview-display')
        expect(preview?.textContent).toContain('Preview will appear here...')
      }, { timeout: 500 })
    })

    it('should handle nested lists', async () => {
      const { container } = render(MarkdownTool)

      const textarea = container.querySelector('.editor-textarea')
      await fireEvent.input(textarea, { target: { value: '- Item 1\n- Item 2\n  - Nested 1\n  - Nested 2' } })

      await waitFor(() => {
        const preview = container.querySelector('.preview-display')
        expect(preview?.textContent).toContain('Nested 1')
        expect(preview?.textContent).toContain('Nested 2')
      }, { timeout: 500 })
    })

    it('should handle multi-line blockquotes', async () => {
      const { container } = render(MarkdownTool)

      const textarea = container.querySelector('.editor-textarea')
      await fireEvent.input(textarea, { target: { value: '> Line 1\n> Line 2\n> Line 3' } })

      await waitFor(() => {
        const preview = container.querySelector('.preview-display')
        const blockquote = preview?.querySelector('blockquote')
        expect(blockquote?.textContent).toContain('Line 1')
        expect(blockquote?.textContent).toContain('Line 2')
        expect(blockquote?.textContent).toContain('Line 3')
      }, { timeout: 500 })
    })

    it('should handle mixed inline formatting', async () => {
      const { container } = render(MarkdownTool)

      const textarea = container.querySelector('.editor-textarea')
      await fireEvent.input(textarea, { target: { value: '**bold *and italic***' } })

      await waitFor(() => {
        const preview = container.querySelector('.preview-display')
        expect(preview?.textContent).toContain('bold and italic')
      }, { timeout: 500 })
    })

    it('should handle long input', async () => {
      const { container } = render(MarkdownTool)

      const longText = Array(1000).fill('word').join(' ')
      const textarea = container.querySelector('.editor-textarea')
      await fireEvent.input(textarea, { target: { value: longText } })

      await waitFor(() => {
        const preview = container.querySelector('.preview-display')
        expect(preview?.textContent).toContain('word')
      }, { timeout: 500 })
    })

    it('should handle horizontal rules', async () => {
      const { container } = render(MarkdownTool)

      const textarea = container.querySelector('.editor-textarea')
      await fireEvent.input(textarea, { target: { value: '---' } })

      await waitFor(() => {
        const preview = container.querySelector('.preview-display')
        expect(preview?.innerHTML).toContain('<hr')
      }, { timeout: 500 })
    })

    it('should render strikethrough', async () => {
      const { container } = render(MarkdownTool)

      const textarea = container.querySelector('.editor-textarea')
      await fireEvent.input(textarea, { target: { value: '~~deleted~~' } })

      await waitFor(() => {
        const preview = container.querySelector('.preview-display')
        expect(preview?.innerHTML).toContain('<del>')
        expect(preview?.textContent).toContain('deleted')
      }, { timeout: 500 })
    })

    it('should render images', async () => {
      const { container } = render(MarkdownTool)

      const textarea = container.querySelector('.editor-textarea')
      await fireEvent.input(textarea, { target: { value: '![alt text](https://example.com/image.png)' } })

      await waitFor(() => {
        const preview = container.querySelector('.preview-display')
        const img = preview?.querySelector('img')
        expect(img).toBeTruthy()
        expect(img?.getAttribute('alt')).toBe('alt text')
      }, { timeout: 500 })
    })

    it('should handle list type switching', async () => {
      const { container } = render(MarkdownTool)

      const textarea = container.querySelector('.editor-textarea')
      await fireEvent.input(textarea, { target: { value: '- Item 1\n1. Item 2' } })

      await waitFor(() => {
        const preview = container.querySelector('.preview-display')
        expect(preview?.innerHTML).toContain('<ul>')
        expect(preview?.innerHTML).toContain('<ol>')
      }, { timeout: 500 })
    })

    it('should handle code block language hints', async () => {
      const { container } = render(MarkdownTool)

      const textarea = container.querySelector('.editor-textarea')
      await fireEvent.input(textarea, { target: { value: '```javascript\ncode\n```' } })

      await waitFor(() => {
        const preview = container.querySelector('.preview-display')
        expect(preview?.innerHTML).toContain('language-javascript')
      }, { timeout: 500 })
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label on textarea', () => {
      const { container } = render(MarkdownTool)
      const textarea = container.querySelector('.editor-textarea')
      expect(textarea?.getAttribute('aria-label')).toBe('Markdown input')
    })

    it('should have role and aria-label on preview', () => {
      const { container } = render(MarkdownTool)
      const preview = container.querySelector('.preview-display')
      expect(preview?.getAttribute('role')).toBe('region')
      expect(preview?.getAttribute('aria-label')).toBe('Preview')
      expect(preview?.getAttribute('aria-live')).toBe('polite')
    })
  })

  describe('localStorage', () => {
    it('should clear localStorage when clear button clicked', async () => {
      localStorage.setItem('devutils-markdown-input', 'test content')
      
      const { container } = render(MarkdownTool)
      
      const clearButton = container.querySelector('[title="Clear"]')
      await fireEvent.click(clearButton)

      expect(localStorage.getItem('devutils-markdown-input')).toBeNull()
    })

    it('should persist input to localStorage', async () => {
      const { container } = render(MarkdownTool)
      
      const textarea = container.querySelector('.editor-textarea')
      await fireEvent.input(textarea, { target: { value: 'persisted content' } })
      
      await waitFor(() => {
        expect(localStorage.getItem('devutils-markdown-input')).toBe('persisted content')
      }, { timeout: 1000 })
    })

    it('should load persisted input on mount', async () => {
      localStorage.setItem('devutils-markdown-input', 'saved content')
      
      const { container } = render(MarkdownTool)

      const loadExampleButton = container.querySelector('[title="Load Example"]')
      await fireEvent.click(loadExampleButton)

      const textarea = container.querySelector('.editor-textarea')
      await fireEvent.input(textarea, { target: { value: 'saved content' } })
      
      expect(textarea?.value).toBe('saved content')
    })
  })

  describe('Debouncing', () => {
    it('should process only once after multiple rapid inputs', async () => {
      const { container } = render(MarkdownTool)
      
      const textarea = container.querySelector('.editor-textarea')
      
      await fireEvent.input(textarea, { target: { value: 'a' } })
      await fireEvent.input(textarea, { target: { value: 'ab' } })
      await fireEvent.input(textarea, { target: { value: 'abc' } })
      await fireEvent.input(textarea, { target: { value: 'abcd' } })
      
      await waitFor(() => {
        const preview = container.querySelector('.preview-display')
        expect(preview?.textContent).toContain('abcd')
      }, { timeout: 1000 })
    })
  })

  describe('Error Handling', () => {
    it('should clear error when new input is processed', async () => {
      const { container } = render(MarkdownTool)
      
      const textarea = container.querySelector('.editor-textarea')
      await fireEvent.input(textarea, { target: { value: '# Test' } })
      
      await waitFor(() => {
        expect(container.textContent).not.toContain('Error parsing markdown')
      }, { timeout: 500 })
    })
  })
})
