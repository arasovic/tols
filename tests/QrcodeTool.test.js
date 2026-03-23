import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import QrcodeTool from '$lib/tools/QrcodeTool.svelte'

function waitForDebounce(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('QrcodeTool', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with tool header', () => {
    render(QrcodeTool)
    expect(screen.getByText('QR Code Generator')).toBeInTheDocument()
  })

  it('should have text input and size slider', () => {
    const { container } = render(QrcodeTool)

    expect(screen.getByText('Text or URL')).toBeInTheDocument()
    expect(screen.getByText(/Size:/)).toBeInTheDocument()
    expect(container.querySelector('canvas')).toBeInTheDocument()
  })

  it('should generate QR code on mount', async () => {
    const { container } = render(QrcodeTool)

    await waitFor(() => {
      expect(container.querySelector('canvas')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should clear content when clear button clicked', async () => {
    const { container } = render(QrcodeTool)

    const clearButton = container.querySelector('[title="Clear"]')
    await fireEvent.click(clearButton)

    const textInput = container.querySelector('input[type="text"]')
    expect(textInput?.value).toBe('')
  })

  it('should show download button when text is present', async () => {
    render(QrcodeTool)

    await waitFor(() => {
      expect(screen.getByText('Download PNG')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should have quick example buttons', () => {
    render(QrcodeTool)

    expect(screen.getByText('GitHub')).toBeInTheDocument()
    expect(screen.getByText('Google')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Phone')).toBeInTheDocument()
  })

  it('should generate QR code with custom text', async () => {
    const { container } = render(QrcodeTool)

    const textInput = container.querySelector('input[type="text"]')
    await fireEvent.input(textInput, { target: { value: 'Custom text' } })

    await waitForDebounce(400)

    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()

    // Verify QR code actually changed by checking canvas has content
    const ctx = canvas.getContext('2d')
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    expect(imageData.data.some(pixel => pixel > 0)).toBe(true)
  })

  it('should handle URL input', async () => {
    const { container } = render(QrcodeTool)

    const textInput = container.querySelector('input[type="text"]')
    await fireEvent.input(textInput, { target: { value: 'https://example.com' } })

    await waitForDebounce(400)

    expect(container.querySelector('canvas')).toBeInTheDocument()
  })

  it('should generate GitHub QR when GitHub button clicked', async () => {
    const { container } = render(QrcodeTool)

    const githubButton = screen.getByText('GitHub')
    await fireEvent.click(githubButton)

    const textInput = container.querySelector('input[type="text"]')
    expect(textInput?.value).toBe('https://github.com')
  })

  it('should generate email QR when Email button clicked', async () => {
    const { container } = render(QrcodeTool)

    const emailButton = screen.getByText('Email')
    await fireEvent.click(emailButton)

    const textInput = container.querySelector('input[type="text"]')
    expect(textInput?.value).toContain('mailto:')
  })

  it('should have default URL', () => {
    const { container } = render(QrcodeTool)

    const textInput = container.querySelector('input[type="text"]')
    expect(textInput?.value).toBe('https://devutils.tools')
  })

  it('should have size slider with min and max', () => {
    const { container } = render(QrcodeTool)

    const slider = container.querySelector('input[type="range"]')
    expect(slider).toHaveAttribute('min', '100')
    expect(slider).toHaveAttribute('max', '500')
  })
})
