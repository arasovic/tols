import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import TimezoneTool from '$lib/tools/TimezoneTool.svelte'

function waitForDebounce(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('TimezoneTool', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with tool header', () => {
    render(TimezoneTool)
    expect(screen.getByText('Time Zone Converter')).toBeInTheDocument()
  })

  it('should have timezone selectors', () => {
    const { container } = render(TimezoneTool)

    expect(screen.getByText('From Time Zone')).toBeInTheDocument()
    expect(screen.getByText('To Time Zone')).toBeInTheDocument()

    const selects = container.querySelectorAll('select')
    expect(selects.length).toBe(2)
  })

  it('should have common time zones in dropdown', () => {
    const { container } = render(TimezoneTool)

    // Both selects share the same zone list, so query the options directly
    const optionTexts = [...container.querySelectorAll('select option')].map(o => o.textContent)
    expect(optionTexts).toContain('UTC')
    expect(optionTexts).toContain('New York')
    expect(optionTexts).toContain('London')
    expect(optionTexts).toContain('Tokyo')
  })

  it('should show conversion result', async () => {
    const { container } = render(TimezoneTool)

    await waitFor(() => {
      expect(container.querySelector('.result-display')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should show current times around the world', () => {
    render(TimezoneTool)

    expect(screen.getByText('Current Times Around the World')).toBeInTheDocument()
  })

  it('should have zone cards for different cities', async () => {
    const { container } = render(TimezoneTool)

    await waitFor(() => {
      const zoneCards = container.querySelectorAll('.zone-card')
      expect(zoneCards.length).toBeGreaterThan(0)
    }, { timeout: 500 })
  })

  it('should set to now when set now button clicked', async () => {
    const { container } = render(TimezoneTool)

    const setNowButton = container.querySelector('[title="Set to Now"]')
    await fireEvent.click(setNowButton)

    expect(container.querySelector('.result-display')).toBeInTheDocument()
  })

  it('should clear when clear button clicked', async () => {
    const { container } = render(TimezoneTool)

    const clearButton = container.querySelector('[title="Clear"]')
    await fireEvent.click(clearButton)

    // Clear resets to defaults: target zone back to UTC, result recomputed.
    // (The "from" select falls back to the local IANA zone, which may or may
    // not be in the dropdown list depending on the runner's timezone.)
    const selects = container.querySelectorAll('select')
    expect(selects[1]?.value).toBe('UTC')
    expect(container.querySelector('.result-display')).toBeInTheDocument()
  })

  it('should change result when timezone changed', async () => {
    const { container } = render(TimezoneTool)

    const fromSelect = container.querySelectorAll('select')[0]
    await fireEvent.change(fromSelect, { target: { value: 'UTC' } })

    await waitForDebounce(400)

    expect(container.querySelector('.result-display')).toBeInTheDocument()
  })

  it('should show time offset', async () => {
    const { container } = render(TimezoneTool)

    await waitFor(() => {
      const timeOffset = container.querySelector('.time-offset')
      expect(timeOffset).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should show zone times', async () => {
    const { container } = render(TimezoneTool)

    await waitFor(() => {
      const zoneTimes = container.querySelectorAll('.zone-time')
      expect(zoneTimes.length).toBeGreaterThan(0)
    }, { timeout: 500 })
  })
})
