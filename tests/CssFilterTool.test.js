import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import CssFilterTool from '$lib/tools/GzipTool.svelte'

describe('CssFilterTool', () => {
  beforeEach(() => {
    localStorage.clear()
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

    const codeElement = container.querySelector('.filter-code code')
    expect(codeElement?.textContent).toContain('blur(5px)')
  })

  it('should update brightness filter', async () => {
    const { container } = render(CssFilterTool)

    const brightnessSlider = container.querySelectorAll('input[type="range"]')[1]
    await fireEvent.input(brightnessSlider, { target: { value: '150' } })

    const codeElement = container.querySelector('.filter-code code')
    expect(codeElement?.textContent).toContain('brightness(150%)')
  })

  it('should update contrast filter', async () => {
    const { container } = render(CssFilterTool)

    const contrastSlider = container.querySelectorAll('input[type="range"]')[2]
    await fireEvent.input(contrastSlider, { target: { value: '150' } })

    const codeElement = container.querySelector('.filter-code code')
    expect(codeElement?.textContent).toContain('contrast(150%)')
  })

  it('should update grayscale filter', async () => {
    const { container } = render(CssFilterTool)

    const grayscaleSlider = container.querySelectorAll('input[type="range"]')[3]
    await fireEvent.input(grayscaleSlider, { target: { value: '100' } })

    const codeElement = container.querySelector('.filter-code code')
    expect(codeElement?.textContent).toContain('grayscale(100%)')
  })

  it('should update hue-rotate filter', async () => {
    const { container } = render(CssFilterTool)

    const hueSlider = container.querySelectorAll('input[type="range"]')[4]
    await fireEvent.input(hueSlider, { target: { value: '90' } })

    const codeElement = container.querySelector('.filter-code code')
    expect(codeElement?.textContent).toContain('hue-rotate(90deg)')
  })

  it('should update invert filter', async () => {
    const { container } = render(CssFilterTool)

    const invertSlider = container.querySelectorAll('input[type="range"]')[5]
    await fireEvent.input(invertSlider, { target: { value: '100' } })

    const codeElement = container.querySelector('.filter-code code')
    expect(codeElement?.textContent).toContain('invert(100%)')
  })

  it('should update saturate filter', async () => {
    const { container } = render(CssFilterTool)

    const saturateSlider = container.querySelectorAll('input[type="range"]')[6]
    await fireEvent.input(saturateSlider, { target: { value: '50' } })

    const codeElement = container.querySelector('.filter-code code')
    expect(codeElement?.textContent).toContain('saturate(50%)')
  })

  it('should update sepia filter', async () => {
    const { container } = render(CssFilterTool)

    const sepiaSlider = container.querySelectorAll('input[type="range"]')[7]
    await fireEvent.input(sepiaSlider, { target: { value: '100' } })

    const codeElement = container.querySelector('.filter-code code')
    expect(codeElement?.textContent).toContain('sepia(100%)')
  })

  it('should reset all filters when reset button clicked', async () => {
    const { container } = render(CssFilterTool)

    const sepiaSlider = container.querySelectorAll('input[type="range"]')[7]
    await fireEvent.input(sepiaSlider, { target: { value: '100' } })

    const resetButton = container.querySelector('[title="Reset"]')
    await fireEvent.click(resetButton)

    const codeElement = container.querySelector('.filter-code code')
    expect(codeElement?.textContent).toContain('filter: none')
  })

  it('should apply filters to preview image', async () => {
    const { container } = render(CssFilterTool)

    const blurSlider = container.querySelectorAll('input[type="range"]')[0]
    await fireEvent.input(blurSlider, { target: { value: '10' } })

    const previewImage = container.querySelector('.preview-image')
    expect(previewImage?.style.filter).toContain('blur(10px)')
  })
})
