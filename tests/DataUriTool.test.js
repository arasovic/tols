import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import DataUriTool from '$lib/tools/DataUriTool.svelte'

describe('DataUriTool', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with tool header', () => {
    render(DataUriTool)
    expect(screen.getByText('Data URI Generator')).toBeInTheDocument()
  })

  it('should have file input', () => {
    const { container } = render(DataUriTool)

    expect(screen.getByText('Select a file to convert to Data URI')).toBeInTheDocument()
    expect(container.querySelector('input[type="file"]')).toBeInTheDocument()
  })

  it('should clear when clear button clicked', async () => {
    const { container } = render(DataUriTool)

    const clearButton = container.querySelector('[title="Clear"]')
    await fireEvent.click(clearButton)

    expect(container.querySelector('.result-section')).not.toBeInTheDocument()
  })

  it('should show file information when file loaded', async () => {
    const { container } = render(DataUriTool)

    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
    const fileInput = container.querySelector('input[type="file"]')

    await fireEvent.change(fileInput, { target: { files: [mockFile] } })

    await waitFor(() => {
      expect(screen.getByText('Type:')).toBeInTheDocument()
      expect(screen.getByText('Size:')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should display data URI output', async () => {
    const { container } = render(DataUriTool)

    const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    const fileInput = container.querySelector('input[type="file"]')

    await fireEvent.change(fileInput, { target: { files: [mockFile] } })

    await waitFor(() => {
      expect(screen.getByText('Data URI')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should show image preview for image files', async () => {
    const { container } = render(DataUriTool)

    const mockImageFile = new File(['image data'], 'test.png', { type: 'image/png' })
    const fileInput = container.querySelector('input[type="file"]')

    await fireEvent.change(fileInput, { target: { files: [mockImageFile] } })

    await waitFor(() => {
      expect(container.querySelector('.preview-image')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should handle file reading', async () => {
    const { container } = render(DataUriTool)

    const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    const fileInput = container.querySelector('input[type="file"]')

    await fireEvent.change(fileInput, { target: { files: [mockFile] } })

    await waitFor(() => {
      // Should show success state for valid file
      expect(container.querySelector('.result-section')).toBeInTheDocument()
    }, { timeout: 500 })
  })
})
