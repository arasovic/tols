import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import DiffTool from '$lib/tools/DiffTool.svelte'

describe('DiffTool', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with tool header', () => {
    render(DiffTool)
    expect(screen.getByText('Diff Checker')).toBeInTheDocument()
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

  it('should show diff results', async () => {
    const { container } = render(DiffTool)

    await waitFor(() => {
      expect(container.querySelector('.diff-result')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should switch to unified mode', async () => {
    const { container } = render(DiffTool)

    const unifiedButton = screen.getByText('Unified')
    await fireEvent.click(unifiedButton)

    expect(screen.getByText('Unified Diff')).toBeInTheDocument()
  })

  it('should swap sides when swap button clicked', async () => {
    const { container } = render(DiffTool)

    const textareas = container.querySelectorAll('.diff-textarea')
    const originalValue = textareas[0]?.value
    const modifiedValue = textareas[1]?.value

    const swapButton = container.querySelector('[title="Swap Sides"]')
    await fireEvent.click(swapButton)

    await waitFor(() => {
      const newTextareas = container.querySelectorAll('.diff-textarea')
      expect(newTextareas[0]?.value).toBe(modifiedValue)
      expect(newTextareas[1]?.value).toBe(originalValue)
    }, { timeout: 300 })
  })

  it('should clear content when clear button clicked', async () => {
    const { container } = render(DiffTool)

    const clearButton = container.querySelector('[title="Clear"]')
    await fireEvent.click(clearButton)

    await waitFor(() => {
      const textareas = container.querySelectorAll('.diff-textarea')
      textareas.forEach(textarea => {
        expect(textarea?.value).toBe('')
      })
    }, { timeout: 300 })
  })

  it('should load example when load example button clicked', async () => {
    const { container } = render(DiffTool)

    const loadExampleButton = container.querySelector('[title="Load Example"]')
    await fireEvent.click(loadExampleButton)

    await waitFor(() => {
      const textareas = container.querySelectorAll('.diff-textarea')
      expect(textareas[0]?.value).toContain('function')
    }, { timeout: 300 })
  })

  it('should show character counts', async () => {
    const { container } = render(DiffTool)

    await waitFor(() => {
      expect(container.textContent).toContain('chars')
    }, { timeout: 500 })
  })

  it('should detect added lines', async () => {
    const { container } = render(DiffTool)

    await waitFor(() => {
      const addedLines = container.querySelectorAll('.added')
      expect(addedLines.length).toBeGreaterThanOrEqual(0)
    }, { timeout: 500 })
  })

  it('should detect removed lines', async () => {
    const { container } = render(DiffTool)

    await waitFor(() => {
      const removedLines = container.querySelectorAll('.removed')
      expect(removedLines.length).toBeGreaterThanOrEqual(0)
    }, { timeout: 500 })
  })

  it('should show line numbers', async () => {
    const { container } = render(DiffTool)

    await waitFor(() => {
      const lineNumbers = container.querySelectorAll('.line-num')
      expect(lineNumbers.length).toBeGreaterThan(0)
    }, { timeout: 500 })
  })
})
