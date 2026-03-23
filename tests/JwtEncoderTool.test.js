import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import JwtEncoderTool from '$lib/tools/JwtEncoderTool.svelte'

describe('JwtEncoderTool', () => {
  beforeEach(() => {
    localStorage.clear()
    // Scoped crypto stub per test
    vi.stubGlobal('crypto', {
      subtle: {
        importKey: vi.fn().mockResolvedValue({}),
        sign: vi.fn().mockResolvedValue(new ArrayBuffer(32))
      }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should initialize with tool header', () => {
    render(JwtEncoderTool)
    expect(screen.getByText('JWT Encoder')).toBeInTheDocument()
  })

  it('should have header, payload, and secret inputs', () => {
    const { container } = render(JwtEncoderTool)

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

    await waitFor(() => {
      const tokenOutput = container.querySelector('.token-value')
      expect(tokenOutput).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should clear all fields when clear button clicked', async () => {
    const { container } = render(JwtEncoderTool)

    const clearButton = container.querySelector('[title="Clear"]')
    await fireEvent.click(clearButton)

    const headerTextarea = container.querySelectorAll('.input-textarea')[0]
    expect(headerTextarea?.value).toBe('')
  })

  it('should load example when load example button clicked', async () => {
    const { container } = render(JwtEncoderTool)

    const loadExampleButton = container.querySelector('[title="Load Example"]')
    await fireEvent.click(loadExampleButton)

    const headerTextarea = container.querySelectorAll('.input-textarea')[0]
    expect(headerTextarea?.value).toContain('alg')
    expect(headerTextarea?.value).toContain('HS256')
  })

  it('should save state to localStorage', async () => {
    render(JwtEncoderTool)

    await waitFor(() => {
      expect(localStorage.getItem('devutils-jwt-encoder-header')).toBeTruthy()
    }, { timeout: 700 })
  })

  it('should have default header with HS256', async () => {
    const { container } = render(JwtEncoderTool)

    const headerTextarea = container.querySelectorAll('.input-textarea')[0]
    expect(headerTextarea?.value).toContain('HS256')
  })

  it('should display generated token', async () => {
    const { container } = render(JwtEncoderTool)

    await waitFor(() => {
      expect(screen.getByText('Generated JWT Token')).toBeInTheDocument()
    }, { timeout: 500 })
  })
})
