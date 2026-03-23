import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import CronTool from '$lib/tools/CronTool.svelte'

describe('CronTool', () => {
  beforeEach(() => {
    localStorage.clear()
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

    await waitFor(() => {
      expect(container.querySelector('.description-panel')).toBeInTheDocument()
    })
  })

  it('should show next execution times', async () => {
    const { container } = render(CronTool)

    await waitFor(() => {
      expect(screen.getByText('Next Execution Times')).toBeInTheDocument()
    })
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

    await new Promise(resolve => setTimeout(resolve, 400))

    expect(screen.getByText(/must have exactly 5 parts/)).toBeInTheDocument()
  })

  it('should describe every minute expression', async () => {
    const { container } = render(CronTool)

    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: '* * * * *' } })

    await new Promise(resolve => setTimeout(resolve, 400))

    const description = container.querySelector('.description-panel')
    expect(description?.textContent).toContain('Every minute')
  })

  it('should describe daily expression', async () => {
    const { container } = render(CronTool)

    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: '0 0 * * *' } })

    await new Promise(resolve => setTimeout(resolve, 400))

    const description = container.querySelector('.description-panel')
    expect(description?.textContent).toContain('Every day')
  })

  it('should show list of next runs', async () => {
    const { container } = render(CronTool)

    await waitFor(() => {
      const runsList = container.querySelector('.runs-list')
      expect(runsList).toBeInTheDocument()
    })
  })

  it('should have copy buttons for run times', async () => {
    const { container } = render(CronTool)

    await waitFor(() => {
      const runItems = container.querySelectorAll('.run-item')
      expect(runItems.length).toBeGreaterThan(0)
    })
  })

  it('should handle step values', async () => {
    const { container } = render(CronTool)

    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: '*/5 * * * *' } })

    await new Promise(resolve => setTimeout(resolve, 400))

    const description = container.querySelector('.description-panel')
    expect(description).toBeInTheDocument()
  })

  it('should handle range values', async () => {
    const { container } = render(CronTool)

    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: '0 9-17 * * 1-5' } })

    await new Promise(resolve => setTimeout(resolve, 400))

    const description = container.querySelector('.description-panel')
    expect(description).toBeInTheDocument()
  })

  it('should show error for invalid range', async () => {
    const { container } = render(CronTool)

    const input = container.querySelector('.cron-input')
    await fireEvent.input(input, { target: { value: '70 * * * *' } })

    await new Promise(resolve => setTimeout(resolve, 400))

    expect(container.querySelector('.error-display')).toBeInTheDocument()
  })
})
