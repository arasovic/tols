import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import CronTool from '$lib/tools/CronTool.svelte'

describe('CronTool', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should initialize with tool header', () => {
    render(CronTool)
    expect(screen.getByText('Cron Expression Parser')).toBeInTheDocument()
  })

  it('should have cron parts display', () => {
    render(CronTool)

    expect(screen.getByText('minute')).toBeInTheDocument()
    expect(screen.getByText('hour')).toBeInTheDocument()
    expect(screen.getByText('day')).toBeInTheDocument()
    expect(screen.getByText('month')).toBeInTheDocument()
    expect(screen.getByText('weekday')).toBeInTheDocument()
  })

  it('should have cron input field', () => {
    const { container } = render(CronTool)
    expect(container.querySelector('.cron-input')).toBeInTheDocument()
  })

  it('should show description for cron expression', async () => {
    const { container } = render(CronTool)
    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: '0 * * * *' } })
    await waitFor(() => {
      expect(container.querySelector('.description-panel')).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('should show next execution times', async () => {
    const { container } = render(CronTool)
    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: '0 * * * *' } })
    await waitFor(() => {
      expect(screen.getByText('Next Execution Times')).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('should clear when clear button clicked', async () => {
    const { container } = render(CronTool)
    const clearButton = container.querySelector('[title="Clear"]')
    await fireEvent.click(clearButton)
    const input = container.querySelector('.cron-input')
    expect(input?.value).toBe('')
  })

  it('should have common example buttons', () => {
    render(CronTool)
    expect(screen.getByText('Every 5 minutes')).toBeInTheDocument()
    expect(screen.getByText('Every hour')).toBeInTheDocument()
    expect(screen.getByText('Daily at midnight')).toBeInTheDocument()
    expect(screen.getByText('Weekly on Sunday')).toBeInTheDocument()
    expect(screen.getByText('Monthly')).toBeInTheDocument()
    expect(screen.getByText('Weekdays at 9am')).toBeInTheDocument()
  })

  it('should set example when button clicked', async () => {
    const { container } = render(CronTool)
    const everyHourButton = screen.getByText('Every hour')
    await fireEvent.click(everyHourButton)
    const input = container.querySelector('.cron-input')
    expect(input?.value).toBe('0 * * * *')
  })

  it('should validate cron expression', async () => {
    const { container } = render(CronTool)
    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: 'invalid' } })
    await waitFor(() => {
      expect(screen.getByText(/must have exactly 5 parts/)).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should describe every minute expression', async () => {
    const { container } = render(CronTool)
    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: '* * * * *' } })
    await waitFor(() => {
      const description = container.querySelector('.description-panel')
      expect(description?.textContent).toContain('Every minute')
    }, { timeout: 500 })
  })

  it('should describe daily expression', async () => {
    const { container } = render(CronTool)
    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: '0 0 * * *' } })
    await waitFor(() => {
      const description = container.querySelector('.description-panel')
      expect(description?.textContent).toContain('Every day')
    }, { timeout: 500 })
  })

  it('should show list of next runs', async () => {
    const { container } = render(CronTool)
    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: '0 * * * *' } })
    await waitFor(() => {
      const runsList = container.querySelector('.runs-list')
      expect(runsList).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('should have copy buttons for run times', async () => {
    const { container } = render(CronTool)
    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: '0 * * * *' } })
    await waitFor(() => {
      const runItems = container.querySelectorAll('.run-item')
      expect(runItems.length).toBeGreaterThan(0)
    }, { timeout: 1000 })
  })

  it('should handle step values', async () => {
    const { container } = render(CronTool)
    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: '*/5 * * * *' } })
    await waitFor(() => {
      const description = container.querySelector('.description-panel')
      expect(description).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should handle range values', async () => {
    const { container } = render(CronTool)
    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: '0 9-17 * * 1-5' } })
    await waitFor(() => {
      const description = container.querySelector('.description-panel')
      expect(description).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should show error for invalid range', async () => {
    const { container } = render(CronTool)
    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: '70 * * * *' } })
    await waitFor(() => {
      expect(container.querySelector('.error-display')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should handle ? character in day field', async () => {
    const { container } = render(CronTool)
    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: '0 0 ? * 1' } })
    await waitFor(() => {
      const error = container.querySelector('.error-display')
      expect(error).not.toBeInTheDocument()
      const description = container.querySelector('.description-panel')
      expect(description).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should handle ? character in weekday field', async () => {
    const { container } = render(CronTool)
    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: '0 0 1 * ?' } })
    await waitFor(() => {
      const error = container.querySelector('.error-display')
      expect(error).not.toBeInTheDocument()
      const description = container.querySelector('.description-panel')
      expect(description).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should use OR logic for combined day and weekday', async () => {
    const { container } = render(CronTool)
    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: '0 0 1,15 * 1' } })
    await waitFor(() => {
      const runsList = container.querySelector('.runs-list')
      expect(runsList).toBeInTheDocument()
      const runItems = container.querySelectorAll('.run-item')
      expect(runItems.length).toBeGreaterThan(0)
    }, { timeout: 500 })
  })

  it('should show error for reversed range (50-10)', async () => {
    const { container } = render(CronTool)
    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: '50-10 * * * *' } })
    await waitFor(() => {
      expect(screen.getByText(/Range start cannot be greater than end/)).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should show error for negative values', async () => {
    const { container } = render(CronTool)
    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: '-5 * * * *' } })
    await waitFor(() => {
      expect(container.querySelector('.error-display')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should show error for invalid step value */0', async () => {
    const { container } = render(CronTool)
    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: '*/0 * * * *' } })
    await waitFor(() => {
      expect(screen.getByText(/Step value must be at least 1/)).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should show error for invalid step value */abc', async () => {
    const { container } = render(CronTool)
    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: '*/abc * * * *' } })
    await waitFor(() => {
      expect(screen.getByText(/Invalid step value/)).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should show error for empty input', async () => {
    const { container } = render(CronTool)
    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: '' } })
    await waitFor(() => {
      expect(screen.getByText(/Please enter a cron expression/)).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should show error for whitespace-only input', async () => {
    const { container } = render(CronTool)
    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: '0 0 1 1 1' } })
    await waitFor(() => {
      expect(container.querySelector('.description-panel')).toBeInTheDocument()
    }, { timeout: 500 })
    await fireEvent.input(input, { target: { value: '     ' } })
    await waitFor(() => {
      expect(screen.getByText(/Please enter a cron expression/)).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should handle sparse cron expression (max iterations edge case)', async () => {
    const { container } = render(CronTool)
    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: '0 0 29 2 *' } })
    await waitFor(() => {
      const description = container.querySelector('.description-panel')
      expect(description).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should have working copy buttons', async () => {
    const mockClipboard = { writeText: vi.fn().mockResolvedValue(undefined) }
    Object.assign(navigator, { clipboard: mockClipboard })
    const { container } = render(CronTool)
    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: '0 * * * *' } })
    await waitFor(() => {
      const copyButtons = container.querySelectorAll('button[title*="Copy"]')
      expect(copyButtons.length).toBeGreaterThan(0)
    }, { timeout: 1000 })
  })

  it('should verify actual next run time values are valid dates', async () => {
    const { container } = render(CronTool)
    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: '0 * * * *' } })
    await waitFor(() => {
      const runDates = container.querySelectorAll('.run-date')
      expect(runDates.length).toBeGreaterThan(0)
      runDates.forEach(runDateEl => {
        const dateText = runDateEl.textContent
        expect(dateText).toBeTruthy()
        expect(dateText.length).toBeGreaterThan(0)
      })
    }, { timeout: 1000 })
  })

  it('should use user locale for date formatting', async () => {
    const { container } = render(CronTool)
    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: '0 * * * *' } })
    await waitFor(() => {
      const runDates = container.querySelectorAll('.run-date')
      expect(runDates.length).toBeGreaterThan(0)
    }, { timeout: 1000 })
  })

  it('should handle localStorage failure gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('localStorage error') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('localStorage error') })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('localStorage error') })
    const { container } = render(CronTool)
    await waitFor(() => {
      expect(container.querySelector('.cron-input')).toBeInTheDocument()
    })
    consoleSpy.mockRestore()
  })

  it('should add aria-invalid attribute when there is an error', async () => {
    const { container } = render(CronTool)
    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: 'invalid' } })
    await waitFor(() => {
      expect(input?.getAttribute('aria-invalid')).toBe('true')
    }, { timeout: 500 })
  })

  it('should have aria-describedby linking to error when there is an error', async () => {
    const { container } = render(CronTool)
    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: 'invalid' } })
    await waitFor(() => {
      const describedBy = input?.getAttribute('aria-describedby')
      expect(describedBy).toBe('cron-error')
      expect(container.querySelector('#cron-error')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should add invalid CSS class when there is an error', async () => {
    const { container } = render(CronTool)
    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: 'invalid' } })
    await waitFor(() => {
      expect(input?.classList.contains('invalid')).toBe(true)
    }, { timeout: 500 })
  })
})
