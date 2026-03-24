import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/svelte'
import CssFilterTool from '$lib/tools/CssFilterTool.svelte'

const DEBOUNCE_WAIT = 100

function waitForDebounce(ms = DEBOUNCE_WAIT) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('CssFilterTool', () => {
  beforeEach(() => {
    localStorage.clear()
    cleanup()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    cleanup()
  })

  it('should initialize with tool header', () => {
    render(CssFilterTool)
    expect(screen.getByText('CSS Filter Generator')).toBeInTheDocument()
  })

  it('should have filter controls', () => {
    render(CssFilterTool)

    expect(screen.getByText(/Blur:/)).toBeInTheDocument()
    expect(screen.getByText(/Brightness:/)).toBeInTheDocument()
    expect(screen.getByText(/Contrast:/)).toBeInTheDocument()
  })

  it('should have all filter sliders', () => {
    const { container } = render(CssFilterTool)

    const sliders = container.querySelectorAll('input[type="range"]')
    expect(sliders.length).toBe(8)
  })

  it('should display filter CSS code', () => {
    const { container } = render(CssFilterTool)

    const codeElement = container.querySelector('.filter-code code')
    expect(codeElement?.textContent).toContain('filter:')
  })

  it('should update blur filter', async () => {
    const { container } = render(CssFilterTool)

    const blurSlider = container.querySelectorAll('input[type="range"]')[0]
    await fireEvent.input(blurSlider, { target: { value: '5' } })
    await waitForDebounce()

    await waitFor(() => {
      const codeElement = container.querySelector('.filter-code code')
      expect(codeElement?.textContent).toContain('blur(5px)')
    })
  })

  it('should update brightness filter', async () => {
    const { container } = render(CssFilterTool)

    const brightnessSlider = container.querySelectorAll('input[type="range"]')[1]
    await fireEvent.input(brightnessSlider, { target: { value: '150' } })
    await waitForDebounce()

    await waitFor(() => {
      const codeElement = container.querySelector('.filter-code code')
      expect(codeElement?.textContent).toContain('brightness(150%)')
    })
  })

  it('should update contrast filter', async () => {
    const { container } = render(CssFilterTool)

    const contrastSlider = container.querySelectorAll('input[type="range"]')[2]
    await fireEvent.input(contrastSlider, { target: { value: '150' } })
    await waitForDebounce()

    await waitFor(() => {
      const codeElement = container.querySelector('.filter-code code')
      expect(codeElement?.textContent).toContain('contrast(150%)')
    })
  })

  it('should update grayscale filter', async () => {
    const { container } = render(CssFilterTool)

    const grayscaleSlider = container.querySelectorAll('input[type="range"]')[3]
    await fireEvent.input(grayscaleSlider, { target: { value: '100' } })
    await waitForDebounce()

    await waitFor(() => {
      const codeElement = container.querySelector('.filter-code code')
      expect(codeElement?.textContent).toContain('grayscale(100%)')
    })
  })

  it('should update hue-rotate filter', async () => {
    const { container } = render(CssFilterTool)

    const hueSlider = container.querySelectorAll('input[type="range"]')[4]
    await fireEvent.input(hueSlider, { target: { value: '90' } })
    await waitForDebounce()

    await waitFor(() => {
      const codeElement = container.querySelector('.filter-code code')
      expect(codeElement?.textContent).toContain('hue-rotate(90deg)')
    })
  })

  it('should update invert filter', async () => {
    const { container } = render(CssFilterTool)

    const invertSlider = container.querySelectorAll('input[type="range"]')[5]
    await fireEvent.input(invertSlider, { target: { value: '100' } })
    await waitForDebounce()

    await waitFor(() => {
      const codeElement = container.querySelector('.filter-code code')
      expect(codeElement?.textContent).toContain('invert(100%)')
    })
  })

  it('should update saturate filter', async () => {
    const { container } = render(CssFilterTool)

    const saturateSlider = container.querySelectorAll('input[type="range"]')[6]
    await fireEvent.input(saturateSlider, { target: { value: '50' } })
    await waitForDebounce()

    await waitFor(() => {
      const codeElement = container.querySelector('.filter-code code')
      expect(codeElement?.textContent).toContain('saturate(50%)')
    })
  })

  it('should update sepia filter', async () => {
    const { container } = render(CssFilterTool)

    const sepiaSlider = container.querySelectorAll('input[type="range"]')[7]
    await fireEvent.input(sepiaSlider, { target: { value: '100' } })
    await waitForDebounce()

    await waitFor(() => {
      const codeElement = container.querySelector('.filter-code code')
      expect(codeElement?.textContent).toContain('sepia(100%)')
    })
  })

  it('should reset all filters when reset button clicked', async () => {
    const { container } = render(CssFilterTool)

    const sepiaSlider = container.querySelectorAll('input[type="range"]')[7]
    await fireEvent.input(sepiaSlider, { target: { value: '100' } })
    await waitForDebounce()

    const resetButton = container.querySelector('[aria-label="Reset all filters to default values"]')
    await fireEvent.click(resetButton)
    await waitForDebounce()

    await waitFor(() => {
      const codeElement = container.querySelector('.filter-code code')
      expect(codeElement?.textContent).toContain('filter: none')
    })
  })

  it('should apply filters to preview image', async () => {
    const { container } = render(CssFilterTool)

    const blurSlider = container.querySelectorAll('input[type="range"]')[0]
    await fireEvent.input(blurSlider, { target: { value: '10' } })
    await waitForDebounce()

    await waitFor(() => {
      const previewImage = container.querySelector('.preview-image')
      expect(previewImage?.style.filter).toContain('blur(10px)')
    })
  })

  // Edge case tests
  it('should clamp values to minimum', async () => {
    const { container } = render(CssFilterTool)

    const blurSlider = container.querySelectorAll('input[type="range"]')[0]
    await fireEvent.input(blurSlider, { target: { value: '-10' } })
    await waitForDebounce()

    await waitFor(() => {
      const codeElement = container.querySelector('.filter-code code')
      expect(codeElement?.textContent).toContain('filter: none')
    })
  })

  it('should clamp values to maximum', async () => {
    const { container } = render(CssFilterTool)

    const blurSlider = container.querySelectorAll('input[type="range"]')[0]
    await fireEvent.input(blurSlider, { target: { value: '100' } })
    await waitForDebounce()

    await waitFor(() => {
      const codeElement = container.querySelector('.filter-code code')
      expect(codeElement?.textContent).toContain('blur(20px)')
    })
  })

  it('should handle zero values correctly', async () => {
    const { container } = render(CssFilterTool)

    const blurSlider = container.querySelectorAll('input[type="range"]')[0]
    await fireEvent.input(blurSlider, { target: { value: '0' } })
    await waitForDebounce()

    await waitFor(() => {
      const codeElement = container.querySelector('.filter-code code')
      expect(codeElement?.textContent).toContain('filter: none')
    })
  })

  it('should handle maximum hue rotation', async () => {
    const { container } = render(CssFilterTool)

    const hueSlider = container.querySelectorAll('input[type="range"]')[4]
    await fireEvent.input(hueSlider, { target: { value: '360' } })
    await waitForDebounce()

    await waitFor(() => {
      const codeElement = container.querySelector('.filter-code code')
      expect(codeElement?.textContent).toContain('hue-rotate(360deg)')
    })
  })

  // Accessibility tests
  it('should have accessible reset button', () => {
    const { container } = render(CssFilterTool)

    const resetButton = container.querySelector('[aria-label="Reset all filters to default values"]')
    expect(resetButton).toBeInTheDocument()
    expect(resetButton).toHaveAttribute('title', 'Reset')
  })

  it('should have accessible range inputs with aria labels', () => {
    const { container } = render(CssFilterTool)

    const sliders = container.querySelectorAll('input[type="range"]')
    sliders.forEach(slider => {
      expect(slider).toHaveAttribute('aria-label')
      expect(slider).toHaveAttribute('aria-valuemin')
      expect(slider).toHaveAttribute('aria-valuemax')
      expect(slider).toHaveAttribute('aria-valuenow')
    })
  })

  it('should have accessible preview image with aria-label', () => {
    const { container } = render(CssFilterTool)

    const previewSvg = container.querySelector('.preview-image svg')
    expect(previewSvg).toHaveAttribute('aria-label', 'Sample image for filter preview')
  })

  it('should persist filter values to localStorage', async () => {
    const { container } = render(CssFilterTool)

    const blurSlider = container.querySelectorAll('input[type="range"]')[0]
    await fireEvent.input(blurSlider, { target: { value: '5' } })

    await new Promise(resolve => setTimeout(resolve, 400))

    expect(localStorage.getItem('devutils-cssfilter-blur')).toBe('5')
  })

  it('should load filter values from localStorage', async () => {
    localStorage.setItem('devutils-cssfilter-blur', '8')
    localStorage.setItem('devutils-cssfilter-brightness', '120')

    const { container } = render(CssFilterTool)

    await new Promise(resolve => setTimeout(resolve, 300))

    const tool = container.querySelector('.tool')
    expect(tool).toBeInTheDocument()
  })

  it('should handle invalid localStorage values gracefully', async () => {
    localStorage.setItem('devutils-cssfilter-blur', 'invalid')
    localStorage.setItem('devutils-cssfilter-brightness', '999')

    const { container } = render(CssFilterTool)

    await new Promise(resolve => setTimeout(resolve, 100))

    const codeElement = container.querySelector('.filter-code code')
    expect(codeElement).toBeInTheDocument()
  })

  it('should combine multiple filters', async () => {
    const { container } = render(CssFilterTool)

    const blurSlider = container.querySelectorAll('input[type="range"]')[0]
    const brightnessSlider = container.querySelectorAll('input[type="range"]')[1]

    await fireEvent.input(blurSlider, { target: { value: '5' } })
    await waitForDebounce()
    await fireEvent.input(brightnessSlider, { target: { value: '150' } })
    await waitForDebounce()

    await waitFor(() => {
      const codeElement = container.querySelector('.filter-code code')
      const text = codeElement?.textContent || ''
      expect(text).toContain('blur(5px)')
      expect(text).toContain('brightness(150%)')
    })
  })
})
