import { describe, it, expect, vi, beforeEach } from 'vitest'
import { copyToClipboard } from '$lib/utils/clipboard'

describe('copyToClipboard', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    })
  })

  it('should copy text to clipboard successfully', async () => {
    const text = 'Hello, World!'
    const result = await copyToClipboard(text)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should handle empty string', async () => {
    const result = await copyToClipboard('')

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('')
    expect(result.success).toBe(true)
  })

  it('should handle special characters', async () => {
    const text = 'Hello! @#$%^&*()'
    const result = await copyToClipboard(text)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text)
    expect(result.success).toBe(true)
  })

  it('should handle Unicode characters', async () => {
    const text = 'Hello, 世界'
    const result = await copyToClipboard(text)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text)
    expect(result.success).toBe(true)
  })

  it('should handle multiline text', async () => {
    const text = `Line 1
Line 2
Line 3`
    const result = await copyToClipboard(text)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text)
    expect(result.success).toBe(true)
  })

  it('should return error when clipboard API fails', async () => {
    const error = new Error('Clipboard access denied')
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(error)
      }
    })

    const result = await copyToClipboard('test')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Clipboard access denied')
  })

  it('should handle very long text', async () => {
    const text = 'a'.repeat(10000)
    const result = await copyToClipboard(text)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text)
    expect(result.success).toBe(true)
  })

  it('should handle HTML-like content', async () => {
    const text = '<div>Test</div>'
    const result = await copyToClipboard(text)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text)
    expect(result.success).toBe(true)
  })

  it('should handle JSON content', async () => {
    const text = '{"key": "value", "num": 123}'
    const result = await copyToClipboard(text)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text)
    expect(result.success).toBe(true)
  })

  it('should return generic error for unknown error types', async () => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockRejectedValue('Unknown error')
      }
    })

    const result = await copyToClipboard('test')

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})
