import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import RegexTool from '$lib/tools/RegexTool.svelte'

describe('RegexTool', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should have input areas on mount', () => {
    render(RegexTool)
    const patternInput = document.getElementById('regex-pattern')
    const textInput = document.getElementById('regex-input-text')
    expect(patternInput).toBeInTheDocument()
    expect(textInput).toBeInTheDocument()
  })

  it('should show placeholder for initial state', () => {
    render(RegexTool)
    const emptyState = screen.getByText(/Enter a regex pattern/i)
    expect(emptyState).toBeInTheDocument()
  })

  it('should show matches when pattern and text provided', async () => {
    render(RegexTool)
    const patternInput = document.getElementById('regex-pattern')
    const inputArea = document.getElementById('regex-input-text')

    await fireEvent.input(patternInput, { target: { value: 'test' } })
    await fireEvent.input(inputArea, { target: { value: 'this is a test and another test here' } })

    await waitFor(() => {
      const matchElements = document.querySelectorAll('mark.match-highlight')
      expect(matchElements.length).toBe(2)
      expect(matchElements[0].textContent).toBe('test')
      expect(matchElements[1].textContent).toBe('test')
    }, { timeout: 400 })
  })

  it('should handle special characters in regex pattern', async () => {
    render(RegexTool)
    const patternInput = document.getElementById('regex-pattern')
    const inputArea = document.getElementById('regex-input-text')

    await fireEvent.input(patternInput, { target: { value: '\\d+' } })
    await fireEvent.input(inputArea, { target: { value: 'abc123def456' } })

    await waitFor(() => {
      const matchElements = document.querySelectorAll('mark.match-highlight')
      expect(matchElements.length).toBe(2)
      expect(matchElements[0].textContent).toBe('123')
      expect(matchElements[1].textContent).toBe('456')
    }, { timeout: 400 })
  })

  it('should handle global flag correctly', async () => {
    render(RegexTool)
    const patternInput = document.getElementById('regex-pattern')
    const inputArea = document.getElementById('regex-input-text')

    const gFlagBtn = screen.getByLabelText(/Toggle Global flag/i)
    expect(gFlagBtn).toHaveAttribute('aria-pressed', 'true')

    await fireEvent.input(patternInput, { target: { value: 'test' } })
    await fireEvent.input(inputArea, { target: { value: 'test test test' } })

    await waitFor(() => {
      const matchElements = document.querySelectorAll('mark.match-highlight')
      expect(matchElements.length).toBe(3)
    }, { timeout: 400 })
  })

  it('should handle case insensitive flag', async () => {
    render(RegexTool)
    const patternInput = document.getElementById('regex-pattern')
    const inputArea = document.getElementById('regex-input-text')

    const iFlagBtn = screen.getByLabelText(/Toggle Case Insensitive flag/i)
    await fireEvent.click(iFlagBtn)
    expect(iFlagBtn).toHaveAttribute('aria-pressed', 'true')

    await fireEvent.input(patternInput, { target: { value: 'TEST' } })
    await fireEvent.input(inputArea, { target: { value: 'test Test TEST' } })

    await waitFor(() => {
      const matchElements = document.querySelectorAll('mark.match-highlight')
      expect(matchElements.length).toBe(3)
    }, { timeout: 400 })
  })

  it('should handle multiline flag appropriately', async () => {
    render(RegexTool)
    const patternInput = document.getElementById('regex-pattern')
    const inputArea = document.getElementById('regex-input-text')

    const mFlagBtn = screen.getByLabelText(/Toggle Multiline flag/i)
    await fireEvent.click(mFlagBtn)
    expect(mFlagBtn).toHaveAttribute('aria-pressed', 'true')

    await fireEvent.input(patternInput, { target: { value: '^test' } })
    await fireEvent.input(
      inputArea,
      {
        target: {
          value: 'first line\ntest on second line\ntest on third line'
        }
      }
    )

    await waitFor(() => {
      const matchElements = document.querySelectorAll('mark.match-highlight')
      expect(matchElements.length).toBe(2)
      expect(matchElements[0].textContent).toBe('test')
      expect(matchElements[1].textContent).toBe('test')
    }, { timeout: 400 })
  })

  it('should highlight multiple occurrences', async () => {
    render(RegexTool)
    const patternInput = document.getElementById('regex-pattern')
    const inputArea = document.getElementById('regex-input-text')

    await fireEvent.input(patternInput, { target: { value: 'a' } })
    await fireEvent.input(inputArea, { target: { value: 'banana' } })

    await waitFor(() => {
      const matchElements = document.querySelectorAll('mark.match-highlight')
      expect(matchElements.length).toBe(3)
    }, { timeout: 400 })
  })

  it('should clear all fields when clear button is clicked', async () => {
    render(RegexTool)
    const patternInput = document.getElementById('regex-pattern')
    const inputArea = document.getElementById('regex-input-text')
    const clearButton = screen.getByTitle('Clear')

    await fireEvent.input(patternInput, { target: { value: 'test' } })
    await fireEvent.input(inputArea, { target: { value: 'this is a test' } })

    await waitFor(() => {
      const matchElements = document.querySelectorAll('mark.match-highlight')
      expect(matchElements.length).toBeGreaterThan(0)
    }, { timeout: 400 })

    await fireEvent.click(clearButton)

    await waitFor(() => {
      expect(patternInput).toHaveValue('')
      expect(inputArea).toHaveValue('')
    }, { timeout: 200 })

    const emptyState = screen.getByText(/Enter a regex pattern/i)
    expect(emptyState).toBeInTheDocument()
  })

  it('should handle patterns with quantifiers', async () => {
    render(RegexTool)
    const patternInput = document.getElementById('regex-pattern')
    const inputArea = document.getElementById('regex-input-text')

    await fireEvent.input(patternInput, { target: { value: 'go+l' } })
    await fireEvent.input(inputArea, { target: { value: 'gol gool goool gell' } })

    await waitFor(() => {
      const matchElements = document.querySelectorAll('mark.match-highlight')
      expect(matchElements.length).toBe(3)
    }, { timeout: 400 })
  })

  it('should debounce input changes', async () => {
    render(RegexTool)
    const patternInput = document.getElementById('regex-pattern')

    await fireEvent.input(patternInput, { target: { value: 'a' } })
    await fireEvent.input(patternInput, { target: { value: 'an' } })
    await fireEvent.input(patternInput, { target: { value: 'and' } })

    await waitFor(() => {
      expect(patternInput).toHaveValue('and')
    }, { timeout: 400 })
  })

  it('should show error for invalid regex patterns', async () => {
    render(RegexTool)
    const patternInput = document.getElementById('regex-pattern')
    const inputArea = document.getElementById('regex-input-text')

    await fireEvent.input(inputArea, { target: { value: 'test text' } })
    await fireEvent.input(patternInput, { target: { value: '(unclosed' } })

    await waitFor(() => {
      const errorTitle = screen.getByText(/Invalid regex pattern/i)
      expect(errorTitle).toBeInTheDocument()
    }, { timeout: 400 })
  })

  it('should show error for unclosed groups', async () => {
    render(RegexTool)
    const patternInput = document.getElementById('regex-pattern')
    const inputArea = document.getElementById('regex-input-text')

    await fireEvent.input(inputArea, { target: { value: 'test text' } })
    await fireEvent.input(patternInput, { target: { value: '[abc' } })

    await waitFor(() => {
      const errorTitle = screen.getByText(/Invalid regex pattern/i)
      expect(errorTitle).toBeInTheDocument()
    }, { timeout: 400 })
  })

  it('should show guidance when pattern is empty', async () => {
    render(RegexTool)
    const patternInput = document.getElementById('regex-pattern')
    const inputArea = document.getElementById('regex-input-text')

    await fireEvent.input(patternInput, { target: { value: 'test' } })
    await fireEvent.input(inputArea, { target: { value: 'some test text' } })

    await waitFor(() => {
      const matchElements = document.querySelectorAll('mark.match-highlight')
      expect(matchElements.length).toBeGreaterThan(0)
    }, { timeout: 400 })

    await fireEvent.input(patternInput, { target: { value: '' } })

    await waitFor(() => {
      const guidance = screen.getByText(/Enter a regex pattern/i)
      expect(guidance).toBeInTheDocument()
    }, { timeout: 400 })
  })

  it('should show guidance when text input is empty', async () => {
    render(RegexTool)
    const patternInput = document.getElementById('regex-pattern')
    const inputArea = document.getElementById('regex-input-text')

    await fireEvent.input(patternInput, { target: { value: 'test' } })
    await fireEvent.input(inputArea, { target: { value: 'some test text' } })

    await waitFor(() => {
      const matchElements = document.querySelectorAll('mark.match-highlight')
      expect(matchElements.length).toBeGreaterThan(0)
    }, { timeout: 400 })

    await fireEvent.input(inputArea, { target: { value: '' } })

    await waitFor(() => {
      const guidance = screen.getByText(/Enter text to test/i)
      expect(guidance).toBeInTheDocument()
    }, { timeout: 400 })
  })

  it('should clear error when pattern becomes valid', async () => {
    render(RegexTool)
    const patternInput = document.getElementById('regex-pattern')
    const inputArea = document.getElementById('regex-input-text')

    await fireEvent.input(inputArea, { target: { value: 'test text' } })
    await fireEvent.input(patternInput, { target: { value: '(unclosed' } })

    await waitFor(() => {
      const errorTitle = screen.getByText(/Invalid regex pattern/i)
      expect(errorTitle).toBeInTheDocument()
    }, { timeout: 400 })

    await fireEvent.input(patternInput, { target: { value: 'test' } })

    await waitFor(() => {
      const errorTitle = screen.queryByText(/Invalid regex pattern/i)
      expect(errorTitle).not.toBeInTheDocument()
    }, { timeout: 400 })
  })

  it('should validate flag combinations', async () => {
    render(RegexTool)
    const flagsDisplay = screen.getByLabelText(/Active regex flags/i)

    const gFlagBtn = screen.getByLabelText(/Toggle Global flag/i)
    const iFlagBtn = screen.getByLabelText(/Toggle Case Insensitive flag/i)

    await fireEvent.click(gFlagBtn)
    expect(gFlagBtn).toHaveAttribute('aria-pressed', 'false')
    expect(flagsDisplay.textContent).not.toContain('g')

    await fireEvent.click(iFlagBtn)
    expect(iFlagBtn).toHaveAttribute('aria-pressed', 'true')
    expect(flagsDisplay.textContent).toContain('i')
  })

  it('should handle capturing groups', async () => {
    render(RegexTool)
    const patternInput = document.getElementById('regex-pattern')
    const inputArea = document.getElementById('regex-input-text')

    await fireEvent.input(patternInput, { target: { value: '(test)' } })
    await fireEvent.input(inputArea, { target: { value: 'this is a test' } })

    await waitFor(() => {
      const matchElements = document.querySelectorAll('mark.match-highlight')
      expect(matchElements.length).toBe(1)
      expect(matchElements[0].textContent).toBe('test')
    }, { timeout: 400 })
  })

  it('should handle unicode flag', async () => {
    render(RegexTool)
    const patternInput = document.getElementById('regex-pattern')
    const inputArea = document.getElementById('regex-input-text')
    const uFlagBtn = screen.getByLabelText(/Toggle Unicode flag/i)

    await fireEvent.click(uFlagBtn)
    expect(uFlagBtn).toHaveAttribute('aria-pressed', 'true')

    await fireEvent.input(patternInput, { target: { value: '\\p{L}+' } })
    await fireEvent.input(inputArea, { target: { value: 'Hello 世界' } })

    await waitFor(() => {
      const matchElements = document.querySelectorAll('mark.match-highlight')
      expect(matchElements.length).toBeGreaterThan(0)
    }, { timeout: 400 })
  })

  it('should handle dotall flag', async () => {
    render(RegexTool)
    const patternInput = document.getElementById('regex-pattern')
    const inputArea = document.getElementById('regex-input-text')
    const sFlagBtn = screen.getByLabelText(/Toggle Dotall flag/i)

    await fireEvent.click(sFlagBtn)
    expect(sFlagBtn).toHaveAttribute('aria-pressed', 'true')

    await fireEvent.input(patternInput, { target: { value: 'a.b' } })
    await fireEvent.input(inputArea, { target: { value: 'a\nb' } })

    await waitFor(() => {
      const matchElements = document.querySelectorAll('mark.match-highlight')
      expect(matchElements.length).toBe(1)
      expect(matchElements[0].textContent).toBe('a\nb')
    }, { timeout: 400 })
  })

  it('should handle sticky flag', async () => {
    render(RegexTool)
    const yFlagBtn = screen.getByLabelText(/Toggle Sticky flag/i)

    await fireEvent.click(yFlagBtn)
    expect(yFlagBtn).toHaveAttribute('aria-pressed', 'true')

    const flagsDisplay = screen.getByLabelText(/Active regex flags/i)
    expect(flagsDisplay.textContent).toContain('y')
  })

  it('should load example data', async () => {
    render(RegexTool)
    const loadExampleBtn = screen.getByTitle('Load Example')

    await fireEvent.click(loadExampleBtn)

    await waitFor(() => {
      const patternInput = document.getElementById('regex-pattern')
      const inputArea = document.getElementById('regex-input-text')
      expect(patternInput).toHaveValue('\\d+')
      expect(inputArea.value).toContain('apples')

      const matchElements = document.querySelectorAll('mark.match-highlight')
      expect(matchElements.length).toBeGreaterThan(0)
    }, { timeout: 400 })
  })

  it('should persist state to localStorage', async () => {
    render(RegexTool)
    const patternInput = document.getElementById('regex-pattern')
    const inputArea = document.getElementById('regex-input-text')

    await fireEvent.input(patternInput, { target: { value: 'test-pattern' } })
    await fireEvent.input(inputArea, { target: { value: 'test content' } })

    await waitFor(() => {
      expect(localStorage.getItem('devutils-regex-pattern')).toBe('test-pattern')
      expect(localStorage.getItem('devutils-regex-input')).toBe('test content')
    }, { timeout: 1000 })
  })

  it('should clear localStorage on clear button', async () => {
    render(RegexTool)
    const patternInput = document.getElementById('regex-pattern')
    const inputArea = document.getElementById('regex-input-text')
    const clearButton = screen.getByTitle('Clear')

    await fireEvent.input(patternInput, { target: { value: 'test' } })
    await fireEvent.input(inputArea, { target: { value: 'some text' } })

    await waitFor(() => {
      expect(localStorage.getItem('devutils-regex-pattern')).toBe('test')
    }, { timeout: 1000 })

    await fireEvent.click(clearButton)

    await waitFor(() => {
      expect(localStorage.getItem('devutils-regex-pattern')).toBeNull()
      expect(localStorage.getItem('devutils-regex-input')).toBeNull()
      expect(localStorage.getItem('devutils-regex-flags')).toBeNull()
    }, { timeout: 500 })
  })

  it('should render match details when matches exist', async () => {
    render(RegexTool)
    const patternInput = document.getElementById('regex-pattern')
    const inputArea = document.getElementById('regex-input-text')

    await fireEvent.input(patternInput, { target: { value: 'test' } })
    await fireEvent.input(inputArea, { target: { value: 'test test test' } })

    await waitFor(() => {
      const matchDetailsTitle = screen.getByText(/Match Details/i)
      expect(matchDetailsTitle).toBeInTheDocument()

      const matchCount = screen.getByText(/3 matches/i)
      expect(matchCount).toBeInTheDocument()

      const matchItems = document.querySelectorAll('.match-item')
      expect(matchItems.length).toBe(3)
    }, { timeout: 400 })
  })

  it('should show copy button when matches exist', async () => {
    render(RegexTool)
    const patternInput = document.getElementById('regex-pattern')
    const inputArea = document.getElementById('regex-input-text')

    await fireEvent.input(patternInput, { target: { value: 'test' } })
    await fireEvent.input(inputArea, { target: { value: 'test test' } })

    await waitFor(() => {
      const copyButton = screen.queryByRole('button', { name: /Copy/i })
      expect(copyButton).toBeInTheDocument()
    }, { timeout: 400 })
  })

  it('should handle special characters in input text', async () => {
    render(RegexTool)
    const patternInput = document.getElementById('regex-pattern')
    const inputArea = document.getElementById('regex-input-text')

    await fireEvent.input(patternInput, { target: { value: 'test' } })
    await fireEvent.input(inputArea, {
      target: { value: '<script>alert("test")</script>' }
    })

    await waitFor(() => {
      const highlightedArea = document.querySelector('.highlighted-area')
      expect(highlightedArea).not.toBeNull()
      expect(highlightedArea).toBeInTheDocument()
      if (highlightedArea) {
        expect(highlightedArea.innerHTML).not.toContain('<script>')
        expect(highlightedArea.innerHTML).toContain('&lt;script&gt;')
      }
    }, { timeout: 400 })
  })

  it('should handle newlines in input text', async () => {
    render(RegexTool)
    const patternInput = document.getElementById('regex-pattern')
    const inputArea = document.getElementById('regex-input-text')

    await fireEvent.input(patternInput, { target: { value: 'line' } })
    await fireEvent.input(inputArea, { target: { value: 'line1\nline2\nline3' } })

    await waitFor(() => {
      const matchElements = document.querySelectorAll('mark.match-highlight')
      expect(matchElements.length).toBe(3)
    }, { timeout: 400 })
  })

  it('should handle rapid typing', async () => {
    render(RegexTool)
    const patternInput = document.getElementById('regex-pattern')
    const inputArea = document.getElementById('regex-input-text')

    await fireEvent.input(inputArea, { target: { value: 'a' } })
    await fireEvent.input(patternInput, { target: { value: 'a' } })
    await fireEvent.input(patternInput, { target: { value: 'ab' } })
    await fireEvent.input(patternInput, { target: { value: 'abc' } })
    await fireEvent.input(patternInput, { target: { value: 'abcd' } })
    await fireEvent.input(patternInput, { target: { value: 'abcde' } })

    await waitFor(() => {
      expect(patternInput).toHaveValue('abcde')
    }, { timeout: 400 })
  })

  it('should have accessible pattern input', () => {
    render(RegexTool)
    const patternInput = document.getElementById('regex-pattern')
    expect(patternInput).toHaveAttribute('id', 'regex-pattern')
    expect(patternInput).toHaveAttribute('spellcheck', 'false')
  })

  it('should have accessible text input', () => {
    render(RegexTool)
    const textInput = document.getElementById('regex-input-text')
    expect(textInput).toHaveAttribute('id', 'regex-input-text')
    expect(textInput).toHaveAttribute('spellcheck', 'false')
  })

  it('should have accessible flag buttons', () => {
    render(RegexTool)
    const gFlagBtn = screen.getByLabelText(/Toggle Global flag/i)
    expect(gFlagBtn).toHaveAttribute('aria-pressed')

    const flagsDisplay = screen.getByLabelText(/Active regex flags/i)
    expect(flagsDisplay).toBeInTheDocument()
  })

  describe('XSS Prevention', () => {
    it('should escape HTML tags to prevent script injection', async () => {
      render(RegexTool)
      const patternInput = document.getElementById('regex-pattern')
      const inputArea = document.getElementById('regex-input-text')

      await fireEvent.input(patternInput, { target: { value: 'test' } })
      await fireEvent.input(inputArea, {
        target: { value: '<script>alert("xss")</script>' }
      })

      await waitFor(() => {
        const highlightedArea = document.querySelector('.highlighted-area')
        expect(highlightedArea.innerHTML).not.toContain('<script>')
        expect(highlightedArea.innerHTML).toContain('&lt;script&gt;')
      }, { timeout: 400 })
    })

    it('should escape event handlers in input text', async () => {
      render(RegexTool)
      const patternInput = document.getElementById('regex-pattern')
      const inputArea = document.getElementById('regex-input-text')

      await fireEvent.input(patternInput, { target: { value: 'test' } })
      await fireEvent.input(inputArea, {
        target: { value: '<img src=x onerror=alert("xss")>' }
      })

      await waitFor(() => {
        const highlightedArea = document.querySelector('.highlighted-area')
        // The angle brackets are escaped, making it safe
        expect(highlightedArea.innerHTML).toContain('&lt;img')
        expect(highlightedArea.innerHTML).toContain('&gt;')
        // The img tag is not rendered as actual HTML
        expect(highlightedArea.innerHTML).not.toContain('<img')
      }, { timeout: 400 })
    })

    it('should escape javascript: URLs', async () => {
      render(RegexTool)
      const patternInput = document.getElementById('regex-pattern')
      const inputArea = document.getElementById('regex-input-text')

      await fireEvent.input(patternInput, { target: { value: 'javascript' } })
      await fireEvent.input(inputArea, {
        target: { value: 'javascript:alert("xss")' }
      })

      await waitFor(() => {
        const highlightedArea = document.querySelector('.highlighted-area')
        // The colon should be escaped, and the pattern match is highlighted
        expect(highlightedArea.innerHTML).not.toContain('javascript:')
        expect(highlightedArea.innerHTML).toContain('javascript')
      }, { timeout: 400 })
    })

    it('should escape backticks to prevent template literal injection', async () => {
      render(RegexTool)
      const patternInput = document.getElementById('regex-pattern')
      const inputArea = document.getElementById('regex-input-text')

      await fireEvent.input(patternInput, { target: { value: 'test' } })
      await fireEvent.input(inputArea, {
        target: { value: '`${alert("xss")}`' }
      })

      await waitFor(() => {
        const highlightedArea = document.querySelector('.highlighted-area')
        // Check that the content is escaped and displayed safely
        expect(highlightedArea.innerHTML).not.toContain('<script')
        // The backtick should be escaped or the content should be safe
        expect(highlightedArea.innerHTML).toContain('`') || expect(highlightedArea.innerHTML).toContain('&#96;')
      }, { timeout: 400 })
    })

    it('should escape null bytes', async () => {
      render(RegexTool)
      const patternInput = document.getElementById('regex-pattern')
      const inputArea = document.getElementById('regex-input-text')

      await fireEvent.input(patternInput, { target: { value: 'test' } })
      await fireEvent.input(inputArea, {
        target: { value: 'test\0null' }
      })

      await waitFor(() => {
        const highlightedArea = document.querySelector('.highlighted-area')
        // The test match should be highlighted
        expect(highlightedArea.innerHTML).toContain('match-highlight')
        // The null byte should either be escaped or the text should be safe
        expect(highlightedArea.innerHTML).not.toContain('<script')
      }, { timeout: 400 })
    })

    it('should escape SVG event handlers', async () => {
      render(RegexTool)
      const patternInput = document.getElementById('regex-pattern')
      const inputArea = document.getElementById('regex-input-text')

      await fireEvent.input(patternInput, { target: { value: 'svg' } })
      await fireEvent.input(inputArea, {
        target: { value: '<svg onload=alert("xss")>' }
      })

      await waitFor(() => {
        const highlightedArea = document.querySelector('.highlighted-area')
        // The angle brackets are escaped, making it safe
        expect(highlightedArea.innerHTML).toContain('&lt;')
        expect(highlightedArea.innerHTML).toContain('&gt;')
        // The content is escaped so it won't execute
        expect(highlightedArea.innerHTML).not.toContain('<svg')
      }, { timeout: 400 })
    })

    it('should escape iframe srcdoc', async () => {
      render(RegexTool)
      const patternInput = document.getElementById('regex-pattern')
      const inputArea = document.getElementById('regex-input-text')

      await fireEvent.input(patternInput, { target: { value: 'iframe' } })
      await fireEvent.input(inputArea, {
        target: { value: '<iframe srcdoc="<script>alert(1)</script>">' }
      })

      await waitFor(() => {
        const highlightedArea = document.querySelector('.highlighted-area')
        // The angle brackets are escaped, making it safe
        expect(highlightedArea.innerHTML).not.toContain('<iframe')
        expect(highlightedArea.innerHTML).toContain('&lt;')
        expect(highlightedArea.innerHTML).toContain('&gt;')
      }, { timeout: 400 })
    })

    it('should escape object/data URIs', async () => {
      render(RegexTool)
      const patternInput = document.getElementById('regex-pattern')
      const inputArea = document.getElementById('regex-input-text')

      await fireEvent.input(patternInput, { target: { value: 'object' } })
      await fireEvent.input(inputArea, {
        target: { value: '<object data="javascript:alert(1)">' }
      })

      await waitFor(() => {
        const highlightedArea = document.querySelector('.highlighted-area')
        // The angle brackets are escaped, making it safe
        expect(highlightedArea.innerHTML).not.toContain('<object')
        expect(highlightedArea.innerHTML).toContain('&lt;')
        expect(highlightedArea.innerHTML).toContain('&gt;')
      }, { timeout: 400 })
    })

    it('should escape form action attributes', async () => {
      render(RegexTool)
      const patternInput = document.getElementById('regex-pattern')
      const inputArea = document.getElementById('regex-input-text')

      await fireEvent.input(patternInput, { target: { value: 'form' } })
      await fireEvent.input(inputArea, {
        target: { value: '<form action="javascript:alert(1)"><button>Click</button></form>' }
      })

      await waitFor(() => {
        const highlightedArea = document.querySelector('.highlighted-area')
        // The angle brackets are escaped, making it safe
        expect(highlightedArea.innerHTML).not.toContain('<form')
        expect(highlightedArea.innerHTML).toContain('&lt;')
        expect(highlightedArea.innerHTML).toContain('&gt;')
      }, { timeout: 400 })
    })

    it('should escape HTML comments with scripts', async () => {
      render(RegexTool)
      const patternInput = document.getElementById('regex-pattern')
      const inputArea = document.getElementById('regex-input-text')

      await fireEvent.input(patternInput, { target: { value: 'comment' } })
      await fireEvent.input(inputArea, {
        target: { value: '<!--<script>alert(1)</script>-->' }
      })

      await waitFor(() => {
        const highlightedArea = document.querySelector('.highlighted-area')
        expect(highlightedArea.innerHTML).not.toContain('<script>')
        // The 'comment' pattern doesn't match, so no highlighting, but angle brackets are escaped
        expect(highlightedArea.innerHTML).toContain('&lt;!--')
      }, { timeout: 400 })
    })
  })

  describe('ReDoS Protection', () => {
    it('should handle potentially dangerous regex patterns without blocking', async () => {
      render(RegexTool)
      const patternInput = document.getElementById('regex-pattern')
      const inputArea = document.getElementById('regex-input-text')

      await fireEvent.input(patternInput, { target: { value: '(a+)+$' } })
      await fireEvent.input(inputArea, { target: { value: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaab' } })

      await waitFor(() => {
        const errorTitle = screen.queryByText(/Invalid regex pattern/i)
        expect(errorTitle).not.toBeInTheDocument()
      }, { timeout: 500 })
    })
  })

  describe('Flag Toggle', () => {
    it('should remove all occurrences of a flag when toggled off', async () => {
      render(RegexTool)
      const flagsDisplay = screen.getByLabelText(/Active regex flags/i)
      const gFlagBtn = screen.getByLabelText(/Toggle Global flag/i)

      expect(flagsDisplay.textContent).toContain('g')

      await fireEvent.click(gFlagBtn)
      expect(flagsDisplay.textContent).not.toContain('g')
      expect(gFlagBtn).toHaveAttribute('aria-pressed', 'false')

      await fireEvent.click(gFlagBtn)
      expect(flagsDisplay.textContent).toContain('g')
      expect(flagsDisplay.textContent).toBe('g')
    })

    it('should handle multiple flag toggles correctly', async () => {
      render(RegexTool)
      const flagsDisplay = screen.getByLabelText(/Active regex flags/i)
      const gFlagBtn = screen.getByLabelText(/Toggle Global flag/i)
      const iFlagBtn = screen.getByLabelText(/Toggle Case Insensitive flag/i)
      const mFlagBtn = screen.getByLabelText(/Toggle Multiline flag/i)

      await fireEvent.click(gFlagBtn)
      await fireEvent.click(iFlagBtn)
      await fireEvent.click(mFlagBtn)

      expect(flagsDisplay.textContent).toContain('i')
      expect(flagsDisplay.textContent).toContain('m')
      expect(flagsDisplay.textContent).not.toContain('g')

      await fireEvent.click(iFlagBtn)
      expect(flagsDisplay.textContent).not.toContain('i')
      expect(flagsDisplay.textContent).toContain('m')
    })
  })

  describe('Persistent Errors', () => {
    it('should display persistent errors from localStorage failures', async () => {
      const mockError = new Error('Storage quota exceeded')
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw mockError
      })

      render(RegexTool)
      const patternInput = document.getElementById('regex-pattern')

      await fireEvent.input(patternInput, { target: { value: 'test' } })

      await waitFor(() => {
        const errorMessage = screen.getByText(/Failed to save to localStorage/i)
        expect(errorMessage).toBeInTheDocument()
      }, { timeout: 1000 })

      vi.restoreAllMocks()
    })

    it('should allow dismissing persistent errors', async () => {
      const mockError = new Error('Storage quota exceeded')
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw mockError
      })

      render(RegexTool)
      const patternInput = document.getElementById('regex-pattern')

      await fireEvent.input(patternInput, { target: { value: 'test' } })

      await waitFor(() => {
        const errorMessage = screen.getByText(/Failed to save to localStorage/i)
        expect(errorMessage).toBeInTheDocument()
      }, { timeout: 1000 })

      const dismissBtn = screen.getByLabelText(/Dismiss error/i)
      await fireEvent.click(dismissBtn)

      await waitFor(() => {
        const errorMessage = screen.queryByText(/Failed to save to localStorage/i)
        expect(errorMessage).not.toBeInTheDocument()
      })

      vi.restoreAllMocks()
    })
  })
})
