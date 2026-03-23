import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import BaseConverterTool from '$lib/tools/BaseConverterTool.svelte'

function waitForDebounce(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('BaseConverterTool', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with tool header', () => {
    render(BaseConverterTool)
    expect(screen.getByText('Number Base Converter')).toBeInTheDocument()
  })

  it('should have all base inputs', () => {
    render(BaseConverterTool)

    expect(screen.getByText('Decimal')).toBeInTheDocument()
    expect(screen.getByText('Binary')).toBeInTheDocument()
    expect(screen.getByText('Hexadecimal')).toBeInTheDocument()
    expect(screen.getByText('Octal')).toBeInTheDocument()
  })

  it('should convert decimal to other bases', async () => {
    const { container } = render(BaseConverterTool)

    const decimalInput = container.querySelectorAll('.base-card input')[0]
    await fireEvent.input(decimalInput, { target: { value: '255' } })

    await waitForDebounce(400)

    const binaryInput = container.querySelectorAll('.base-card input')[1]
    expect(binaryInput?.value).toBe('11111111')

    const hexInput = container.querySelectorAll('.base-card input')[2]
    expect(hexInput?.value).toBe('FF')

    const octalInput = container.querySelectorAll('.base-card input')[3]
    expect(octalInput?.value).toBe('377')
  })

  it('should convert binary to other bases', async () => {
    const { container } = render(BaseConverterTool)

    const binaryInput = container.querySelectorAll('.base-card input')[1]
    await fireEvent.input(binaryInput, { target: { value: '1010' } })

    await waitForDebounce(400)

    const decimalInput = container.querySelectorAll('.base-card input')[0]
    expect(decimalInput?.value).toBe('10')
  })

  it('should convert hex to other bases', async () => {
    const { container } = render(BaseConverterTool)

    const hexInput = container.querySelectorAll('.base-card input')[2]
    await fireEvent.input(hexInput, { target: { value: 'FF' } })

    await waitForDebounce(400)

    const decimalInput = container.querySelectorAll('.base-card input')[0]
    expect(decimalInput?.value).toBe('255')
  })

  it('should convert octal to other bases', async () => {
    const { container } = render(BaseConverterTool)

    const octalInput = container.querySelectorAll('.base-card input')[3]
    await fireEvent.input(octalInput, { target: { value: '377' } })

    await waitForDebounce(400)

    const decimalInput = container.querySelectorAll('.base-card input')[0]
    expect(decimalInput?.value).toBe('255')
  })

  it('should clear all fields when clear button clicked', async () => {
    const { container } = render(BaseConverterTool)

    const clearButton = container.querySelector('[title="Clear"]')
    await fireEvent.click(clearButton)

    const inputs = container.querySelectorAll('.base-card input')
    inputs.forEach(input => {
      expect(input?.value).toBe('')
    })
  })

  it('should load example when load example button clicked', async () => {
    const { container } = render(BaseConverterTool)

    const loadExampleButton = container.querySelector('[title="Load Example"]')
    await fireEvent.click(loadExampleButton)

    const decimalInput = container.querySelectorAll('.base-card input')[0]
    expect(decimalInput?.value).toBe('255')
  })

  it('should have quick conversion buttons', () => {
    render(BaseConverterTool)

    expect(screen.getByText('255')).toBeInTheDocument()
    expect(screen.getByText('1024')).toBeInTheDocument()
    expect(screen.getByText('4096')).toBeInTheDocument()
    expect(screen.getByText('65535')).toBeInTheDocument()
  })

  it('should convert when quick button clicked', async () => {
    const { container } = render(BaseConverterTool)

    const quickButton = screen.getByText('1024')
    await fireEvent.click(quickButton)

    const decimalInput = container.querySelectorAll('.base-card input')[0]
    expect(decimalInput?.value).toBe('1024')
  })

  it('should handle invalid input gracefully', async () => {
    const { container } = render(BaseConverterTool)

    const binaryInput = container.querySelectorAll('.base-card input')[1]
    await fireEvent.input(binaryInput, { target: { value: 'invalid' } })

    await waitForDebounce(400)

    // Should show error state for invalid binary
    const errorElement = container.querySelector('.error-state')
    expect(errorElement).toBeInTheDocument()
    expect(errorElement?.textContent).toContain('Invalid')
  })

  it('should save decimal value to localStorage', async () => {
    render(BaseConverterTool)

    await waitFor(() => {
      expect(localStorage.getItem('devutils-base-decimal')).toBeTruthy()
    }, { timeout: 700 })
  })
})
