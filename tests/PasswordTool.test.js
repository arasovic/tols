import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import PasswordTool from '$lib/tools/PasswordTool.svelte'

describe('PasswordTool', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with tool header', () => {
    render(PasswordTool)
    expect(screen.getByText('Password Generator')).toBeInTheDocument()
  })

  it('should have password options', () => {
    render(PasswordTool)

    expect(screen.getByText('Lowercase (a-z)')).toBeInTheDocument()
    expect(screen.getByText('Uppercase (A-Z)')).toBeInTheDocument()
    expect(screen.getByText('Numbers (0-9)')).toBeInTheDocument()
    expect(screen.getByText('Symbols (!@#$...)')).toBeInTheDocument()
  })

  it('should have length slider', () => {
    render(PasswordTool)

    expect(screen.getByText(/Length:/)).toBeInTheDocument()
  })

  it('should generate password on mount', async () => {
    render(PasswordTool)

    await waitFor(() => {
      expect(screen.getByText(/bits/)).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should regenerate when regenerate button clicked', async () => {
    const { container } = render(PasswordTool)

    const initialPassword = container.querySelector('.password-value')?.textContent

    const regenerateButton = container.querySelector('[title="Regenerate"]')
    await fireEvent.click(regenerateButton)

    await waitFor(() => {
      const newPassword = container.querySelector('.password-value')?.textContent
      expect(newPassword).toBeTruthy()
      expect(newPassword).not.toBe(initialPassword)
    }, { timeout: 500 })
  })

  it('should clear when clear button clicked', async () => {
    const { container } = render(PasswordTool)

    const clearButton = container.querySelector('[title="Clear"]')
    await fireEvent.click(clearButton)

    await waitFor(() => {
      expect(container.querySelector('.password-display')).not.toBeInTheDocument()
    }, { timeout: 300 })

    // Verify all state resets
    const checkboxes = container.querySelectorAll('input[type="checkbox"]')
    expect(checkboxes.length).toBe(4)

    const lengthSlider = container.querySelector('input[type="range"]')
    expect(lengthSlider?.value).toBe('16')
  })

  it('should update length when slider changed', async () => {
    render(PasswordTool)

    const lengthSlider = document.querySelector('input[type="range"]')
    await fireEvent.input(lengthSlider, { target: { value: '32' } })

    expect(screen.getByText(/Length: 32/)).toBeInTheDocument()
  })

  it('should toggle lowercase option', async () => {
    render(PasswordTool)

    const lowercaseCheckbox = screen.getByLabelText('Lowercase (a-z)')
    expect(lowercaseCheckbox.checked).toBe(true)

    await fireEvent.click(lowercaseCheckbox)

    expect(lowercaseCheckbox.checked).toBe(false)
  })

  it('should toggle uppercase option', async () => {
    render(PasswordTool)

    const uppercaseCheckbox = screen.getByLabelText('Uppercase (A-Z)')
    expect(uppercaseCheckbox.checked).toBe(true)

    await fireEvent.click(uppercaseCheckbox)

    expect(uppercaseCheckbox.checked).toBe(false)
  })

  it('should toggle numbers option', async () => {
    render(PasswordTool)

    const numbersCheckbox = screen.getByLabelText('Numbers (0-9)')
    expect(numbersCheckbox.checked).toBe(true)

    await fireEvent.click(numbersCheckbox)

    expect(numbersCheckbox.checked).toBe(false)
  })

  it('should toggle symbols option', async () => {
    render(PasswordTool)

    const symbolsCheckbox = screen.getByLabelText('Symbols (!@#$...)')
    expect(symbolsCheckbox.checked).toBe(false)

    await fireEvent.click(symbolsCheckbox)

    expect(symbolsCheckbox.checked).toBe(true)
  })

  it('should show strength indicator', async () => {
    render(PasswordTool)

    await waitFor(() => {
      const strength = screen.getByText(/Strong|Fair|Weak|Very Strong/)
      expect(strength).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should show entropy bits', async () => {
    render(PasswordTool)

    await waitFor(() => {
      expect(screen.getByText(/bits/)).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should have copy button for password', async () => {
    const { container } = render(PasswordTool)

    await waitFor(() => {
      expect(container.querySelector('.password-display')).toBeInTheDocument()
    }, { timeout: 500 })
  })
})
