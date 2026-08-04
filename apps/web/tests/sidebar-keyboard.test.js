import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { writable } from 'svelte/store'
import Layout from '../src/routes/(app)/+layout.svelte'

vi.mock('$app/stores', () => ({
  page: writable({ url: { pathname: '/dev-utilities/json' } })
}))

vi.mock('$app/paths', () => ({
  base: '/dev-utilities'
}))

vi.mock('$app/environment', () => ({
  browser: true
}))

vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}))

vi.mock('$lib/stores/theme', () => ({
  theme: {
    subscribe: vi.fn((cb) => {
      cb('dark')
      return () => {}
    }),
    toggle: vi.fn()
  }
}))

vi.mock('$lib/stores/recentTools.js', () => ({
  recentTools: {
    subscribe: vi.fn((cb) => {
      cb([])
      return () => {}
    })
  },
  addRecent: vi.fn()
}))

describe('Cmd+B / Ctrl+B sidebar toggle through the app layout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('toggles the sidebar exactly once per Cmd+B press', async () => {
    const { container } = render(Layout)
    const sidebar = container.querySelector('.sidebar')
    expect(sidebar).not.toHaveClass('open')

    await fireEvent.keyDown(window, { key: 'b', metaKey: true })
    expect(sidebar).toHaveClass('open')

    await fireEvent.keyDown(window, { key: 'b', metaKey: true })
    expect(sidebar).not.toHaveClass('open')
  })

  it('toggles the sidebar exactly once per Ctrl+B press', async () => {
    const { container } = render(Layout)
    const sidebar = container.querySelector('.sidebar')

    await fireEvent.keyDown(window, { key: 'b', ctrlKey: true })
    expect(sidebar).toHaveClass('open')

    await fireEvent.keyDown(window, { key: 'b', ctrlKey: true })
    expect(sidebar).not.toHaveClass('open')
  })

  it('still closes the drawer with Escape after Cmd+B opens it', async () => {
    const { container } = render(Layout)
    const sidebar = container.querySelector('.sidebar')

    await fireEvent.keyDown(window, { key: 'b', metaKey: true })
    expect(sidebar).toHaveClass('open')

    await fireEvent.keyDown(window, { key: 'Escape' })
    expect(sidebar).not.toHaveClass('open')
  })
})