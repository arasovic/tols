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
    toggle: vi.fn(),
    cycle: vi.fn()
  },
  themePreference: {
    subscribe: vi.fn((cb) => {
      cb('system')
      return () => {}
    })
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

describe('legacy Cmd+B / Ctrl+B tool index shortcut', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('toggles the tool index exactly once per Cmd+B press', async () => {
    const { container } = render(Layout)
    expect(container.querySelector('.search-overlay')).toBeNull()

    await fireEvent.keyDown(window, { key: 'b', metaKey: true })
    expect(container.querySelector('.search-overlay')).not.toBeNull()

    await fireEvent.keyDown(window, { key: 'b', metaKey: true })
    expect(container.querySelector('.search-overlay')).toBeNull()
  })

  it('toggles the tool index exactly once per Ctrl+B press', async () => {
    const { container } = render(Layout)

    await fireEvent.keyDown(window, { key: 'b', ctrlKey: true })
    expect(container.querySelector('.search-overlay')).not.toBeNull()

    await fireEvent.keyDown(window, { key: 'b', ctrlKey: true })
    expect(container.querySelector('.search-overlay')).toBeNull()
  })

  it('closes the tool index with Escape after Cmd+B opens it', async () => {
    const { container } = render(Layout)

    await fireEvent.keyDown(window, { key: 'b', metaKey: true })
    expect(container.querySelector('.search-overlay')).not.toBeNull()

    await fireEvent.keyDown(window, { key: 'Escape' })
    expect(container.querySelector('.search-overlay')).toBeNull()
  })

  it('removes the obsolete off-canvas navigation from the layout', async () => {
    const { container } = render(Layout)
    expect(container.querySelector('.sidebar')).toBeNull()
    expect(container.querySelector('.menu-btn')).toBeNull()
  })
})
