import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import BarcodeTool from '$lib/tools/BarcodeTool.svelte'

function waitForDebounce(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('BarcodeTool', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with tool header', () => {
    render(BarcodeTool)
    expect(screen.getByText('Barcode Generator')).toBeInTheDocument()
  })

  it('should have text input and type selector', () => {
    const { container } = render(BarcodeTool)

    expect(screen.getByText('Text to encode')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(container.querySelector('canvas')).toBeInTheDocument()
  })

  it('should generate barcode on mount', async () => {
    const { container } = render(BarcodeTool)

    await waitFor(() => {
      expect(container.querySelector('canvas')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should clear content when clear button clicked', async () => {
    const { container } = render(BarcodeTool)

    const clearButton = container.querySelector('[title="Clear"]')
    await fireEvent.click(clearButton)

    const textInput = container.querySelector('input[type="text"]')
    expect(textInput?.value).toBe('')
  })

  it('should load example when load example button clicked', async () => {
    const { container } = render(BarcodeTool)

    const loadExampleButton = container.querySelector('[title="Load Example"]')
    await fireEvent.click(loadExampleButton)

    const textInput = container.querySelector('input[type="text"]')
    expect(textInput?.value).toBe('CODE128')
  })

  it('should show download button when text is present', async () => {
    render(BarcodeTool)

    await waitFor(() => {
      expect(screen.getByText('Download PNG')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should have CODE128 as default type', () => {
    const { container } = render(BarcodeTool)

    const select = container.querySelector('select')
    expect(select?.value).toBe('CODE128')
  })

  it('should handle numeric input', async () => {
    const { container } = render(BarcodeTool)

    const textInput = container.querySelector('input[type="text"]')
    await fireEvent.input(textInput, { target: { value: '1234567890' } })

    await waitForDebounce(300)

    expect(container.querySelector('canvas')).toBeInTheDocument()
  })

  it('should handle alphanumeric input', async () => {
    const { container } = render(BarcodeTool)

    const textInput = container.querySelector('input[type="text"]')
    await fireEvent.input(textInput, { target: { value: 'ABC123def' } })

    await waitForDebounce(300)

    expect(container.querySelector('canvas')).toBeInTheDocument()
  })
})
