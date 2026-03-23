import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import PlaceholderTool from '$lib/tools/PlaceholderTool.svelte'

function waitForDebounce(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('PlaceholderTool', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with tool header', () => {
    render(PlaceholderTool)
    expect(screen.getByText('Image Placeholder')).toBeInTheDocument()
  })

  it('should have control inputs', () => {
    const { container } = render(PlaceholderTool)

    expect(screen.getByText('Width')).toBeInTheDocument()
    expect(screen.getByText('Height')).toBeInTheDocument()
    expect(screen.getByText('Background')).toBeInTheDocument()
    expect(screen.getByText('Text Color')).toBeInTheDocument()
    expect(screen.getByText('Custom Text')).toBeInTheDocument()
  })

  it('should have canvas for preview', () => {
    const { container } = render(PlaceholderTool)

    expect(container.querySelector('canvas')).toBeInTheDocument()
  })

  it('should have download button', () => {
    render(PlaceholderTool)

    expect(screen.getByText('Download PNG')).toBeInTheDocument()
  })

  it('should update width', async () => {
    const { container } = render(PlaceholderTool)

    const widthInput = container.querySelectorAll('input[type="number"]')[0]
    await fireEvent.input(widthInput, { target: { value: '800' } })

    expect(widthInput?.value).toBe('800')
  })

  it('should update height', async () => {
    const { container } = render(PlaceholderTool)

    const heightInput = container.querySelectorAll('input[type="number"]')[1]
    await fireEvent.input(heightInput, { target: { value: '600' } })

    expect(heightInput?.value).toBe('600')
  })

  it('should update background color', async () => {
    const { container } = render(PlaceholderTool)

    const bgColorInput = container.querySelectorAll('input[type="color"]')[0]
    await fireEvent.input(bgColorInput, { target: { value: '#FF0000' } })

    expect(bgColorInput?.value).toBe('#ff0000')
  })

  it('should update text color', async () => {
    const { container } = render(PlaceholderTool)

    const textColorInput = container.querySelectorAll('input[type="color"]')[1]
    await fireEvent.input(textColorInput, { target: { value: '#FFFFFF' } })

    expect(textColorInput?.value).toBe('#ffffff')
  })

  it('should update custom text', async () => {
    const { container } = render(PlaceholderTool)

    const textInput = container.querySelector('input[type="text"]')
    await fireEvent.input(textInput, { target: { value: 'Custom Label' } })

    expect(textInput?.value).toBe('Custom Label')
  })

  it('should clear when clear button clicked', async () => {
    const { container } = render(PlaceholderTool)

    const clearButton = container.querySelector('[title="Clear"]')
    await fireEvent.click(clearButton)

    const widthInput = container.querySelectorAll('input[type="number"]')[0]
    expect(widthInput?.value).toBe('400')
  })

  it('should have default dimensions', () => {
    const { container } = render(PlaceholderTool)

    const widthInput = container.querySelectorAll('input[type="number"]')[0]
    const heightInput = container.querySelectorAll('input[type="number"]')[1]

    expect(widthInput?.value).toBe('400')
    expect(heightInput?.value).toBe('300')
  })

  it('should have min and max for dimensions', () => {
    const { container } = render(PlaceholderTool)

    const widthInput = container.querySelectorAll('input[type="number"]')[0]

    expect(widthInput).toHaveAttribute('min', '50')
    expect(widthInput).toHaveAttribute('max', '2000')
  })
})
