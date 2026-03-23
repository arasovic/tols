import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import UuidTool from '$lib/tools/UuidTool.svelte'

describe('UuidTool', () => {
  let component

  beforeEach(() => {
    component = render(UuidTool)
  })

  it('should generate a single UUID when generate button is clicked', async () => {
    const generateButton = screen.getByText('Generate')
    await fireEvent.click(generateButton)

    await waitFor(() => {
      const uuidElement = document.querySelector('.uuid-single')
      expect(uuidElement).toBeInTheDocument()
      expect(uuidElement.textContent).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })
  })

  it('should generate multiple UUIDs when count > 1', async () => {
    const countInput = document.querySelector('.count-input')
    await fireEvent.input(countInput, { target: { value: '3' } })

    await waitFor(() => {
      const uuidList = document.querySelectorAll('.uuid-item')
      expect(uuidList).toHaveLength(3)
    }, { timeout: 400 })

    const uuidList = document.querySelectorAll('.uuid-item')
    for (let i = 0; i < 3; i++) {
      const uuidElement = uuidList[i].querySelector('.uuid-text')
      expect(uuidElement.textContent).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    }
  })

  it('should show error when count < 1', async () => {
    const countInput = document.querySelector('.count-input')
    await fireEvent.input(countInput, { target: { value: '0' } })

    await waitFor(() => {
      const errorEl = document.querySelector('.error-state span')
      expect(errorEl.textContent).toContain('Count must be between 1 and 100')
    }, { timeout: 400 })
  })

  it('should show error when count > 100', async () => {
    const countInput = document.querySelector('.count-input')
    await fireEvent.input(countInput, { target: { value: '101' } })

    await waitFor(() => {
      const errorEl = document.querySelector('.error-state span')
      expect(errorEl.textContent).toContain('Count must be between 1 and 100')
    }, { timeout: 400 })
  })

  it('should clear output and reset count when clear button is clicked', async () => {
    const countInput = document.querySelector('.count-input')
    await fireEvent.input(countInput, { target: { value: '2' } })

    await waitFor(() => {
      expect(document.querySelector('.uuid-list')).toBeInTheDocument()
    }, { timeout: 400 })

    const clearButton = document.querySelector('.btn-ghost[title="Clear"]')
    await fireEvent.click(clearButton)

    await waitFor(() => {
      expect(countInput.value).toBe('1')
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

    await waitFor(() => {
      const uuidElement = document.querySelector('.uuid-single')
      expect(uuidElement).toBeInTheDocument()
    }, { timeout: 400 })

    await fireEvent.input(countInput, { target: { value: '2' } })
    await fireEvent.input(countInput, { target: { value: '3' } })

    const uuidElementsBeforeDebounce = document.querySelectorAll('.uuid-item')
    expect(uuidElementsBeforeDebounce.length).toBeLessThan(3)

    await waitFor(() => {
      const uuidItemsAfter = document.querySelectorAll('.uuid-item')
      expect(uuidItemsAfter).toHaveLength(3)
    }, { timeout: 400 })
  })
})
