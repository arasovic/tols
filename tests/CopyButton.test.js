import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import CopyButton from '$lib/components/CopyButton.svelte'

describe('CopyButton', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render with default props', () => {
    const { container } = render(CopyButton, { props: { text: 'test' } })
    expect(container.querySelector('.copy-btn')).toBeInTheDocument()
  })

  it('should render in different sizes', () => {
    const { container: smContainer } = render(CopyButton, { props: { text: 'test', size: 'sm' } })
    expect(smContainer.querySelector('.copy-btn')).toBeInTheDocument()

    const { container: lgContainer } = render(CopyButton, { props: { text: 'test', size: 'lg' } })
    expect(lgContainer.querySelector('.copy-btn')).toBeInTheDocument()
  })

  it('should have correct aria-label', () => {
    render(CopyButton, { props: { text: 'test' } })
    const button = screen.getByLabelText('Copy to clipboard')
    expect(button).toBeInTheDocument()
  })

  it('should copy text when clicked', async () => {
    render(CopyButton, { props: { text: 'Hello, World!' } })
    const button = screen.getByLabelText('Copy to clipboard')

    await fireEvent.click(button)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hello, World!')
  })

  it('should show copied state after successful copy', async () => {
    render(CopyButton, { props: { text: 'test' } })
    const button = screen.getByLabelText('Copy to clipboard')

    await fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByLabelText('Copied to clipboard')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should dispatch copy event on success', async () => {
    const { component } = render(CopyButton, { props: { text: 'test' } })
    const copyHandler = vi.fn()
    component.$on('copy', copyHandler)

    const button = screen.getByLabelText('Copy to clipboard')
    await fireEvent.click(button)

    await waitFor(() => {
      expect(copyHandler).toHaveBeenCalled()
    }, { timeout: 500 })
  })

  it('should not copy when disabled', async () => {
    render(CopyButton, { props: { text: 'test', disabled: true } })
    const button = screen.getByLabelText('Copy to clipboard')

    await fireEvent.click(button)

    expect(navigator.clipboard.writeText).not.toHaveBeenCalled()
  })

  it('should not copy when text is empty', async () => {
    render(CopyButton, { props: { text: '' } })
    const button = screen.getByLabelText('Copy to clipboard')

    await fireEvent.click(button)

    expect(navigator.clipboard.writeText).not.toHaveBeenCalled()
  })

  it('should handle copy failure', async () => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('Copy failed'))
      }
    })

    const { component } = render(CopyButton, { props: { text: 'test' } })
    const errorHandler = vi.fn()
    component.$on('error', errorHandler)

    const button = screen.getByLabelText('Copy to clipboard')
    await fireEvent.click(button)

    await waitFor(() => {
      expect(errorHandler).toHaveBeenCalled()
    }, { timeout: 500 })
  })

  it('should apply disabled class when disabled', () => {
    const { container } = render(CopyButton, { props: { text: 'test', disabled: true } })
    const button = container.querySelector('.copy-btn')
    expect(button).toHaveClass('disabled')
  })

  it('should reset copied state after timeout', async () => {
    render(CopyButton, { props: { text: 'test' } })
    const button = screen.getByLabelText('Copy to clipboard')

    await fireEvent.click(button)
    await waitFor(() => {
      expect(screen.getByLabelText('Copied to clipboard')).toBeInTheDocument()
    }, { timeout: 500 })

    vi.advanceTimersByTime(2100)

    await waitFor(() => {
      expect(screen.getByLabelText('Copy to clipboard')).toBeInTheDocument()
    }, { timeout: 500 })
  })
})
