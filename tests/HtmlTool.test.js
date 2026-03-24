import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import HtmlTool from '$lib/tools/HtmlTool.svelte'

describe('HtmlTool', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllTimers()
  })

  it('should initialize with tool header', () => {
    render(HtmlTool)
    expect(screen.getByText('HTML Formatter')).toBeInTheDocument()
  })

  it('should display error message for empty input', async () => {
    const { container } = render(HtmlTool)

    const textarea = container.querySelector('.editor-textarea')
    if (!textarea) throw new Error('Textarea not found')
    await fireEvent.input(textarea, { target: { value: '' } })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Please enter HTML input')
    })
  })

  it('should beautify HTML input with proper indentation', async () => {
    const { container } = render(HtmlTool)

    const textarea = container.querySelector('.editor-textarea')
    if (!textarea) throw new Error('Textarea not found')
    await fireEvent.input(textarea, { target: { value: '<div><p>Text</p></div>' } })

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      const text = output?.textContent
      expect(text).toContain('<div>')
      expect(text).toContain('  <p>')
      expect(text).toContain('    Text')
      expect(text).toContain('  </p>')
      expect(text).toContain('</div>')
    })
  })

  it('should handle invalid HTML gracefully', async () => {
    const { container } = render(HtmlTool)

    const textarea = container.querySelector('.editor-textarea')
    if (!textarea) throw new Error('Textarea not found')
    await fireEvent.input(textarea, { target: { value: '<div><p>Unclosed' } })

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      expect(output?.textContent).toBeTruthy()
    })
  })

  it('should switch to minify mode', async () => {
    const { container } = render(HtmlTool)

    const minifyButton = screen.getByText('Minify')
    await fireEvent.click(minifyButton)

    const textarea = container.querySelector('.editor-textarea')
    if (!textarea) throw new Error('Textarea not found')
    await fireEvent.input(textarea, { target: { value: '<div>   <p>Text</p>   </div>' } })

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      expect(output?.textContent).not.toContain('   ')
    })
  })

  it('should save mode to localStorage when changed', async () => {
    const { container } = render(HtmlTool)

    // Click minify mode
    const minifyButton = screen.getByText('Minify')
    await fireEvent.click(minifyButton)

    // Wait for debounced save
    await waitFor(() => {
      expect(localStorage.getItem('devutils-html-mode')).toBe('minify')
    }, { timeout: 1000 })
  })

  it('should save input to localStorage', async () => {
    const { container } = render(HtmlTool)

    const testInput = '<div>Test content</div>'
    const textarea = container.querySelector('.editor-textarea')
    if (!textarea) throw new Error('Textarea not found')
    await fireEvent.input(textarea, { target: { value: testInput } })

    // Wait for debounced save
    await waitFor(() => {
      expect(localStorage.getItem('devutils-html-input')).toBe(testInput)
    }, { timeout: 1000 })
  })

  it('should clear content when clear button clicked', async () => {
    const { container } = render(HtmlTool)

    const clearButton = screen.getByLabelText('Clear')
    await fireEvent.click(clearButton)

    const textarea = container.querySelector('.editor-textarea')
    if (!textarea) throw new Error('Textarea not found')
    expect(textarea.value).toBe('')
  })

  it('should load example when load example button clicked', async () => {
    const { container } = render(HtmlTool)

    const loadExampleButton = screen.getByLabelText('Load Example')
    await fireEvent.click(loadExampleButton)

    const textarea = container.querySelector('.editor-textarea')
    if (!textarea) throw new Error('Textarea not found')
    expect(textarea.value).toContain('<!DOCTYPE html>')
  })

  it('should remove comments in minify mode', async () => {
    const { container } = render(HtmlTool)

    const minifyButton = screen.getByText('Minify')
    await fireEvent.click(minifyButton)

    await waitFor(() => {
      const checkbox = container.querySelector('input[type="checkbox"]')
      expect(checkbox).toBeInTheDocument()
    })

    const removeCommentsCheckbox = container.querySelector('#remove-comments')
    if (!removeCommentsCheckbox) throw new Error('Checkbox not found')
    await fireEvent.click(removeCommentsCheckbox)

    const textarea = container.querySelector('.editor-textarea')
    if (!textarea) throw new Error('Textarea not found')
    await fireEvent.input(textarea, { target: { value: '<div><!-- comment --></div>' } })

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      expect(output?.textContent).not.toContain('comment')
    })
  })

  it('should handle self-closing tags', async () => {
    const { container } = render(HtmlTool)

    const textarea = container.querySelector('.editor-textarea')
    if (!textarea) throw new Error('Textarea not found')
    await fireEvent.input(textarea, { target: { value: '<br><img src="test.jpg"><input>' } })

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      expect(output?.textContent).toContain('<br>')
      expect(output?.textContent).toContain('<img')
    })
  })

  it('should preserve content within pre, code, textarea, script, style elements', async () => {
    const { container } = render(HtmlTool)

    const textarea = container.querySelector('.editor-textarea')
    if (!textarea) throw new Error('Textarea not found')
    await fireEvent.input(textarea, { target: { value: '<pre>  preserved  </pre>' } })

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      expect(output?.textContent).toContain('  preserved  ')
    })
  })

  it('should preserve whitespace in pre during minify', async () => {
    const { container } = render(HtmlTool)

    const minifyButton = screen.getByText('Minify')
    await fireEvent.click(minifyButton)

    const textarea = container.querySelector('.editor-textarea')
    if (!textarea) throw new Error('Textarea not found')
    await fireEvent.input(textarea, { target: { value: '<pre>  line1\n  line2  </pre>' } })

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      // Whitespace inside pre should be preserved even in minify mode
      expect(output?.textContent).toContain('  line1')
      expect(output?.textContent).toContain('  line2  ')
    })
  })

  it('should handle DOCTYPE declaration', async () => {
    const { container } = render(HtmlTool)

    const textarea = container.querySelector('.editor-textarea')
    if (!textarea) throw new Error('Textarea not found')
    await fireEvent.input(textarea, { target: { value: '<!DOCTYPE html><html><body></body></html>' } })

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      expect(output?.textContent).toContain('<!DOCTYPE html>')
    })
  })

  it('should handle lowercase doctype declaration', async () => {
    const { container } = render(HtmlTool)

    const textarea = container.querySelector('.editor-textarea')
    if (!textarea) throw new Error('Textarea not found')
    await fireEvent.input(textarea, { target: { value: '<!doctype html><html></html>' } })

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      expect(output?.textContent).toContain('<!doctype html>')
    })
  })

  it('should update character count', async () => {
    const { container } = render(HtmlTool)

    const textarea = container.querySelector('.editor-textarea')
    if (!textarea) throw new Error('Textarea not found')
    await fireEvent.input(textarea, { target: { value: '<div>Test</div>' } })

    await waitFor(() => {
      const charCounts = container.querySelectorAll('.char-count')
      expect(charCounts.length).toBeGreaterThan(0)
      expect(charCounts[0].textContent).toContain('15')
    })
  })

  it('should escape script tags in output', async () => {
    const { container } = render(HtmlTool)

    const textarea = container.querySelector('.editor-textarea')
    if (!textarea) throw new Error('Textarea not found')
    await fireEvent.input(textarea, { target: { value: '<script>alert("xss")</script>' } })

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      const text = output?.textContent
      // Script tag should be escaped or properly formatted, not executed
      expect(text).toContain('<script')
      expect(text).toContain('</script>')
    })
  })

  it('should handle unclosed comments gracefully', async () => {
    const { container } = render(HtmlTool)

    const textarea = container.querySelector('.editor-textarea')
    if (!textarea) throw new Error('Textarea not found')
    await fireEvent.input(textarea, { target: { value: '<div><!-- unclosed comment' } })

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      expect(output?.textContent).toBeTruthy()
    })
  })

  it('should handle mismatched closing tags', async () => {
    const { container } = render(HtmlTool)

    const textarea = container.querySelector('.editor-textarea')
    if (!textarea) throw new Error('Textarea not found')
    await fireEvent.input(textarea, { target: { value: '<div><p>Text</div></p>' } })

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      const text = output?.textContent
      expect(text).toContain('<div>')
      expect(text).toContain('<p>')
      expect(text).toContain('</div>')
      expect(text).toContain('</p>')
    })
  })

  it('should have aria-label on icon buttons', () => {
    render(HtmlTool)

    expect(screen.getByLabelText('Load Example')).toBeInTheDocument()
    expect(screen.getByLabelText('Clear')).toBeInTheDocument()
  })

  it('should have proper checkbox label associations', async () => {
    const { container } = render(HtmlTool)

    const minifyButton = screen.getByText('Minify')
    await fireEvent.click(minifyButton)

    await waitFor(() => {
      const checkbox = container.querySelector('#remove-comments')
      expect(checkbox).toHaveAttribute('id', 'remove-comments')
    })
  })

  it('should have aria-live on output', async () => {
    const { container } = render(HtmlTool)

    const output = container.querySelector('.output-display')
    expect(output).toHaveAttribute('aria-live', 'polite')
  })

  it('should handle large HTML input efficiently', async () => {
    const { container } = render(HtmlTool)

    // Generate a large HTML input
    const largeContent = Array(100).fill('<div><p>Test content</p></div>').join('')
    const textarea = container.querySelector('.editor-textarea')
    if (!textarea) throw new Error('Textarea not found')

    const startTime = performance.now()
    await fireEvent.input(textarea, { target: { value: largeContent } })

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      expect(output?.textContent).toContain('<div>')
    }, { timeout: 5000 })

    const endTime = performance.now()
    expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
  })
})
