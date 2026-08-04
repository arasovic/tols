import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/svelte'
import { tick } from 'svelte'
import BaseConverterTool from '$lib/tools/BaseConverterTool.svelte'

/** @param {HTMLElement} el */
function getValue(el) {
  return /** @type {HTMLInputElement} */ (el).value
}

/** Flush all pending promises */
function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

describe('BaseConverterTool', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    cleanup()
  })

  it('should initialize with tool header', () => {
    render(BaseConverterTool)
    expect(screen.getByText('Number Base Converter')).toBeInTheDocument()
  })

  it('should have all base inputs', () => {
    render(BaseConverterTool)

    expect(screen.getByLabelText('Decimal number input')).toBeInTheDocument()
    expect(screen.getByLabelText('Binary number input')).toBeInTheDocument()
    expect(screen.getByLabelText('Hexadecimal number input')).toBeInTheDocument()
    expect(screen.getByLabelText('Octal number input')).toBeInTheDocument()
  })

  it('should convert decimal to other bases', async () => {
    render(BaseConverterTool)

    const decimalInput = screen.getByLabelText('Decimal number input')
    await fireEvent.input(decimalInput, { target: { value: '255' } })

    vi.advanceTimersByTime(400)
    await waitFor(() => {
      const binaryInput = screen.getByLabelText('Binary number input')
      expect(getValue(binaryInput)).toBe('11111111')

      const hexInput = screen.getByLabelText('Hexadecimal number input')
      expect(getValue(hexInput)).toBe('FF')

      const octalInput = screen.getByLabelText('Octal number input')
      expect(getValue(octalInput)).toBe('377')
    })
  })

  it('should convert binary to other bases', async () => {
    render(BaseConverterTool)

    const binaryInput = screen.getByLabelText('Binary number input')
    await fireEvent.input(binaryInput, { target: { value: '1010' } })

    vi.advanceTimersByTime(400)
    await waitFor(() => {
      const decimalInput = screen.getByLabelText('Decimal number input')
      expect(getValue(decimalInput)).toBe('10')
    })
  })

  it('should convert hex to other bases', async () => {
    render(BaseConverterTool)

    const hexInput = screen.getByLabelText('Hexadecimal number input')
    await fireEvent.input(hexInput, { target: { value: 'FF' } })

    vi.advanceTimersByTime(400)
    await waitFor(() => {
      const decimalInput = screen.getByLabelText('Decimal number input')
      expect(getValue(decimalInput)).toBe('255')
    })
  })

  it('should convert octal to other bases', async () => {
    render(BaseConverterTool)

    const octalInput = screen.getByLabelText('Octal number input')
    await fireEvent.input(octalInput, { target: { value: '377' } })

    vi.advanceTimersByTime(400)
    await waitFor(() => {
      const decimalInput = screen.getByLabelText('Decimal number input')
      expect(getValue(decimalInput)).toBe('255')
    })
  })

  it('should convert negative decimal to other bases', async () => {
    render(BaseConverterTool)

    const decimalInput = screen.getByLabelText('Decimal number input')
    await fireEvent.input(decimalInput, { target: { value: '-255' } })

    vi.advanceTimersByTime(400)
    await waitFor(() => {
      const binaryInput = screen.getByLabelText('Binary number input')
      expect(getValue(binaryInput)).toBe('-11111111')

      const hexInput = screen.getByLabelText('Hexadecimal number input')
      expect(getValue(hexInput)).toBe('-FF')

      const octalInput = screen.getByLabelText('Octal number input')
      expect(getValue(octalInput)).toBe('-377')
    })
  })

  it('should clear all fields when clear button clicked', async () => {
    render(BaseConverterTool)

    const clearButton = screen.getByLabelText('Clear all fields')
    await fireEvent.click(clearButton)

    const inputs = [
      screen.getByLabelText('Decimal number input'),
      screen.getByLabelText('Binary number input'),
      screen.getByLabelText('Hexadecimal number input'),
      screen.getByLabelText('Octal number input')
    ]
    inputs.forEach(input => {
      expect(getValue(input)).toBe('')
    })
  })

  it('should clear other fields when one field is cleared', async () => {
    render(BaseConverterTool)

    const decimalInput = screen.getByLabelText('Decimal number input')
    await fireEvent.input(decimalInput, { target: { value: '255' } })

    vi.advanceTimersByTime(400)
    await waitFor(() => {
      expect(getValue(screen.getByLabelText('Binary number input'))).toBe('11111111')
    })

    await fireEvent.input(decimalInput, { target: { value: '' } })

    vi.advanceTimersByTime(400)
    await waitFor(() => {
      expect(getValue(screen.getByLabelText('Binary number input'))).toBe('')
      expect(getValue(screen.getByLabelText('Hexadecimal number input'))).toBe('')
      expect(getValue(screen.getByLabelText('Octal number input'))).toBe('')
    })
  })

  it('should load example when load example button clicked', async () => {
    render(BaseConverterTool)

    const loadExampleButton = screen.getByLabelText('Load example value')
    await fireEvent.click(loadExampleButton)

    const decimalInput = screen.getByLabelText('Decimal number input')
    expect(getValue(decimalInput)).toBe('255')
  })

  it('should have quick conversion buttons', () => {
    render(BaseConverterTool)

    expect(screen.getByText('255')).toBeInTheDocument()
    expect(screen.getByText('1024')).toBeInTheDocument()
    expect(screen.getByText('4096')).toBeInTheDocument()
    expect(screen.getByText('65535')).toBeInTheDocument()
  })

  it('should convert when quick button clicked', async () => {
    render(BaseConverterTool)

    const quickButton = screen.getByLabelText('Load 1024 as decimal value')
    await fireEvent.click(quickButton)

    const decimalInput = screen.getByLabelText('Decimal number input')
    expect(getValue(decimalInput)).toBe('1024')
  })

  it('should show error for invalid binary characters', async () => {
    render(BaseConverterTool)

    const binaryInput = screen.getByLabelText('Binary number input')
    await fireEvent.input(binaryInput, { target: { value: '102' } })

    vi.advanceTimersByTime(400)
    await waitFor(() => {
      const errorElement = screen.getByRole('alert')
      expect(errorElement).toBeInTheDocument()
      expect(errorElement.textContent).toContain('contain')
    })
  })

  it('should show error for invalid octal characters', async () => {
    render(BaseConverterTool)

    const octalInput = screen.getByLabelText('Octal number input')
    await fireEvent.input(octalInput, { target: { value: '89' } })

    vi.advanceTimersByTime(400)
    await waitFor(() => {
      const errorElement = screen.getByRole('alert')
      expect(errorElement).toBeInTheDocument()
      expect(errorElement.textContent).toContain('contain')
    })
  })

  it('should show error for invalid hex characters', async () => {
    render(BaseConverterTool)

    const hexInput = screen.getByLabelText('Hexadecimal number input')
    await fireEvent.input(hexInput, { target: { value: 'GHI' } })

    vi.advanceTimersByTime(400)
    await waitFor(() => {
      const errorElement = screen.getByRole('alert')
      expect(errorElement).toBeInTheDocument()
      expect(errorElement.textContent).toContain('contain')
    })
  })

  it('should show error for numbers exceeding MAX_SAFE_INTEGER', async () => {
    render(BaseConverterTool)

    const decimalInput = screen.getByLabelText('Decimal number input')
    await fireEvent.input(decimalInput, { target: { value: '9007199254740992' } })

    vi.advanceTimersByTime(400)
    await waitFor(() => {
      const errorElement = screen.getByRole('alert')
      expect(errorElement).toBeInTheDocument()
      expect(errorElement.textContent).toContain('maximum safe integer')
    })
  })

  it('should handle lowercase hex input', async () => {
    render(BaseConverterTool)

    const hexInput = screen.getByLabelText('Hexadecimal number input')
    await fireEvent.input(hexInput, { target: { value: 'ff' } })

    vi.advanceTimersByTime(400)
    await waitFor(() => {
      const decimalInput = screen.getByLabelText('Decimal number input')
      expect(getValue(decimalInput)).toBe('255')
      expect(getValue(hexInput).toUpperCase()).toBe('FF')
    })
  })

  it('should clear timeouts on component unmount', async () => {
    const { unmount } = render(BaseConverterTool)

    const decimalInput = screen.getByLabelText('Decimal number input')
    await fireEvent.input(decimalInput, { target: { value: '100' } })

    unmount()

    vi.advanceTimersByTime(1000)

    const pendingTimers = vi.getTimerCount()
    expect(pendingTimers).toBe(0)
  })

  it('should save and restore state from localStorage', async () => {
    localStorage.setItem('devutils-base-decimal', '456')

    render(BaseConverterTool)

    await flushPromises()
    await tick()

    const restoredInput = screen.getByLabelText('Decimal number input')
    expect(getValue(restoredInput)).toBe('456')
  })

  it('should handle special characters gracefully', async () => {
    render(BaseConverterTool)

    const decimalInput = screen.getByLabelText('Decimal number input')
    await fireEvent.input(decimalInput, { target: { value: '!@#$%' } })

    vi.advanceTimersByTime(400)
    await waitFor(() => {
      const errorElement = screen.getByRole('alert')
      expect(errorElement).toBeInTheDocument()
      expect(errorElement.textContent).toContain('Invalid')
    })
  })

  it('should trim whitespace from inputs', async () => {
    render(BaseConverterTool)

    const decimalInput = screen.getByLabelText('Decimal number input')
    await fireEvent.input(decimalInput, { target: { value: '  255  ' } })

    vi.advanceTimersByTime(400)
    await waitFor(() => {
      const binaryInput = screen.getByLabelText('Binary number input')
      expect(getValue(binaryInput)).toBe('11111111')
    })
  })

  it('should convert zero correctly', async () => {
    render(BaseConverterTool)

    const decimalInput = screen.getByLabelText('Decimal number input')
    await fireEvent.input(decimalInput, { target: { value: '0' } })

    vi.advanceTimersByTime(400)
    await waitFor(() => {
      const binaryInput = screen.getByLabelText('Binary number input')
      expect(getValue(binaryInput)).toBe('0')

      const hexInput = screen.getByLabelText('Hexadecimal number input')
      expect(getValue(hexInput)).toBe('0')

      const octalInput = screen.getByLabelText('Octal number input')
      expect(getValue(octalInput)).toBe('0')
    })
  })

  it('should save decimal value to localStorage', async () => {
    render(BaseConverterTool)

    const decimalInput = screen.getByLabelText('Decimal number input')
    await fireEvent.input(decimalInput, { target: { value: '42' } })

    vi.advanceTimersByTime(600)
    await waitFor(() => {
      expect(localStorage.getItem('devutils-base-decimal')).toBe('42')
    })
  })

  it('should remove localStorage entry when cleared', async () => {
    localStorage.setItem('devutils-base-decimal', '123')

    render(BaseConverterTool)

    const clearButton = screen.getByLabelText('Clear all fields')
    await fireEvent.click(clearButton)

    vi.advanceTimersByTime(600)

    expect(localStorage.getItem('devutils-base-decimal')).toBeNull()
  })

  it('should have proper accessibility attributes', () => {
    render(BaseConverterTool)

    expect(screen.getByLabelText('Load example value')).toBeInTheDocument()
    expect(screen.getByLabelText('Clear all fields')).toBeInTheDocument()

    const inputs = [
      screen.getByLabelText('Decimal number input'),
      screen.getByLabelText('Binary number input'),
      screen.getByLabelText('Hexadecimal number input'),
      screen.getByLabelText('Octal number input')
    ]
    inputs.forEach(input => {
      expect(input).toHaveAttribute('aria-label')
    })
  })
})
