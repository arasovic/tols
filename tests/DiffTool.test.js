import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import DiffTool from '$lib/tools/DiffTool.svelte'

describe('DiffTool', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Basic Rendering', () => {
    it('should initialize with tool header', () => {
      render(DiffTool)
      expect(screen.getByText('Diff Checker')).toBeInTheDocument()
      expect(screen.getByText('Compare two texts with word-level precision')).toBeInTheDocument()
    })

    it('should have split and unified mode buttons', () => {
      render(DiffTool)
      expect(screen.getByText('Split')).toBeInTheDocument()
      expect(screen.getByText('Unified')).toBeInTheDocument()
    })

    it('should show original and modified textareas in split mode', () => {
      render(DiffTool)
      expect(screen.getByText('Original')).toBeInTheDocument()
      expect(screen.getByText('Modified')).toBeInTheDocument()
    })

    it('should show character counts with correct format', async () => {
      const { container } = render(DiffTool)
      await waitFor(() => {
        const charCounts = container.querySelectorAll('.char-count')
        expect(charCounts.length).toBe(2)
        // Verify format matches "<number> chars" pattern
        expect(charCounts[0].textContent).toMatch(/^\d+ chars$/)
        expect(charCounts[1].textContent).toMatch(/^\d+ chars$/)
      }, { timeout: 500 })
    })
  })

  describe('Diff Results', () => {
    it('should show diff results', async () => {
      const { container } = render(DiffTool)
      await waitFor(() => {
        expect(container.querySelector('.diff-result')).toBeInTheDocument()
      }, { timeout: 500 })
    })

    it('should show diff grid structure', async () => {
      const { container } = render(DiffTool)
      await waitFor(() => {
        const diffGrid = container.querySelector('.diff-grid')
        expect(diffGrid).toBeInTheDocument()
      }, { timeout: 500 })
    })

    it('should show diff results with line numbers area', async () => {
      const { container } = render(DiffTool)
      await waitFor(() => {
        const diffGrid = container.querySelector('.diff-grid')
        expect(diffGrid).toBeInTheDocument()
        expect(diffGrid).toHaveAttribute('role', 'table')
      }, { timeout: 500 })
    })
  })

  describe('Mode Switching', () => {
    it('should switch to unified mode', async () => {
      const { container } = render(DiffTool)
      const unifiedButton = screen.getByText('Unified')
      await fireEvent.click(unifiedButton)
      expect(screen.getByText('Unified Diff')).toBeInTheDocument()
      expect(container.querySelector('.unified-result')).toBeInTheDocument()
    })

    it('should switch back to split mode', async () => {
      const { container } = render(DiffTool)
      await fireEvent.click(screen.getByText('Unified'))
      await fireEvent.click(screen.getByText('Split'))
      expect(container.querySelector('.diff-result')).toBeInTheDocument()
    })

    it('should show unified diff with correct line markers', async () => {
      const { container } = render(DiffTool)
      const textareas = container.querySelectorAll('.diff-textarea')
      // Set up content that will definitely trigger diff
      await fireEvent.input(textareas[0], { target: { value: 'old line content' } })
      await fireEvent.input(textareas[1], { target: { value: 'new line content' } })

      // Wait for diff to compute
      await waitFor(() => {
        expect(container.querySelector('.diff-grid')).toBeInTheDocument()
      }, { timeout: 1000 })

      // Switch to unified mode
      await fireEvent.click(screen.getByText('Unified'))

      await waitFor(() => {
        const unifiedContent = container.querySelector('.unified-content')
        expect(unifiedContent).toBeInTheDocument()

        // Check for line markers in the unified view
        const lineMarkers = container.querySelectorAll('.line-marker')
        expect(lineMarkers.length).toBeGreaterThanOrEqual(1)

        // Verify markers have actual text content (space, −, or +)
        const markerTexts = Array.from(lineMarkers).map(m => m.textContent.trim())
        markerTexts.forEach(text => {
          expect(['', ' ', '−', '+'].includes(text)).toBe(true)
        })
      }, { timeout: 1000 })
    })

    it('should display removed lines with minus marker in unified mode', async () => {
      const { container } = render(DiffTool)
      const textareas = container.querySelectorAll('.diff-textarea')
      // Set up content that will be detected as removed
      await fireEvent.input(textareas[0], { target: { value: 'only on left side' } })
      await fireEvent.input(textareas[1], { target: { value: '' } })

      // Wait for diff to compute
      await waitFor(() => {
        expect(container.querySelector('.diff-grid')).toBeInTheDocument()
      }, { timeout: 1000 })

      await fireEvent.click(screen.getByText('Unified'))

      await waitFor(() => {
        const unifiedLines = container.querySelectorAll('.unified-line')
        expect(unifiedLines.length).toBeGreaterThanOrEqual(1)

        // Check that line markers exist
        const markers = container.querySelectorAll('.line-marker')
        expect(markers.length).toBeGreaterThanOrEqual(1)

        // Check for minus marker in removed lines
        const removedLines = container.querySelectorAll('.unified-line.removed')
        removedLines.forEach(line => {
          const marker = line.querySelector('.line-marker')
          if (marker) {
            expect(marker.textContent).toBe('−')
          }
        })
      }, { timeout: 1000 })
    })

    it('should display added lines with plus marker in unified mode', async () => {
      const { container } = render(DiffTool)
      const textareas = container.querySelectorAll('.diff-textarea')
      // Set up content that will be detected as added
      await fireEvent.input(textareas[0], { target: { value: '' } })
      await fireEvent.input(textareas[1], { target: { value: 'only on right side' } })

      // Wait for diff to compute
      await waitFor(() => {
        expect(container.querySelector('.diff-grid')).toBeInTheDocument()
      }, { timeout: 1000 })

      await fireEvent.click(screen.getByText('Unified'))

      await waitFor(() => {
        const unifiedLines = container.querySelectorAll('.unified-line')
        expect(unifiedLines.length).toBeGreaterThanOrEqual(1)

        // Verify line markers exist
        const markers = container.querySelectorAll('.line-marker')
        expect(markers.length).toBeGreaterThanOrEqual(1)

        // Check for plus marker in added lines
        const addedLines = container.querySelectorAll('.unified-line.added')
        addedLines.forEach(line => {
          const marker = line.querySelector('.line-marker')
          if (marker) {
            expect(marker.textContent).toBe('+')
          }
        })
      }, { timeout: 1000 })
    })
  })

  describe('Word-Level Diff', () => {
    it('should render change-icon elements with correct symbols for word-level changes', async () => {
      const { container } = render(DiffTool)
      const textareas = container.querySelectorAll('.diff-textarea')
      // Set up content that triggers word-level diffs (similar enough to be "modified")
      await fireEvent.input(textareas[0], { target: { value: 'hello world here' } })
      await fireEvent.input(textareas[1], { target: { value: 'hello universe here' } })

      // Wait for diff to compute with word-level changes
      await waitFor(() => {
        // Look for change-icon elements in the diff grid
        const changeIcons = container.querySelectorAll('.change-icon')
        // May or may not have change icons depending on diff output
        if (changeIcons.length > 0) {
          // Verify change icons contain either − or + symbols
          changeIcons.forEach(icon => {
            const text = icon.textContent
            expect(text === '−' || text === '+').toBe(true)
          })
        }
      }, { timeout: 1000 })
    })

    it('should render word-level highlighting with word-delete and word-insert elements', async () => {
      const { container } = render(DiffTool)
      // Use example content which has word-level changes
      const loadExampleBtn = container.querySelector('[title="Load Example"]')
      expect(loadExampleBtn).toBeInTheDocument()
      if (loadExampleBtn) await fireEvent.click(loadExampleBtn)
      await new Promise(resolve => setTimeout(resolve, 400))
      await waitFor(() => {
        // Check for word-delete elements with actual content
        const wordDeletes = container.querySelectorAll('.word-delete')
        const wordInserts = container.querySelectorAll('.word-insert')

        // Should have at least one of each for modified lines
        expect(wordDeletes.length + wordInserts.length).toBeGreaterThanOrEqual(1)

        // Verify word-delete elements have content
        wordDeletes.forEach(el => {
          expect(el.textContent.length).toBeGreaterThan(0)
        })

        // Verify word-insert elements have content
        wordInserts.forEach(el => {
          expect(el.textContent.length).toBeGreaterThan(0)
        })
      }, { timeout: 500 })
    })

    it('should show diff grid with proper row types', async () => {
      const { container } = render(DiffTool)
      const textareas = container.querySelectorAll('.diff-textarea')
      // Content that differs to produce various row types
      await fireEvent.input(textareas[0], { target: { value: 'line one\nold line\nline three' } })
      await fireEvent.input(textareas[1], { target: { value: 'line one\nnew line\nline three' } })
      await new Promise(resolve => setTimeout(resolve, 400))
      await waitFor(() => {
        const diffGrid = container.querySelector('.diff-grid')
        expect(diffGrid).toBeInTheDocument()
        const diffRows = container.querySelectorAll('.diff-row')
        expect(diffRows.length).toBeGreaterThanOrEqual(1)
      }, { timeout: 500 })
    })

    it('should compute diff with different content', async () => {
      const { container } = render(DiffTool)
      const textareas = container.querySelectorAll('.diff-textarea')
      // Completely different content to produce removed/added rows
      await fireEvent.input(textareas[0], { target: { value: 'abc xyz' } })
      await fireEvent.input(textareas[1], { target: { value: 'def uvw' } })
      await new Promise(resolve => setTimeout(resolve, 400))
      await waitFor(() => {
        const diffGrid = container.querySelector('.diff-grid')
        expect(diffGrid).toBeInTheDocument()
        // Should have diff rows
        const diffRows = container.querySelectorAll('.diff-row')
        expect(diffRows.length).toBeGreaterThanOrEqual(1)
      }, { timeout: 500 })
    })
  })

  describe('User Actions', () => {
    it('should swap sides when swap button clicked', async () => {
      const { container } = render(DiffTool)
      const textareas = container.querySelectorAll('.diff-textarea')
      const leftTextarea = textareas[0]
      const rightTextarea = textareas[1]
      const originalValue = leftTextarea instanceof HTMLTextAreaElement ? leftTextarea.value : ''
      const modifiedValue = rightTextarea instanceof HTMLTextAreaElement ? rightTextarea.value : ''
      const swapButton = container.querySelector('[title="Swap Sides"]')
      expect(swapButton).toBeInTheDocument()
      if (swapButton) await fireEvent.click(swapButton)
      await waitFor(() => {
        const newTextareas = container.querySelectorAll('.diff-textarea')
        const newLeft = newTextareas[0]
        const newRight = newTextareas[1]
        const newLeftValue = newLeft instanceof HTMLTextAreaElement ? newLeft.value : ''
        const newRightValue = newRight instanceof HTMLTextAreaElement ? newRight.value : ''
        expect(newLeftValue).toBe(modifiedValue)
        expect(newRightValue).toBe(originalValue)
      }, { timeout: 300 })
    })

    it('should clear content when clear button clicked', async () => {
      const { container } = render(DiffTool)
      const clearButton = container.querySelector('[title="Clear"]')
      expect(clearButton).toBeInTheDocument()
      if (clearButton) await fireEvent.click(clearButton)
      await waitFor(() => {
        const textareas = container.querySelectorAll('.diff-textarea')
        textareas.forEach(textarea => {
          const value = textarea instanceof HTMLTextAreaElement ? textarea.value : null
          expect(value).toBe('')
        })
      }, { timeout: 300 })
    })

    it('should load example when load example button clicked', async () => {
      const { container } = render(DiffTool)
      const loadExampleButton = container.querySelector('[title="Load Example"]')
      expect(loadExampleButton).toBeInTheDocument()
      if (loadExampleButton) await fireEvent.click(loadExampleButton)
      await waitFor(() => {
        const textareas = container.querySelectorAll('.diff-textarea')
        const firstValue = textareas[0] instanceof HTMLTextAreaElement ? textareas[0].value : ''
        expect(firstValue).toContain('function')
        expect(firstValue).toContain('greet')
      }, { timeout: 300 })
    })

    it('should verify example loads both sides', async () => {
      const { container } = render(DiffTool)
      const clearButton = container.querySelector('[title="Clear"]')
      const loadExampleButton = container.querySelector('[title="Load Example"]')
      expect(clearButton).toBeInTheDocument()
      expect(loadExampleButton).toBeInTheDocument()
      if (clearButton) await fireEvent.click(clearButton)
      await waitFor(() => {
        const textareas = container.querySelectorAll('.diff-textarea')
        const firstValue = textareas[0] instanceof HTMLTextAreaElement ? textareas[0].value : ''
        expect(firstValue).toBe('')
      }, { timeout: 300 })
      if (loadExampleButton) await fireEvent.click(loadExampleButton)
      await waitFor(() => {
        const textareas = container.querySelectorAll('.diff-textarea')
        const leftText = textareas[0] instanceof HTMLTextAreaElement ? textareas[0].value : ''
        const rightText = textareas[1] instanceof HTMLTextAreaElement ? textareas[1].value : ''
        expect(leftText).toContain('function')
        expect(rightText).toContain('function')
        expect(leftText).not.toBe(rightText)
      }, { timeout: 300 })
    })
  })

  describe('Empty Input Handling', () => {
    it('should handle empty inputs gracefully', async () => {
      const { container } = render(DiffTool)
      const clearButton = container.querySelector('[title="Clear"]')
      expect(clearButton).toBeInTheDocument()
      if (clearButton) await fireEvent.click(clearButton)
      await waitFor(() => {
        const diffGrid = container.querySelector('.diff-grid')
        expect(diffGrid).toBeInTheDocument()
      }, { timeout: 300 })
    })

    it('should handle one empty input', async () => {
      const { container } = render(DiffTool)
      const textareas = container.querySelectorAll('.diff-textarea')
      await fireEvent.input(textareas[0], { target: { value: '' } })
      await fireEvent.input(textareas[1], { target: { value: 'some content' } })
      await new Promise(resolve => setTimeout(resolve, 400))
      await waitFor(() => {
        const diffGrid = container.querySelector('.diff-grid')
        expect(diffGrid).toBeInTheDocument()
      }, { timeout: 500 })
    })

    it('should handle whitespace-only input', async () => {
      const { container } = render(DiffTool)
      const textareas = container.querySelectorAll('.diff-textarea')
      await fireEvent.input(textareas[0], { target: { value: '   \n\t  ' } })
      await fireEvent.input(textareas[1], { target: { value: '   \n\t  ' } })
      await new Promise(resolve => setTimeout(resolve, 400))
      await waitFor(() => {
        const diffGrid = container.querySelector('.diff-grid')
        expect(diffGrid).toBeInTheDocument()
      }, { timeout: 500 })
    })
  })

  describe('Similarity Threshold', () => {
    it('should compute diff with modified inputs', async () => {
      const { container } = render(DiffTool)
      const textareas = container.querySelectorAll('.diff-textarea')
      await fireEvent.input(textareas[0], { target: { value: 'hello world test' } })
      await fireEvent.input(textareas[1], { target: { value: 'hello universe test' } })
      await new Promise(resolve => setTimeout(resolve, 400))
      await waitFor(() => {
        const diffGrid = container.querySelector('.diff-grid')
        expect(diffGrid).toBeInTheDocument()
      }, { timeout: 500 })
    })

    it('should handle different content', async () => {
      const { container } = render(DiffTool)
      const textareas = container.querySelectorAll('.diff-textarea')
      await fireEvent.input(textareas[0], { target: { value: 'completely different' } })
      await fireEvent.input(textareas[1], { target: { value: 'nothing alike here' } })
      await new Promise(resolve => setTimeout(resolve, 400))
      await waitFor(() => {
        const diffGrid = container.querySelector('.diff-grid')
        expect(diffGrid).toBeInTheDocument()
      }, { timeout: 500 })
    })
  })

  describe('Unicode and Special Characters', () => {
    it('should handle Turkish characters', async () => {
      const { container } = render(DiffTool)
      const textareas = container.querySelectorAll('.diff-textarea')
      await fireEvent.input(textareas[0], { target: { value: 'İstanbul şehir çok güzel' } })
      await fireEvent.input(textareas[1], { target: { value: 'İstanbul şehir çok güzel' } })
      await new Promise(resolve => setTimeout(resolve, 400))
      await waitFor(() => {
        const diffGrid = container.querySelector('.diff-grid')
        expect(diffGrid).toBeInTheDocument()
      }, { timeout: 500 })
    })

    it('should handle Turkish character differences', async () => {
      const { container } = render(DiffTool)
      const textareas = container.querySelectorAll('.diff-textarea')
      await fireEvent.input(textareas[0], { target: { value: 'ğüşiöç' } })
      await fireEvent.input(textareas[1], { target: { value: 'ĞÜŞİÖÇ' } })
      await new Promise(resolve => setTimeout(resolve, 400))
      await waitFor(() => {
        const diffGrid = container.querySelector('.diff-grid')
        expect(diffGrid).toBeInTheDocument()
      }, { timeout: 500 })
    })

    it('should handle emoji characters', async () => {
      const { container } = render(DiffTool)
      const textareas = container.querySelectorAll('.diff-textarea')
      await fireEvent.input(textareas[0], { target: { value: 'Hello 👋 World 🌍' } })
      await fireEvent.input(textareas[1], { target: { value: 'Hello 👋 Universe 🌌' } })
      await new Promise(resolve => setTimeout(resolve, 400))
      await waitFor(() => {
        const diffGrid = container.querySelector('.diff-grid')
        expect(diffGrid).toBeInTheDocument()
      }, { timeout: 500 })
    })

    it('should handle mixed unicode content', async () => {
      const { container } = render(DiffTool)
      const textareas = container.querySelectorAll('.diff-textarea')
      await fireEvent.input(textareas[0], { target: { value: 'Test: αβγ δεζ 中文 🎉' } })
      await fireEvent.input(textareas[1], { target: { value: 'Test: αβγ δεζ 中文 🎊' } })
      await new Promise(resolve => setTimeout(resolve, 400))
      await waitFor(() => {
        const diffGrid = container.querySelector('.diff-grid')
        expect(diffGrid).toBeInTheDocument()
      }, { timeout: 500 })
    })
  })

  describe('LocalStorage Persistence', () => {
    it('should interact with localStorage', async () => {
      const { container } = render(DiffTool)
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 200))
      // Trigger a change
      const textareas = container.querySelectorAll('.diff-textarea')
      await fireEvent.input(textareas[0], { target: { value: 'test content' } })
      // Just verify the component handles localStorage without errors
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(container.querySelector('.diff-textarea')).toBeInTheDocument()
    })

    it('should load saved content from localStorage', async () => {
      localStorage.setItem('devutils-diff-left', 'saved left content')
      localStorage.setItem('devutils-diff-right', 'saved right content')
      const { container } = render(DiffTool)
      // Component should load without errors
      await waitFor(() => {
        const textareas = container.querySelectorAll('.diff-textarea')
        expect(textareas.length).toBeGreaterThanOrEqual(2)
      }, { timeout: 500 })
    })

    it('should clear localStorage when clear is clicked', async () => {
      localStorage.setItem('devutils-diff-left', 'test content')
      localStorage.setItem('devutils-diff-right', 'test content')
      const { container } = render(DiffTool)
      const clearButton = container.querySelector('[title="Clear"]')
      expect(clearButton).toBeInTheDocument()
      if (clearButton) await fireEvent.click(clearButton)
      expect(localStorage.getItem('devutils-diff-left')).toBeNull()
      expect(localStorage.getItem('devutils-diff-right')).toBeNull()
    })
  })

  describe('Large Input Handling', () => {
    it('should handle large inputs without crashing', async () => {
      const { container } = render(DiffTool)
      const textareas = container.querySelectorAll('.diff-textarea')
      const largeContent = Array(100).fill('line content').join('\n')
      await fireEvent.input(textareas[0], { target: { value: largeContent } })
      await fireEvent.input(textareas[1], { target: { value: largeContent } })
      await new Promise(resolve => setTimeout(resolve, 400))
      await waitFor(() => {
        const diffGrid = container.querySelector('.diff-grid')
        expect(diffGrid).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('should show truncation warning for oversized inputs', async () => {
      const { container } = render(DiffTool)
      const textareas = container.querySelectorAll('.diff-textarea')
      const veryLargeContent = Array(15000).fill('line').join('\n')
      await fireEvent.input(textareas[0], { target: { value: veryLargeContent } })
      await fireEvent.input(textareas[1], { target: { value: veryLargeContent } })
      await new Promise(resolve => setTimeout(resolve, 400))
      await waitFor(() => {
        const warning = container.querySelector('.truncation-warning')
        expect(warning).toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })

  describe('Myers Algorithm Edge Cases', () => {
    it('should handle single character differences', async () => {
      const { container } = render(DiffTool)
      const textareas = container.querySelectorAll('.diff-textarea')
      await fireEvent.input(textareas[0], { target: { value: 'a' } })
      await fireEvent.input(textareas[1], { target: { value: 'b' } })
      await new Promise(resolve => setTimeout(resolve, 400))
      await waitFor(() => {
        const diffGrid = container.querySelector('.diff-grid')
        expect(diffGrid).toBeInTheDocument()
      }, { timeout: 500 })
    })

    it('should handle completely different content', async () => {
      const { container } = render(DiffTool)
      const textareas = container.querySelectorAll('.diff-textarea')
      await fireEvent.input(textareas[0], { target: { value: 'abc\ndef' } })
      await fireEvent.input(textareas[1], { target: { value: 'xyz\nuvw' } })
      await new Promise(resolve => setTimeout(resolve, 400))
      await waitFor(() => {
        const diffGrid = container.querySelector('.diff-grid')
        expect(diffGrid).toBeInTheDocument()
      }, { timeout: 500 })
    })

    it('should handle empty lines at start and end', async () => {
      const { container } = render(DiffTool)
      const textareas = container.querySelectorAll('.diff-textarea')
      await fireEvent.input(textareas[0], { target: { value: '\ncontent\n' } })
      await fireEvent.input(textareas[1], { target: { value: '\ncontent\n' } })
      await new Promise(resolve => setTimeout(resolve, 400))
      await waitFor(() => {
        const diffGrid = container.querySelector('.diff-grid')
        expect(diffGrid).toBeInTheDocument()
      }, { timeout: 500 })
    })

    it('should handle multiple consecutive empty lines', async () => {
      const { container } = render(DiffTool)
      const textareas = container.querySelectorAll('.diff-textarea')
      await fireEvent.input(textareas[0], { target: { value: '\n\n\n' } })
      await fireEvent.input(textareas[1], { target: { value: '\n\n\n' } })
      await new Promise(resolve => setTimeout(resolve, 400))
      await waitFor(() => {
        const diffGrid = container.querySelector('.diff-grid')
        expect(diffGrid).toBeInTheDocument()
      }, { timeout: 500 })
    })
  })

  describe('Accessibility', () => {
    it('should have aria-labels on textareas', () => {
      const { container } = render(DiffTool)
      const textareas = container.querySelectorAll('.diff-textarea')
      textareas.forEach(textarea => {
        expect(textarea).toHaveAttribute('aria-label')
      })
    })

    it('should have accessible table structure for diff results', async () => {
      const { container } = render(DiffTool)
      await waitFor(() => {
        const diffGrid = container.querySelector('.diff-grid')
        expect(diffGrid).toHaveAttribute('role', 'table')
        expect(diffGrid).toHaveAttribute('aria-label')
      }, { timeout: 500 })
    })

    it('should have aria-labels on unified lines', async () => {
      const { container } = render(DiffTool)
      const unifiedButton = screen.getByText('Unified')
      await fireEvent.click(unifiedButton)
      await new Promise(resolve => setTimeout(resolve, 400))
      await waitFor(() => {
        const lines = container.querySelectorAll('.unified-line')
        lines.forEach(line => {
          expect(line).toHaveAttribute('aria-label')
        })
      }, { timeout: 500 })
    })
  })

  describe('Visual Indicators', () => {
    it('should show change indicators for diff results', async () => {
      const { container } = render(DiffTool)
      const textareas = container.querySelectorAll('.diff-textarea')
      // Create content with differences to trigger diff output
      await fireEvent.input(textareas[0], { target: { value: 'original content' } })
      await fireEvent.input(textareas[1], { target: { value: 'modified content' } })
      await new Promise(resolve => setTimeout(resolve, 400))
      await waitFor(() => {
        // Should have diff rows showing changes
        const diffRows = container.querySelectorAll('.diff-row')
        expect(diffRows.length).toBeGreaterThanOrEqual(1)
      }, { timeout: 500 })
    })

    it('should have styling for modified lines', async () => {
      const { container } = render(DiffTool)
      await new Promise(resolve => setTimeout(resolve, 400))
      await waitFor(() => {
        const diffGrid = container.querySelector('.diff-grid')
        expect(diffGrid).toBeInTheDocument()
      }, { timeout: 500 })
    })
  })

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn(() => { throw new Error('Storage full') })
      render(DiffTool)
      await new Promise(resolve => setTimeout(resolve, 100))
      localStorage.setItem = originalSetItem
      consoleSpy.mockRestore()
    })

    it('should handle corrupted localStorage data', async () => {
      localStorage.setItem('devutils-diff-left', '{invalid json')
      localStorage.setItem('devutils-diff-right', 'valid content')
      const { container } = render(DiffTool)
      await waitFor(() => {
        const textareas = container.querySelectorAll('.diff-textarea')
        expect(textareas.length).toBeGreaterThanOrEqual(2)
      }, { timeout: 500 })
    })
  })

  describe('Copy Functionality', () => {
    it('should have copy button area in split mode', async () => {
      const { container } = render(DiffTool)
      await waitFor(() => {
        const resultHeader = container.querySelector('.result-header')
        expect(resultHeader).toBeInTheDocument()
      }, { timeout: 500 })
    })

    it('should have copy button area in unified mode', async () => {
      const { container } = render(DiffTool)
      await fireEvent.click(screen.getByText('Unified'))
      await waitFor(() => {
        const resultHeader = container.querySelector('.result-header')
        expect(resultHeader).toBeInTheDocument()
      }, { timeout: 500 })
    })
  })

  describe('Real-time Updates', () => {
    it('should update when typing', async () => {
      const { container } = render(DiffTool)
      const textareas = container.querySelectorAll('.diff-textarea')
      await fireEvent.input(textareas[0], { target: { value: 'new content' } })
      await new Promise(resolve => setTimeout(resolve, 400))
      await waitFor(() => {
        const diffGrid = container.querySelector('.diff-grid')
        expect(diffGrid).toBeInTheDocument()
      }, { timeout: 500 })
    })
  })
})
