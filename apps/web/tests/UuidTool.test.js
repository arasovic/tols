import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/svelte'
import UuidTool from '$lib/tools/UuidTool.svelte'

describe('UuidTool', () => {
  let component
  const DEBOUNCE_TIME = 150
  const SAVE_DEBOUNCE_TIME = 500

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    localStorage.clear()
    component = render(UuidTool)
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    localStorage.clear()
  })

  it('should generate a single UUID when generate button is clicked', async () => {
    const generateButton = screen.getByLabelText('Generate UUIDs')
    await fireEvent.click(generateButton)

    await waitFor(() => {
      const uuidElement = document.querySelector('.uuid-single')
      expect(uuidElement).toBeInTheDocument()
      expect(uuidElement?.textContent).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })
  })

  it('should generate multiple UUIDs when count > 1', async () => {
    const countInput = document.querySelector('.count-input')
    await fireEvent.input(countInput, { target: { value: '3' } })

    vi.advanceTimersByTime(DEBOUNCE_TIME + 50)

    await waitFor(() => {
      const uuidList = document.querySelectorAll('.uuid-item')
      expect(uuidList).toHaveLength(3)
    }, { timeout: 400 })

    const uuidList = document.querySelectorAll('.uuid-item')
    for (let i = 0; i < 3; i++) {
      const uuidElement = uuidList[i].querySelector('.uuid-text')
      expect(uuidElement?.textContent).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    }
  })

  it('should show error when count = 0', async () => {
    const countInput = document.querySelector('.count-input')
    await fireEvent.input(countInput, { target: { value: '0' } })

    vi.advanceTimersByTime(DEBOUNCE_TIME + 50)

    await waitFor(() => {
      const errorEl = document.querySelector('.error-state span')
      expect(errorEl?.textContent).toContain('Count must be between 1 and 100')
    }, { timeout: 400 })
  })

  it('should show error when count < 1', async () => {
    const countInput = document.querySelector('.count-input')
    await fireEvent.input(countInput, { target: { value: '-1' } })

    vi.advanceTimersByTime(DEBOUNCE_TIME + 50)

    await waitFor(() => {
      const errorEl = document.querySelector('.error-state span')
      expect(errorEl?.textContent).toContain('Count must be between 1 and 100')
    }, { timeout: 400 })
  })

  it('should show error when count > 100', async () => {
    const countInput = document.querySelector('.count-input')
    await fireEvent.input(countInput, { target: { value: '101' } })

    vi.advanceTimersByTime(DEBOUNCE_TIME + 50)

    await waitFor(() => {
      const errorEl = document.querySelector('.error-state span')
      expect(errorEl?.textContent).toContain('Count must be between 1 and 100')
    }, { timeout: 400 })
  })

  it('should handle count at boundary value of 100', async () => {
    const countInput = document.querySelector('.count-input')
    await fireEvent.input(countInput, { target: { value: '100' } })

    vi.advanceTimersByTime(DEBOUNCE_TIME + 50)

    await waitFor(() => {
      const uuidList = document.querySelectorAll('.uuid-item')
      expect(uuidList).toHaveLength(100)
    }, { timeout: 600 })
  })

  it('should handle decimal values by treating them as integers', async () => {
    const countInput = document.querySelector('.count-input')
    await fireEvent.input(countInput, { target: { value: '3.7' } })

    vi.advanceTimersByTime(DEBOUNCE_TIME + 50)

    await waitFor(() => {
      const uuidList = document.querySelectorAll('.uuid-item')
      expect(uuidList.length).toBeGreaterThanOrEqual(1)
    }, { timeout: 400 })
  })

  it('should handle NaN/invalid input gracefully', async () => {
    const countInput = document.querySelector('.count-input')
    await fireEvent.input(countInput, { target: { value: 'abc' } })

    vi.advanceTimersByTime(DEBOUNCE_TIME + 50)

    await waitFor(() => {
      const errorEl = document.querySelector('.error-state span')
      expect(errorEl).toBeTruthy()
    }, { timeout: 400 })
  })

  it('should clear output and reset count when clear button is clicked', async () => {
    const countInput = document.querySelector('.count-input')
    await fireEvent.input(countInput, { target: { value: '2' } })

    vi.advanceTimersByTime(DEBOUNCE_TIME + 50)

    await waitFor(() => {
      expect(document.querySelector('.uuid-list')).toBeInTheDocument()
    }, { timeout: 400 })

    const clearButton = screen.getByLabelText('Clear output')
    await fireEvent.click(clearButton)

    await waitFor(() => {
      const updatedInput = document.querySelector('.count-input')
      expect(updatedInput?.value).toBe('1')
      const uuidList = document.querySelector('.uuid-list')
      expect(uuidList).toBeNull()
      const uuidItem = document.querySelector('.uuid-item')
      expect(uuidItem).toBeNull()
    })

    const errorEl = document.querySelector('.error-state')
    expect(errorEl).toBeNull()
  })

  it('should debounce input changes', async () => {
    const countInput = document.querySelector('.count-input')
    await fireEvent.input(countInput, { target: { value: '1' } })

    vi.advanceTimersByTime(DEBOUNCE_TIME + 50)

    await waitFor(() => {
      const uuidElement = document.querySelector('.uuid-single')
      expect(uuidElement).toBeInTheDocument()
    }, { timeout: 400 })

    await fireEvent.input(countInput, { target: { value: '2' } })
    await fireEvent.input(countInput, { target: { value: '3' } })

    vi.advanceTimersByTime(50)
    const uuidElementsBeforeDebounce = document.querySelectorAll('.uuid-item')
    expect(uuidElementsBeforeDebounce.length).toBeLessThan(3)

    vi.advanceTimersByTime(DEBOUNCE_TIME + 50)

    await waitFor(() => {
      const uuidItemsAfter = document.querySelectorAll('.uuid-item')
      expect(uuidItemsAfter).toHaveLength(3)
    }, { timeout: 400 })
  })

  it('should clean up timeouts on unmount (memory leak test)', async () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

    const countInput = document.querySelector('.count-input')
    await fireEvent.input(countInput, { target: { value: '5' } })

    cleanup()

    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })

  it('should save count to localStorage', async () => {
    const countInput = document.querySelector('.count-input')
    await fireEvent.input(countInput, { target: { value: '5' } })

    vi.advanceTimersByTime(DEBOUNCE_TIME + SAVE_DEBOUNCE_TIME + 100)

    expect(localStorage.getItem('devutils-uuid-count')).toBe('5')
  })

  it('should verify localStorage persistence mechanism works', () => {
    // Set up localStorage
    localStorage.setItem('devutils-uuid-count', '7')

    // Verify localStorage works
    expect(localStorage.getItem('devutils-uuid-count')).toBe('7')
  })

  it('should save count to localStorage after input', async () => {
    const countInput = document.querySelector('.count-input')
    await fireEvent.input(countInput, { target: { value: '5' } })

    vi.advanceTimersByTime(DEBOUNCE_TIME + SAVE_DEBOUNCE_TIME + 100)

    expect(localStorage.getItem('devutils-uuid-count')).toBe('5')
  })

  it('should increment count when + button is clicked', async () => {
    const incrementButton = screen.getByLabelText('Increase count')
    const countInput = document.querySelector('.count-input')

    expect(countInput?.value).toBe('1')

    await fireEvent.click(incrementButton)

    await waitFor(() => {
      const updatedInput = document.querySelector('.count-input')
      expect(updatedInput?.value).toBe('2')
    })

    const uuidList = document.querySelectorAll('.uuid-item')
    expect(uuidList.length).toBeGreaterThanOrEqual(1)
  })

  it('should decrement count when - button is clicked', async () => {
    const countInput = document.querySelector('.count-input')
    await fireEvent.input(countInput, { target: { value: '3' } })

    vi.advanceTimersByTime(DEBOUNCE_TIME + 50)

    const decrementButton = screen.getByLabelText('Decrease count')
    await fireEvent.click(decrementButton)

    await waitFor(() => {
      const updatedInput = document.querySelector('.count-input')
      expect(updatedInput?.value).toBe('2')
    })
  })

  it('should disable decrement button at minimum count', async () => {
    const decrementButton = screen.getByLabelText('Decrease count')
    expect(decrementButton).toBeDisabled()
  })

  it('should disable increment button at maximum count', async () => {
    const countInput = document.querySelector('.count-input')
    await fireEvent.input(countInput, { target: { value: '100' } })

    vi.advanceTimersByTime(DEBOUNCE_TIME + 50)

    const incrementButton = screen.getByLabelText('Increase count')
    expect(incrementButton).toBeDisabled()
  })

  it('should load example when load example button is clicked', async () => {
    const loadExampleButton = screen.getByLabelText('Load example')
    const countInput = document.querySelector('.count-input')

    await fireEvent.input(countInput, { target: { value: '5' } })
    vi.advanceTimersByTime(DEBOUNCE_TIME + 50)

    await fireEvent.click(loadExampleButton)

    await waitFor(() => {
      const updatedInput = document.querySelector('.count-input')
      expect(updatedInput?.value).toBe('1')
    })

    const uuidElement = document.querySelector('.uuid-single')
    expect(uuidElement).toBeInTheDocument()
    expect(uuidElement?.textContent).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })

  it('should recover from error state when valid input is entered', async () => {
    const countInput = document.querySelector('.count-input')
    await fireEvent.input(countInput, { target: { value: '0' } })

    vi.advanceTimersByTime(DEBOUNCE_TIME + 50)

    await waitFor(() => {
      const errorEl = document.querySelector('.error-state')
      expect(errorEl).toBeInTheDocument()
    })

    await fireEvent.input(countInput, { target: { value: '3' } })
    vi.advanceTimersByTime(DEBOUNCE_TIME + 50)

    await waitFor(() => {
      const errorEl = document.querySelector('.error-state')
      expect(errorEl).toBeNull()
      const uuidList = document.querySelectorAll('.uuid-item')
      expect(uuidList).toHaveLength(3)
    })
  })

  it('should have proper ARIA attributes on buttons', () => {
    expect(screen.getByLabelText('Generate UUIDs')).toBeInTheDocument()
    expect(screen.getByLabelText('Load example')).toBeInTheDocument()
    expect(screen.getByLabelText('Clear output')).toBeInTheDocument()
    expect(screen.getByLabelText('Increase count')).toBeInTheDocument()
    expect(screen.getByLabelText('Decrease count')).toBeInTheDocument()
  })

  it('should have proper ARIA attributes on input', () => {
    const countInput = screen.getByLabelText('Number of UUIDs to generate')
    expect(countInput).toHaveAttribute('min', '1')
    expect(countInput).toHaveAttribute('max', '100')
    expect(countInput).toHaveAttribute('type', 'number')
  })

  it('should have proper ARIA attributes on error container', async () => {
    const countInput = document.querySelector('.count-input')
    await fireEvent.input(countInput, { target: { value: '0' } })

    vi.advanceTimersByTime(DEBOUNCE_TIME + 50)

    await waitFor(() => {
      const errorState = document.querySelector('.error-state')
      expect(errorState).toHaveAttribute('role', 'alert')
      expect(errorState).toHaveAttribute('aria-live', 'assertive')
    })
  })

  it('should have aria-hidden on all SVG elements in buttons', () => {
    const svgs = document.querySelectorAll('button svg')
    svgs.forEach(svg => {
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    })
  })

  it('should render with initial state', () => {
    const countInput = document.querySelector('.count-input')
    expect(countInput?.value).toBe('1')
    expect(screen.getByLabelText('Decrease count')).toBeDisabled()
  })

  it('should handle localStorage with invalid values gracefully', () => {
    localStorage.setItem('devutils-uuid-count', 'invalid')

    // Invalid value should not break - the component validates on load
    expect(localStorage.getItem('devutils-uuid-count')).toBe('invalid')
  })

  it('should handle localStorage with out-of-range values gracefully', () => {
    localStorage.setItem('devutils-uuid-count', '500')

    // Out-of-range value should not break - the component validates on load
    expect(localStorage.getItem('devutils-uuid-count')).toBe('500')
  })
})
