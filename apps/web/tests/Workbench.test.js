import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import WorkbenchHarness from './fixtures/WorkbenchHarness.svelte'

describe('Workbench', () => {
  it('labels the panes with their pipe roles', () => {
    const { container } = render(WorkbenchHarness)
    const labels = [...container.querySelectorAll('.panel-label')].map((n) => n.textContent.trim())
    expect(labels).toEqual(['stdin', 'stdout'])
  })

  it('renders slot content into the matching pane', () => {
    const { container } = render(WorkbenchHarness)
    expect(container.querySelector('.panel .editor-textarea')).toBeTruthy()
    expect(container.querySelector('.panel .output-display')?.textContent).toContain('formatted')
  })

  it('shows per-pane metadata', () => {
    const { container } = render(WorkbenchHarness)
    const metas = [...container.querySelectorAll('.panel-meta')].map((n) => n.textContent.trim())
    expect(metas).toEqual(['12 B', '24 B'])
  })

  it('renders the action rail below the panes', () => {
    const { container } = render(WorkbenchHarness)
    const rail = container.querySelector('.action-rail')
    expect(rail).toBeTruthy()
    // Scoped to rail-main: the harness now also has a rail-end action (see the
    // rail-end routing test below), so the unscoped .action-rail count is 3.
    expect(rail.querySelectorAll('.rail-main .btn').length).toBe(2)
  })

  it('marks the primary action', () => {
    const { container } = render(WorkbenchHarness)
    expect(container.querySelector('.btn-primary')?.textContent).toContain('format')
  })

  it('associates each pane label with its region for assistive tech', () => {
    render(WorkbenchHarness)
    expect(screen.getByRole('region', { name: 'stdin' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'stdout' })).toBeInTheDocument()
  })

  it('routes rail-end slot content into .rail-end without swapping it with rail content', () => {
    const { container } = render(WorkbenchHarness)
    const railMain = container.querySelector('.rail-main')
    const railEnd = container.querySelector('.rail-end')

    const railMainLabels = [...railMain.querySelectorAll('.btn')].map((n) => n.textContent.trim())
    const railEndLabels = [...railEnd.querySelectorAll('.btn')].map((n) => n.textContent.trim())

    expect(railMainLabels).toEqual(['format', 'minify'])
    expect(railEndLabels).toEqual(['copy'])
  })
})
