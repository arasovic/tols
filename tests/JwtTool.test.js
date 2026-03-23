import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import JwtTool from '$lib/tools/JwtTool.svelte'

// Import actual decodeJWT to mock it properly
import { decodeJWT } from '$lib/utils/crypto.js'

// Mock the decodeJWT function with actual implementation behavior
vi.mock('$lib/utils/crypto.js', () => ({
  decodeJWT: vi.fn(async (token) => {
    if (!token) return { valid: false, error: 'Please enter a JWT token' }
    if (!token.includes('.')) return { valid: false, error: 'Invalid JWT format: expected 3 parts separated by dots' }

    const parts = token.split('.')
    if (parts.length !== 3) return { valid: false, error: 'Invalid JWT format: expected 3 parts separated by dots' }

    try {
      const header = JSON.parse(atob(parts[0]))
      const payload = JSON.parse(atob(parts[1]))
      const signature = atob(parts[2])
      return { valid: true, header, payload, signature }
    } catch (e) {
      return { valid: false, error: 'Invalid JWT header: unable to decode Base64 or parse JSON' }
    }
  })
}))

describe('JwtTool', () => {
  let component

  beforeEach(() => {
    component = render(JwtTool)
  })

  it('should show placeholder for empty input on mount', () => {
    const inputArea = screen.getByPlaceholderText(/Paste JWT token/i)
    expect(inputArea).toBeInTheDocument()
  })

  it('should decode valid JWT token', async () => {
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

    const inputArea = screen.getByPlaceholderText('Paste JWT token here (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)')
    await fireEvent.input(inputArea, { target: { value: validToken } })

    await waitFor(() => {
      const headerSection = screen.getByText('Header')
      const payloadSection = screen.getByText('Payload')

      expect(headerSection).toBeInTheDocument()
      expect(payloadSection).toBeInTheDocument()
    })
  })

  it('should show error for invalid JWT format', async () => {
    const invalidToken = 'invalid.token'

    const inputArea = screen.getByPlaceholderText('Paste JWT token here (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)')
    await fireEvent.input(inputArea, { target: { value: invalidToken } })

    await waitFor(() => {
      expect(screen.getByText(/Invalid JWT format/i)).toBeInTheDocument()
    })
  })

  it('should display decoded header and payload separately', async () => {
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

    const inputArea = screen.getByPlaceholderText('Paste JWT token here (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)')
    await fireEvent.input(inputArea, { target: { value: validToken } })

    await waitFor(() => {
      const headerSection = screen.getByText('Header')
      const payloadSection = screen.getByText('Payload')

      expect(headerSection).toBeInTheDocument()
      expect(payloadSection).toBeInTheDocument()
    })
  })

  it('should show copy button for decoded content', async () => {
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

    const inputArea = screen.getByPlaceholderText('Paste JWT token here (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)')
    await fireEvent.input(inputArea, { target: { value: validToken } })

    await waitFor(() => {
      const copyButtons = document.querySelectorAll('[aria-label="Copy to clipboard"], [title="Copy"]')
      expect(copyButtons.length).toBeGreaterThan(0)
    })
  })

  it('should show placeholder when no token is entered', () => {
    const inputArea = screen.getByPlaceholderText(/Paste JWT token/i)
    expect(inputArea.value).toBe('')
  })

  it('should clear all fields when clear button is clicked', async () => {
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

    const inputArea = screen.getByPlaceholderText('Paste JWT token here (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)')
    await fireEvent.input(inputArea, { target: { value: validToken } })

    const clearButton = screen.getByTitle('Clear')
    await fireEvent.click(clearButton)

    await waitFor(() => {
      expect(inputArea.value).toBe('')
    })

    expect(inputArea.placeholder).toContain('Paste JWT token')
  })
})
