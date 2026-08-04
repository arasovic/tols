import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/svelte'
import JwtEncoderTool from '$lib/tools/JwtEncoderTool.svelte'

// Helper to flush promises and timeouts
async function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 50))
}

describe('JwtEncoderTool', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    // Scoped crypto stub per test
    vi.stubGlobal('crypto', {
      subtle: {
        importKey: vi.fn().mockResolvedValue({}),
        sign: vi.fn().mockResolvedValue(new ArrayBuffer(32))
      }
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('should initialize with tool header', () => {
    render(JwtEncoderTool)
    expect(screen.getByText('JWT Encoder')).toBeInTheDocument()
  })

  it('should have header, payload, and secret inputs', () => {
    render(JwtEncoderTool)

    expect(screen.getByText('Header (JSON)')).toBeInTheDocument()
    expect(screen.getByText('Payload (JSON)')).toBeInTheDocument()
    expect(screen.getByText('Secret Key')).toBeInTheDocument()
  })

  it('should show error for invalid header JSON', async () => {
    const { container } = render(JwtEncoderTool)

    const headerTextarea = container.querySelectorAll('.input-textarea')[0]
    await fireEvent.input(headerTextarea, { target: { value: 'invalid json' } })

    await waitFor(() => {
      expect(screen.getByText(/Invalid header JSON/)).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should show error for invalid payload JSON', async () => {
    const { container } = render(JwtEncoderTool)

    const payloadTextarea = container.querySelectorAll('.input-textarea')[1]
    await fireEvent.input(payloadTextarea, { target: { value: 'invalid json' } })

    await waitFor(() => {
      expect(screen.getByText(/Invalid payload JSON/)).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should show error for empty secret', async () => {
    const { container } = render(JwtEncoderTool)

    const secretInput = container.querySelector('.secret-input')
    await fireEvent.input(secretInput, { target: { value: '' } })

    await waitFor(() => {
      expect(screen.getByText(/Please enter a secret/)).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should generate token with valid inputs', async () => {
    const { container } = render(JwtEncoderTool)

    // Trigger token generation by modifying payload
    const payloadTextarea = container.querySelectorAll('.input-textarea')[1]
    await fireEvent.input(payloadTextarea, { target: { value: '{"sub":"123","name":"Test"}' } })

    await waitFor(() => {
      const tokenOutput = container.querySelector('.token-value')
      expect(tokenOutput).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should clear all fields when clear button clicked', async () => {
    const { container } = render(JwtEncoderTool)

    const clearButton = container.querySelector('[aria-label="Clear"]')
    await fireEvent.click(clearButton)

    const headerTextarea = container.querySelectorAll('.input-textarea')[0]
    expect(headerTextarea?.value).toContain('HS256')
    expect(headerTextarea?.value).toContain('JWT')
  })

  it('should load example when load example button clicked', async () => {
    const { container } = render(JwtEncoderTool)

    const loadExampleButton = container.querySelector('[aria-label="Load example"]')
    await fireEvent.click(loadExampleButton)

    const headerTextarea = container.querySelectorAll('.input-textarea')[0]
    expect(headerTextarea?.value).toContain('alg')
    expect(headerTextarea?.value).toContain('HS256')

    await waitFor(() => {
      const tokenOutput = container.querySelector('.token-value')
      expect(tokenOutput).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should save state to localStorage', async () => {
    const { container } = render(JwtEncoderTool)

    // Trigger token generation which also saves state
    const payloadTextarea = container.querySelectorAll('.input-textarea')[1]
    await fireEvent.input(payloadTextarea, { target: { value: '{"test":1}' } })

    // Wait for debouncedGenerate (300ms) + saveState debounce (500ms) + buffer
    await new Promise(resolve => setTimeout(resolve, 900))

    expect(localStorage.getItem('devutils-jwt-encoder-payload')).toBeTruthy()
  })

  it('should handle localStorage failures gracefully in private browsing', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    const { container } = render(JwtEncoderTool)

    // Trigger save by modifying payload
    const payloadTextarea = container.querySelectorAll('.input-textarea')[1]
    await fireEvent.input(payloadTextarea, { target: { value: '{"test":1}' } })

    // Wait for debouncedGenerate (300ms) + saveState debounce (500ms) + buffer
    await new Promise(resolve => setTimeout(resolve, 900))

    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Failed to save state'), expect.anything())

    setItem.mockRestore()
    consoleError.mockRestore()
  })

  it('should have default header with HS256', async () => {
    const { container } = render(JwtEncoderTool)

    const headerTextarea = container.querySelectorAll('.input-textarea')[0]
    expect(headerTextarea?.value).toContain('HS256')
  })

  it('should display generated token', async () => {
    const { container } = render(JwtEncoderTool)

    // Trigger token generation
    const payloadTextarea = container.querySelectorAll('.input-textarea')[1]
    await fireEvent.input(payloadTextarea, { target: { value: '{"sub":"123"}' } })

    await waitFor(() => {
      expect(screen.getByText('Generated JWT Token')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should generate token with 3 dot-separated segments', async () => {
    const { container } = render(JwtEncoderTool)

    // Trigger token generation
    const payloadTextarea = container.querySelectorAll('.input-textarea')[1]
    await fireEvent.input(payloadTextarea, { target: { value: '{"sub":"123"}' } })

    await waitFor(() => {
      const tokenOutput = container.querySelector('.token-value')
      expect(tokenOutput).toBeInTheDocument()
      const token = tokenOutput?.textContent || ''
      expect(token).toBeTruthy()
      const parts = token.split('.')
      expect(parts).toHaveLength(3)
    }, { timeout: 500 })
  })

  it('should handle very large payloads', async () => {
    const { container } = render(JwtEncoderTool)

    const largePayload = JSON.stringify({ data: 'x'.repeat(10000) })
    const payloadTextarea = container.querySelectorAll('.input-textarea')[1]
    await fireEvent.input(payloadTextarea, { target: { value: largePayload } })

    await waitFor(() => {
      const tokenOutput = container.querySelector('.token-value')
      expect(tokenOutput).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('should handle special characters in secret', async () => {
    const { container } = render(JwtEncoderTool)

    const secretInput = container.querySelector('.secret-input')
    await fireEvent.input(secretInput, { target: { value: '🔐secret🎉ñöü' } })

    await waitFor(() => {
      const tokenOutput = container.querySelector('.token-value')
      expect(tokenOutput).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should cleanup timeouts on unmount', async () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

    const { unmount } = render(JwtEncoderTool)
    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })

  it('should debounce rapid input changes', async () => {
    const { container } = render(JwtEncoderTool)

    const payloadTextarea = container.querySelectorAll('.input-textarea')[1]

    await fireEvent.input(payloadTextarea, { target: { value: '{"a":1}' } })
    await fireEvent.input(payloadTextarea, { target: { value: '{"a":2}' } })
    await fireEvent.input(payloadTextarea, { target: { value: '{"a":3}' } })

    await new Promise(r => setTimeout(r, 50))

    await fireEvent.input(payloadTextarea, { target: { value: '{"a":4}' } })

    await waitFor(() => {
      const tokenOutput = container.querySelector('.token-value')
      expect(tokenOutput).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should toggle secret visibility', async () => {
    const { container } = render(JwtEncoderTool)

    const toggleButton = container.querySelector('.secret-toggle')
    const secretInput = container.querySelector('.secret-input')

    expect(secretInput?.getAttribute('type')).toBe('password')

    await fireEvent.click(toggleButton)

    // After toggling, the DOM updates to show the text input
    const visibleInput = container.querySelector('input[type="text"].secret-input')
    expect(visibleInput).toBeInTheDocument()

    await fireEvent.click(toggleButton)

    // After toggling back, the password input should be back
    const passwordInput = container.querySelector('input[type="password"].secret-input')
    expect(passwordInput).toBeInTheDocument()
  })

  it('should recover from error state after fixing invalid JSON', async () => {
    const { container } = render(JwtEncoderTool)

    const headerTextarea = container.querySelectorAll('.input-textarea')[0]
    await fireEvent.input(headerTextarea, { target: { value: 'invalid json' } })

    await waitFor(() => {
      expect(screen.getByText(/Invalid header JSON/)).toBeInTheDocument()
    }, { timeout: 500 })

    await fireEvent.input(headerTextarea, { target: { value: '{"alg":"HS256"}' } })

    await waitFor(() => {
      expect(screen.queryByText(/Invalid header JSON/)).not.toBeInTheDocument()
      const tokenOutput = container.querySelector('.token-value')
      expect(tokenOutput).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should show detailed error messages', async () => {
    const { container } = render(JwtEncoderTool)

    vi.stubGlobal('crypto', {
      subtle: {
        importKey: vi.fn().mockRejectedValue(new Error('Crypto not available'))
      }
    })

    const payloadTextarea = container.querySelectorAll('.input-textarea')[1]
    await fireEvent.input(payloadTextarea, { target: { value: '{"test":1}' } })

    await waitFor(() => {
      expect(screen.getByText(/Error generating token/)).toBeInTheDocument()
    }, { timeout: 500 })
  })
})
