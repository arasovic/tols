import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import JsonpTool from '$lib/tools/JsonpTool.svelte'

function waitForDebounce(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('JsonpTool', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with tool header', () => {
    render(JsonpTool)
    expect(screen.getByText('JSONP Tester')).toBeInTheDocument()
  })

  it('should have URL and callback inputs', () => {
    const { container } = render(JsonpTool)

    expect(screen.getByText('URL')).toBeInTheDocument()
    expect(screen.getByText('Callback Function')).toBeInTheDocument()
  })

  it('should have simulated response textarea', () => {
    const { container } = render(JsonpTool)

    expect(screen.getByText('Simulated Response (JSON)')).toBeInTheDocument()
    expect(container.querySelector('.response-textarea')).toBeInTheDocument()
  })

  it('should generate script tag', async () => {
    const { container } = render(JsonpTool)

    await waitFor(() => {
      expect(screen.getByText('Generated Script Tag')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should show parsed result', async () => {
    const { container } = render(JsonpTool)

    await waitFor(() => {
      expect(screen.getByText('Parsed Result')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should clear when clear button clicked', async () => {
    const { container } = render(JsonpTool)

    const clearButton = container.querySelector('[title="Clear"]')
    await fireEvent.click(clearButton)

    const inputs = container.querySelectorAll('input[type="text"]')
    expect(inputs[0]?.value).toBe('')
  })

  it('should load example when load example button clicked', async () => {
    const { container } = render(JsonpTool)

    const loadExampleButton = container.querySelector('[title="Load Example"]')
    await fireEvent.click(loadExampleButton)

    const urlInput = container.querySelector('input[type="text"]')
    expect(urlInput?.value).toBe('https://api.example.com/data')
  })

  it('should update script tag when URL changed', async () => {
    const { container } = render(JsonpTool)

    const urlInput = container.querySelector('input[type="text"]')
    await fireEvent.input(urlInput, { target: { value: 'https://new.api.com/data' } })

    await waitForDebounce(400)

    const scriptOutput = container.querySelector('.code-block')
    expect(scriptOutput?.textContent).toContain('https://new.api.com/data')
  })

  it('should update script tag when callback changed', async () => {
    const { container } = render(JsonpTool)

    const callbackInput = container.querySelectorAll('input[type="text"]')[1]
    await fireEvent.input(callbackInput, { target: { value: 'newCallback' } })

    await waitForDebounce(400)

    const scriptOutput = container.querySelector('.code-block')
    expect(scriptOutput?.textContent).toContain('newCallback')
  })

  it('should show success result for valid JSON', async () => {
    const { container } = render(JsonpTool)

    const responseTextarea = container.querySelector('.response-textarea')
    await fireEvent.input(responseTextarea, { target: { value: '{"valid": true}' } })

    await waitForDebounce(400)

    const resultDisplay = container.querySelector('.result-display')
    const content = resultDisplay?.textContent || ''
    expect(content).toContain('true')
  })

  it('should show error result for invalid JSON', async () => {
    const { container } = render(JsonpTool)

    const responseTextarea = container.querySelector('.response-textarea')
    await fireEvent.input(responseTextarea, { target: { value: 'invalid json' } })

    await waitForDebounce(400)

    const errorDisplay = container.querySelector('.error-display')
    expect(errorDisplay).toBeInTheDocument()
  })

  it('should have info section explaining JSONP', () => {
    render(JsonpTool)

    expect(screen.getByText('How JSONP Works')).toBeInTheDocument()
  })
})
