import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import ColorTool from '$lib/tools/ColorTool.svelte'

describe('ColorTool', () => {
  let component

  beforeEach(() => {
    component = render(ColorTool)
  })

  it('should have color preview on mount', () => {
    const colorPreview = document.querySelector('.color-swatch')
    expect(colorPreview).toBeInTheDocument()
    expect(colorPreview.style.backgroundColor).toBeTruthy()
  })

  it('should update RGB and HSL when HEX input is changed', async () => {
    const inputs = screen.getAllByRole('textbox')
    const hexInput = inputs[0]
    const rgbInput = inputs[1]
    const hslInput = inputs[2]

    await fireEvent.input(hexInput, { target: { value: 'FF0000' } })

    await waitForDebounce(100)

    expect(rgbInput.value).toBe('rgb(255, 0, 0)')
    expect(hslInput.value).toBe('hsl(0, 100%, 50%)')

    const colorPreview = document.querySelector('.color-swatch')
    expect(colorPreview.style.backgroundColor).toBe('rgb(255, 0, 0)')
  })

  it('should update HEX and HSL when RGB input is changed', async () => {
    const inputs = screen.getAllByRole('textbox')
    const hexInput = inputs[0]
    const rgbInput = inputs[1]
    const hslInput = inputs[2]

    await fireEvent.input(rgbInput, { target: { value: 'rgb(255, 0, 0)' } })

    await waitForDebounce(100)

    expect(hexInput.value).toMatch(/#ff0000/i)
    expect(hslInput.value).toBe('hsl(0, 100%, 50%)')

    const colorPreview = document.querySelector('.color-swatch')
    expect(colorPreview.style.backgroundColor).toBe('rgb(255, 0, 0)')
  })

  it('should update HEX and RGB when HSL input is changed', async () => {
    const inputs = screen.getAllByRole('textbox')
    const hexInput = inputs[0]
    const rgbInput = inputs[1]
    const hslInput = inputs[2]

    await fireEvent.input(hslInput, { target: { value: 'hsl(0, 100%, 50%)' } })

    await waitForDebounce(100)

    expect(hexInput.value).toMatch(/#ff0000/i)
    expect(rgbInput.value).toBe('rgb(255, 0, 0)')

    const colorPreview = document.querySelector('.color-swatch')
    expect(colorPreview.style.backgroundColor).toBe('rgb(255, 0, 0)')
  })

  it('should handle 3-digit HEX input', async () => {
    const inputs = screen.getAllByRole('textbox')
    const hexInput = inputs[0]
    const rgbInput = inputs[1]

    await fireEvent.input(hexInput, { target: { value: 'f00' } })

    await waitForDebounce(100)

    expect(rgbInput.value).toBe('rgb(255, 0, 0)')

    const colorPreview = document.querySelector('.color-swatch')
    expect(colorPreview.style.backgroundColor).toBe('rgb(255, 0, 0)')
  })

  it('should clear all fields when clear button is clicked', async () => {
    const inputs = screen.getAllByRole('textbox')
    const clearButton = screen.getByTitle('Clear')

    await fireEvent.input(inputs[0], { target: { value: 'FF0000' } })
    await waitForDebounce(50)

    await fireEvent.click(clearButton)
    await waitForDebounce(50)

    expect(inputs[0].value).toBe('#')
    expect(inputs[1].value).toBe('')
    expect(inputs[2].value).toBe('')

    const colorPreview = document.querySelector('.color-swatch')
    expect(colorPreview.style.backgroundColor).toBe('rgb(10, 10, 12)')
  })

  it('should handle invalid HEX input gracefully', async () => {
    const inputs = screen.getAllByRole('textbox')
    const hexInput = inputs[0]
    const rgbInput = inputs[1]
    const hslInput = inputs[2]

    await fireEvent.input(hexInput, { target: { value: 'notahex' } })

    await waitForDebounce(100)

    expect(rgbInput.value).toBe('')
    expect(hslInput.value).toBe('')

    const colorPreview = document.querySelector('.color-swatch')
    expect(colorPreview.style.backgroundColor).toBe('rgb(10, 10, 12)')
  })

  it('should handle invalid RGB input gracefully', async () => {
    const inputs = screen.getAllByRole('textbox')
    const hexInput = inputs[0]
    const rgbInput = inputs[1]
    const hslInput = inputs[2]

    await fireEvent.input(rgbInput, { target: { value: 'notanrgb' } })

    await waitForDebounce(100)

    expect(hexInput.value).toBe('#')
    expect(hslInput.value).toBe('')

    const colorPreview = document.querySelector('.color-swatch')
    expect(colorPreview.style.backgroundColor).toBe('rgb(10, 10, 12)')
  })

  it('should handle invalid HSL input gracefully', async () => {
    const inputs = screen.getAllByRole('textbox')
    const hexInput = inputs[0]
    const rgbInput = inputs[1]
    const hslInput = inputs[2]

    await fireEvent.input(hslInput, { target: { value: 'notanhsl' } })

    await waitForDebounce(100)

    expect(hexInput.value).toBe('#')
    expect(rgbInput.value).toBe('')

    const colorPreview = document.querySelector('.color-swatch')
    expect(colorPreview.style.backgroundColor).toBe('rgb(10, 10, 12)')
  })

  it('should show copy buttons for valid colors', async () => {
    const inputs = screen.getAllByRole('textbox')

    await fireEvent.input(inputs[0], { target: { value: 'FF0000' } })

    await waitForDebounce(100)

    const copyButtons = screen.queryAllByTitle('Copy')
    expect(copyButtons.length).toBeGreaterThan(0)
  })

  it('should handle case insensitivity in HEX input', async () => {
    const inputs = screen.getAllByRole('textbox')
    const hexInput = inputs[0]
    const rgbInput = inputs[1]

    await fireEvent.input(hexInput, { target: { value: 'FF0000' } })

    await waitForDebounce(100)

    expect(rgbInput.value).toBe('rgb(255, 0, 0)')

    const colorPreview = document.querySelector('.color-swatch')
    expect(colorPreview.style.backgroundColor).toBe('rgb(255, 0, 0)')
  })

  it('should update color preview dynamically', async () => {
    const inputs = screen.getAllByRole('textbox')
    const hexInput = inputs[0]
    const testColors = ['FF0000', '00FF00', '0000FF', 'FFFF00', 'FF00FF', '00FFFF']

    for (const color of testColors) {
      await fireEvent.input(hexInput, { target: { value: color } })
      await waitForDebounce(50)

      const colorPreview = document.querySelector('.color-swatch')
      expect(colorPreview).toBeInTheDocument()
      expect(colorPreview.style.backgroundColor).not.toBe('')
    }
  })
})

function waitForDebounce(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
