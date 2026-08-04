import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/svelte'
import HashTool, { DEBOUNCE_DELAY_MS, SAVE_DEBOUNCE_DELAY_MS, MAX_INPUT_LENGTH } from '$lib/tools/HashTool.svelte'

describe('HashTool', () => {
  let component

  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  async function advanceAndFlush(ms) {
    await act(async () => {
      vi.advanceTimersByTime(ms)
    })
    // Flush any pending promises
    await Promise.resolve()
    await Promise.resolve()
  }

  it('should accept input for hashing', () => {
    component = render(HashTool)
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')
    expect(inputArea).toBeInTheDocument()
  })

  it('should show empty state for empty input', async () => {
    component = render(HashTool)
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')

    await fireEvent.input(inputArea, { target: { value: 'something' } })
    await advanceAndFlush(DEBOUNCE_DELAY_MS)

    await fireEvent.input(inputArea, { target: { value: '' } })
    await advanceAndFlush(DEBOUNCE_DELAY_MS)

    await waitFor(() => {
      const emptyState = document.querySelector('.empty-state')
      expect(emptyState).not.toBeNull()
    })
  })

  it('should show empty state for whitespace-only input', async () => {
    component = render(HashTool)
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')

    await fireEvent.input(inputArea, { target: { value: '   \t\n  ' } })
    await advanceAndFlush(DEBOUNCE_DELAY_MS)

    await waitFor(() => {
      const emptyState = document.querySelector('.empty-state')
      expect(emptyState).not.toBeNull()
    })
  })

  it('should hash text with SHA-256 algorithm', async () => {
    component = render(HashTool)
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')

    await fireEvent.input(inputArea, { target: { value: 'hello world' } })
    await advanceAndFlush(DEBOUNCE_DELAY_MS + 50)

    await waitFor(() => {
      const hashElement = document.querySelector('.hash-output code')
      expect(hashElement).not.toBeNull()
      expect(hashElement?.textContent).toMatch(/^[a-f0-9]{64}$/)
    })
  })

  it('should hash text with SHA-512 algorithm', async () => {
    component = render(HashTool)
    const sha512Button = screen.getByLabelText('SHA-512 512-bit hash algorithm')
    await fireEvent.click(sha512Button)

    const inputArea = screen.getByPlaceholderText('Enter text to hash...')
    await fireEvent.input(inputArea, { target: { value: 'hello world' } })
    await advanceAndFlush(DEBOUNCE_DELAY_MS + 50)

    await waitFor(() => {
      const hashElement = document.querySelector('.hash-output code')
      expect(hashElement).not.toBeNull()
      expect(hashElement?.textContent).toMatch(/^[a-f0-9]{128}$/)
    })
  })

  it('should hash text with SHA-1 algorithm', async () => {
    component = render(HashTool)
    const sha1Button = screen.getByLabelText('SHA-1 160-bit hash algorithm')
    await fireEvent.click(sha1Button)

    const inputArea = screen.getByPlaceholderText('Enter text to hash...')
    await fireEvent.input(inputArea, { target: { value: 'hello world' } })
    await advanceAndFlush(DEBOUNCE_DELAY_MS + 50)

    await waitFor(() => {
      const hashElement = document.querySelector('.hash-output code')
      expect(hashElement).not.toBeNull()
      expect(hashElement?.textContent).toMatch(/^[a-f0-9]{40}$/)
    })
  })

  it('should hash text with MD5 algorithm', async () => {
    component = render(HashTool)
    const md5Button = screen.getByLabelText('MD5 128-bit hash algorithm')
    await fireEvent.click(md5Button)

    const inputArea = screen.getByPlaceholderText('Enter text to hash...')
    await fireEvent.input(inputArea, { target: { value: 'hello world' } })
    await advanceAndFlush(DEBOUNCE_DELAY_MS + 50)

    await waitFor(() => {
      const hashElement = document.querySelector('.hash-output code')
      expect(hashElement).not.toBeNull()
      expect(hashElement?.textContent).toMatch(/^[a-f0-9]{32}$/)
    })
  })

  it('should update hash algorithm display when algorithm changes', async () => {
    component = render(HashTool)

    const initialHashTypeElement = document.querySelector('.hash-type')
    expect(initialHashTypeElement).not.toBeNull()
    expect(initialHashTypeElement?.textContent).toBe('SHA-256')

    const sha1Button = screen.getByLabelText('SHA-1 160-bit hash algorithm')
    await fireEvent.click(sha1Button)

    await advanceAndFlush(DEBOUNCE_DELAY_MS)

    const updatedHashTypeElement = document.querySelector('.hash-type')
    expect(updatedHashTypeElement).not.toBeNull()
    expect(updatedHashTypeElement?.textContent).toBe('SHA-1')
  })

  it('should clear all fields when clear button is clicked', async () => {
    component = render(HashTool)
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')

    await fireEvent.input(inputArea, { target: { value: 'test text' } })
    await advanceAndFlush(DEBOUNCE_DELAY_MS + 50)

    const clearButton = screen.getByLabelText('Clear all fields')
    await fireEvent.click(clearButton)

    expect(inputArea).toHaveValue('')

    await waitFor(() => {
      const emptyState = document.querySelector('.empty-state')
      expect(emptyState).not.toBeNull()
    })
  })

  it('should debounce input changes', async () => {
    component = render(HashTool)
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')

    await fireEvent.input(inputArea, { target: { value: 'test' } })
    await fireEvent.input(inputArea, { target: { value: 'test 2' } })
    await fireEvent.input(inputArea, { target: { value: 'test 3' } })

    await advanceAndFlush(DEBOUNCE_DELAY_MS + 100)

    await waitFor(() => {
      const updatedHashElement = document.querySelector('.hash-output code')
      expect(updatedHashElement).not.toBeNull()
      expect(updatedHashElement?.textContent).toMatch(/^[a-f0-9]+$/)
    })
  })

  it('should handle special characters in input', async () => {
    component = render(HashTool)
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')

    await fireEvent.input(inputArea, { target: { value: 'test@#$%^&*()_+<>?' } })
    await advanceAndFlush(DEBOUNCE_DELAY_MS + 50)

    await waitFor(() => {
      const hashElement = document.querySelector('.hash-output code')
      expect(hashElement).not.toBeNull()
      expect(hashElement?.textContent).toMatch(/^[a-f0-9]+$/)
    })
  })

  it('should handle Unicode characters in input', async () => {
    component = render(HashTool)
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')

    await fireEvent.input(inputArea, { target: { value: 'Hello 世界 🌍 émojis' } })
    await advanceAndFlush(DEBOUNCE_DELAY_MS + 50)

    await waitFor(() => {
      const hashElement = document.querySelector('.hash-output code')
      expect(hashElement).not.toBeNull()
      expect(hashElement?.textContent).toMatch(/^[a-f0-9]+$/)
      expect(hashElement?.textContent).toHaveLength(64)
    })
  })

  it('should handle newlines in input', async () => {
    component = render(HashTool)
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')

    await fireEvent.input(inputArea, { target: { value: 'line1\nline2\nline3' } })
    await advanceAndFlush(DEBOUNCE_DELAY_MS + 50)

    await waitFor(() => {
      const hashElement = document.querySelector('.hash-output code')
      expect(hashElement).not.toBeNull()
      expect(hashElement?.textContent).toMatch(/^[a-f0-9]{64}$/)
    })
  })

  it('should produce consistent hashes for same input', async () => {
    component = render(HashTool)
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')

    await fireEvent.input(inputArea, { target: { value: 'consistent test' } })
    await advanceAndFlush(DEBOUNCE_DELAY_MS + 100)

    let firstHash
    await waitFor(() => {
      const hashElement = document.querySelector('.hash-output code')
      expect(hashElement).not.toBeNull()
      firstHash = hashElement?.textContent
    })

    const clearButton = screen.getByLabelText('Clear all fields')
    await fireEvent.click(clearButton)

    await advanceAndFlush(DEBOUNCE_DELAY_MS)

    await fireEvent.input(inputArea, { target: { value: 'consistent test' } })
    await advanceAndFlush(DEBOUNCE_DELAY_MS + 100)

    await waitFor(() => {
      const updatedHashElement = document.querySelector('.hash-output code')
      expect(updatedHashElement).not.toBeNull()
      const secondHash = updatedHashElement?.textContent
      expect(firstHash).toBe(secondHash)
    })
  })

  it('should produce different hashes for different algorithms', async () => {
    component = render(HashTool)
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')

    await fireEvent.input(inputArea, { target: { value: 'test input' } })
    await advanceAndFlush(DEBOUNCE_DELAY_MS + 50)

    let sha256Hash
    await waitFor(() => {
      const hashElement = document.querySelector('.hash-output code')
      expect(hashElement).not.toBeNull()
      sha256Hash = hashElement?.textContent
    })

    const sha1Button = screen.getByLabelText('SHA-1 160-bit hash algorithm')
    await fireEvent.click(sha1Button)
    await advanceAndFlush(DEBOUNCE_DELAY_MS + 50)

    await waitFor(() => {
      const sha1HashElement = document.querySelector('.hash-output code')
      expect(sha1HashElement).not.toBeNull()
      const sha1Hash = sha1HashElement?.textContent
      expect(sha256Hash).not.toBe(sha1Hash)
      expect(sha256Hash).toHaveLength(64)
      expect(sha1Hash).toHaveLength(40)
    })
  })

  it('should save state to localStorage', async () => {
    component = render(HashTool)
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')

    await fireEvent.input(inputArea, { target: { value: 'test for localstorage' } })
    await advanceAndFlush(DEBOUNCE_DELAY_MS)

    const sha1Button = screen.getByLabelText('SHA-1 160-bit hash algorithm')
    await fireEvent.click(sha1Button)

    // Wait for both hash debounce and save debounce
    await advanceAndFlush(SAVE_DEBOUNCE_DELAY_MS + 100)

    expect(localStorage.getItem('devutils-hash-input')).toBe('test for localstorage')
    expect(localStorage.getItem('devutils-hash-algorithm')).toBe('SHA-1')
  })

  it('should clear localStorage when clear button is clicked', async () => {
    component = render(HashTool)
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')

    // Wait for initial mount debounce to complete
    await advanceAndFlush(DEBOUNCE_DELAY_MS + SAVE_DEBOUNCE_DELAY_MS + 100)

    await fireEvent.input(inputArea, { target: { value: 'test for localstorage' } })
    // Wait for debouncedHash (DEBOUNCE_DELAY_MS) + saveState's debounce (SAVE_DEBOUNCE_DELAY_MS)
    await advanceAndFlush(DEBOUNCE_DELAY_MS + SAVE_DEBOUNCE_DELAY_MS + 100)

    expect(localStorage.getItem('devutils-hash-input')).toBe('test for localstorage')

    const clearButton = screen.getByLabelText('Clear all fields')
    await fireEvent.click(clearButton)

    expect(localStorage.getItem('devutils-hash-input')).toBeNull()
    expect(localStorage.getItem('devutils-hash-algorithm')).toBeNull()
  })

  it('should show character count for input', async () => {
    component = render(HashTool)
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')

    await fireEvent.input(inputArea, { target: { value: 'hello' } })

    const charCount = screen.getByTestId('input-char-count')
    expect(charCount.textContent).toBe('5 chars')
  })

  it('should show character count for output', async () => {
    component = render(HashTool)
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')

    await fireEvent.input(inputArea, { target: { value: 'hello' } })
    await advanceAndFlush(DEBOUNCE_DELAY_MS + 50)

    await waitFor(() => {
      const outputCharCount = screen.getByTestId('output-char-count')
      expect(outputCharCount.textContent).toBe('64 chars')
    })
  })

  it('should have proper accessibility attributes on algorithm selector', () => {
    component = render(HashTool)

    const radiogroup = screen.getByRole('radiogroup', { name: 'Hash algorithm selection' })
    expect(radiogroup).toBeInTheDocument()

    const sha256Button = screen.getByRole('radio', { name: 'SHA-256 256-bit hash algorithm' })
    expect(sha256Button).toHaveAttribute('aria-checked', 'true')

    const md5Button = screen.getByRole('radio', { name: 'MD5 128-bit hash algorithm' })
    expect(md5Button).toHaveAttribute('aria-checked', 'false')
  })

  it('should update aria-checked when algorithm changes', async () => {
    component = render(HashTool)

    const sha256Button = screen.getByRole('radio', { name: 'SHA-256 256-bit hash algorithm' })
    const md5Button = screen.getByRole('radio', { name: 'MD5 128-bit hash algorithm' })

    expect(sha256Button).toHaveAttribute('aria-checked', 'true')
    expect(md5Button).toHaveAttribute('aria-checked', 'false')

    await fireEvent.click(md5Button)

    expect(sha256Button).toHaveAttribute('aria-checked', 'false')
    expect(md5Button).toHaveAttribute('aria-checked', 'true')
  })

  it('should have aria-live on output panel', () => {
    component = render(HashTool)

    const outputPanel = document.querySelector('.output-panel')
    expect(outputPanel).not.toBeNull()
    expect(outputPanel).toHaveAttribute('aria-live', 'polite')
    expect(outputPanel).toHaveAttribute('aria-atomic', 'true')
  })

  it('should have aria-label on icon buttons', () => {
    component = render(HashTool)

    const loadExampleButton = screen.getByLabelText('Load example text')
    expect(loadExampleButton).toBeInTheDocument()

    const clearButton = screen.getByLabelText('Clear all fields')
    expect(clearButton).toBeInTheDocument()
  })

  it('should disable copy button when no output', async () => {
    component = render(HashTool)
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')

    await fireEvent.input(inputArea, { target: { value: '' } })
    await advanceAndFlush(DEBOUNCE_DELAY_MS)

    const copyButton = screen.getByLabelText('Copy to clipboard')
    expect(copyButton).toBeDisabled()
  })

  it('should enable copy button when there is output', async () => {
    component = render(HashTool)
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')

    await fireEvent.input(inputArea, { target: { value: 'test' } })
    await advanceAndFlush(DEBOUNCE_DELAY_MS + 50)

    await waitFor(() => {
      const copyButton = screen.getByLabelText('Copy to clipboard')
      expect(copyButton).not.toBeDisabled()
    })
  })

  it('should load example text when load example button is clicked', async () => {
    component = render(HashTool)

    const loadExampleButton = screen.getByLabelText('Load example text')
    await fireEvent.click(loadExampleButton)
    await advanceAndFlush(DEBOUNCE_DELAY_MS + 50)

    const inputArea = screen.getByPlaceholderText('Enter text to hash...')
    expect(inputArea).toHaveValue('Hello World')

    await waitFor(() => {
      const hashElement = document.querySelector('.hash-output code')
      expect(hashElement).not.toBeNull()
      expect(hashElement?.textContent).toMatch(/^[a-f0-9]{64}$/)
    })
  })

  it('should handle large input efficiently', async () => {
    component = render(HashTool)
    const largeInput = 'a'.repeat(10000)
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')

    await fireEvent.input(inputArea, { target: { value: largeInput } })
    await advanceAndFlush(DEBOUNCE_DELAY_MS + 100)

    await waitFor(() => {
      const hashElement = document.querySelector('.hash-output code')
      expect(hashElement).not.toBeNull()
      expect(hashElement?.textContent).toMatch(/^[a-f0-9]{64}$/)
    })

    const charCount = screen.getByTestId('input-char-count')
    expect(charCount.textContent).toBe('10000 chars')
  })

  it('should have maxlength attribute on textarea', () => {
    component = render(HashTool)

    const inputArea = screen.getByPlaceholderText('Enter text to hash...')
    expect(inputArea).toHaveAttribute('maxlength', MAX_INPUT_LENGTH.toString())
  })

  it('should cleanup timeouts on unmount', async () => {
    component = render(HashTool)
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')

    await fireEvent.input(inputArea, { target: { value: 'test' } })

    cleanup()

    vi.advanceTimersByTime(1000)

    expect(() => vi.advanceTimersByTime(1000)).not.toThrow()
  })

  // Error handling tests
  it('should display error state when hash calculation fails', async () => {
    // Mock crypto.subtle.digest to throw an error
    const originalDigest = global.crypto.subtle.digest
    global.crypto.subtle.digest = vi.fn().mockRejectedValue(new Error('Hash failed'))

    component = render(HashTool)
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')

    await fireEvent.input(inputArea, { target: { value: 'test' } })
    await advanceAndFlush(DEBOUNCE_DELAY_MS + 100)

    // Wait for async error handling
    await waitFor(() => {
      const errorState = screen.queryByTestId('error-state')
      expect(errorState).toBeInTheDocument()
    })

    const errorState = screen.queryByTestId('error-state')
    expect(errorState?.textContent).toContain('Hash calculation failed')

    // Restore original digest
    global.crypto.subtle.digest = originalDigest
  })

  it('should clear output when hash fails', async () => {
    component = render(HashTool)
    const inputArea = screen.getByPlaceholderText('Enter text to hash...')

    // First create a successful hash
    await fireEvent.input(inputArea, { target: { value: 'test' } })
    await advanceAndFlush(DEBOUNCE_DELAY_MS + 100)

    // Wait for hash to appear
    await waitFor(() => {
      expect(document.querySelector('.hash-output code')).toBeInTheDocument()
    })

    // Now mock failure and change input
    const originalDigest = global.crypto.subtle.digest
    global.crypto.subtle.digest = vi.fn().mockRejectedValue(new Error('Hash failed'))

    await fireEvent.input(inputArea, { target: { value: 'test2' } })
    await advanceAndFlush(DEBOUNCE_DELAY_MS + 100)

    await waitFor(() => {
      const hashOutput = document.querySelector('.hash-output')
      expect(hashOutput).toBeNull()
    })

    global.crypto.subtle.digest = originalDigest
  })

  // Keyboard accessibility tests
  it('should activate algorithm with Enter key', async () => {
    component = render(HashTool)
    const md5Button = screen.getByRole('radio', { name: 'MD5 128-bit hash algorithm' })

    expect(md5Button).toHaveAttribute('aria-checked', 'false')

    await fireEvent.keyDown(md5Button, { key: 'Enter' })

    expect(md5Button).toHaveAttribute('aria-checked', 'true')
  })

  it('should activate algorithm with Space key', async () => {
    component = render(HashTool)
    const sha1Button = screen.getByRole('radio', { name: 'SHA-1 160-bit hash algorithm' })

    expect(sha1Button).toHaveAttribute('aria-checked', 'false')

    await fireEvent.keyDown(sha1Button, { key: ' ' })

    expect(sha1Button).toHaveAttribute('aria-checked', 'true')
  })

  it('should navigate to next algorithm with ArrowRight key', async () => {
    component = render(HashTool)
    const sha256Button = screen.getByRole('radio', { name: 'SHA-256 256-bit hash algorithm' })
    const sha512Button = screen.getByRole('radio', { name: 'SHA-512 512-bit hash algorithm' })

    // SHA-256 is selected by default
    expect(sha256Button).toHaveAttribute('aria-checked', 'true')
    expect(sha512Button).toHaveAttribute('aria-checked', 'false')

    // ArrowRight from SHA-256 should move to SHA-512
    await fireEvent.keyDown(sha256Button, { key: 'ArrowRight' })

    expect(sha256Button).toHaveAttribute('aria-checked', 'false')
    expect(sha512Button).toHaveAttribute('aria-checked', 'true')
  })

  it('should navigate to previous algorithm with ArrowLeft key', async () => {
    component = render(HashTool)
    const md5Button = screen.getByRole('radio', { name: 'MD5 128-bit hash algorithm' })

    // Click MD5 first
    await fireEvent.click(md5Button)
    expect(md5Button).toHaveAttribute('aria-checked', 'true')

    const sha1Button = screen.getByRole('radio', { name: 'SHA-1 160-bit hash algorithm' })

    // ArrowLeft from MD5 should move to SHA-1
    await fireEvent.keyDown(md5Button, { key: 'ArrowLeft' })

    expect(md5Button).toHaveAttribute('aria-checked', 'false')
    expect(sha1Button).toHaveAttribute('aria-checked', 'true')
  })

  it('should navigate with ArrowUp key', async () => {
    component = render(HashTool)
    const md5Button = screen.getByRole('radio', { name: 'MD5 128-bit hash algorithm' })

    // Click MD5 first
    await fireEvent.click(md5Button)

    const sha1Button = screen.getByRole('radio', { name: 'SHA-1 160-bit hash algorithm' })

    // ArrowUp from MD5 should move to SHA-1
    await fireEvent.keyDown(md5Button, { key: 'ArrowUp' })

    expect(md5Button).toHaveAttribute('aria-checked', 'false')
    expect(sha1Button).toHaveAttribute('aria-checked', 'true')
  })

  it('should navigate with ArrowDown key', async () => {
    component = render(HashTool)
    const sha256Button = screen.getByRole('radio', { name: 'SHA-256 256-bit hash algorithm' })
    const sha512Button = screen.getByRole('radio', { name: 'SHA-512 512-bit hash algorithm' })

    // ArrowDown from SHA-256 should move to SHA-512
    await fireEvent.keyDown(sha256Button, { key: 'ArrowDown' })

    expect(sha256Button).toHaveAttribute('aria-checked', 'false')
    expect(sha512Button).toHaveAttribute('aria-checked', 'true')
  })

  it('should wrap around navigation with arrow keys', async () => {
    component = render(HashTool)
    const sha256Button = screen.getByRole('radio', { name: 'SHA-256 256-bit hash algorithm' })
    const md5Button = screen.getByRole('radio', { name: 'MD5 128-bit hash algorithm' })

    // MD5 is at the end of the list
    await fireEvent.click(md5Button)
    expect(md5Button).toHaveAttribute('aria-checked', 'true')

    // ArrowRight from MD5 should wrap to SHA-256
    await fireEvent.keyDown(md5Button, { key: 'ArrowRight' })

    expect(md5Button).toHaveAttribute('aria-checked', 'false')
    expect(sha256Button).toHaveAttribute('aria-checked', 'true')
  })

  // Import verification test
  it('should export debounce constants', () => {
    expect(DEBOUNCE_DELAY_MS).toBe(150)
    expect(SAVE_DEBOUNCE_DELAY_MS).toBe(500)
    expect(MAX_INPUT_LENGTH).toBe(100000)
  })
})
