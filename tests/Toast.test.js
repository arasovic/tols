import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/svelte'
import Toast from '$lib/components/Toast.svelte'

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should not render initially', () => {
    const { container } = render(Toast)
    expect(container.querySelector('.toast')).not.toBeInTheDocument()
  })

  it('should show toast when show() is called', async () => {
    const { component, container } = render(Toast)

    component.show('Test message', 'success')

    await waitFor(() => {
      expect(container.querySelector('.toast')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should display success message', async () => {
    const { component, container } = render(Toast)

    component.show('Operation successful', 'success')

    await waitFor(() => {
      expect(screen.getByText('Operation successful')).toBeInTheDocument()
      expect(container.querySelector('.toast-success')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should display error message', async () => {
    const { component, container } = render(Toast)

    component.show('An error occurred', 'error')

    await waitFor(() => {
      expect(screen.getByText('An error occurred')).toBeInTheDocument()
      expect(container.querySelector('.toast-error')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should display warning message', async () => {
    const { component, container } = render(Toast)

    component.show('Warning message', 'warning')

    await waitFor(() => {
      expect(screen.getByText('Warning message')).toBeInTheDocument()
      expect(container.querySelector('.toast-warning')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should display info message', async () => {
    const { component, container } = render(Toast)

    component.show('Info message', 'info')

    await waitFor(() => {
      expect(screen.getByText('Info message')).toBeInTheDocument()
      expect(container.querySelector('.toast-info')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should close when close button is clicked', async () => {
    const { component, container } = render(Toast)

    component.show('Test message', 'success')

    await waitFor(() => {
      expect(container.querySelector('.toast')).toBeInTheDocument()
    }, { timeout: 500 })

    const closeButton = screen.getByLabelText('Dismiss notification')
    await fireEvent.click(closeButton)

    await waitFor(() => {
      expect(container.querySelector('.toast')).not.toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should auto-close after duration', async () => {
    const { component, container } = render(Toast, { props: { duration: 100 } })

    component.show('Test message', 'success')

    await waitFor(() => {
      expect(container.querySelector('.toast')).toBeInTheDocument()
    }, { timeout: 500 })

    vi.advanceTimersByTime(200)

    await waitFor(() => {
      expect(container.querySelector('.toast')).not.toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should have correct ARIA attributes', async () => {
    const { component } = render(Toast)

    component.show('Test message', 'success')

    await waitFor(() => {
      const toast = screen.getByRole('alert')
      expect(toast).toHaveAttribute('aria-live', 'polite')
    }, { timeout: 500 })
  })

  it('should show progress bar', async () => {
    const { component, container } = render(Toast)

    component.show('Test message', 'success')

    await waitFor(() => {
      expect(container.querySelector('.toast-progress-bar')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should replace existing toast with new one', async () => {
    const { component } = render(Toast)

    component.show('First message', 'success')

    await waitFor(() => {
      expect(screen.getByText('First message')).toBeInTheDocument()
    }, { timeout: 500 })

    component.show('Second message', 'info')

    await waitFor(() => {
      expect(screen.queryByText('First message')).not.toBeInTheDocument()
      expect(screen.getByText('Second message')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should support different positions', () => {
    const positions = ['bottom-right', 'bottom-left', 'top-right', 'top-left', 'top-center', 'bottom-center']

    positions.forEach(pos => {
      // Clean up between iterations
      document.body.innerHTML = ''

      const { component, container } = render(Toast, { props: { position: pos } })
      component.show('Test', 'success')

      const toast = container.querySelector(`.toast-${pos}`)
      expect(toast).toBeTruthy()
    })
  })
})
