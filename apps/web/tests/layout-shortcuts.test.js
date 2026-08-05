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

describe('Cmd+K palette toggle through the app layout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('toggles the search overlay closed on a second Cmd+K', async () => {
    const { container } = render(Layout)
    await fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(container.querySelector('.search-overlay')).not.toBeNull()
    await fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(container.querySelector('.search-overlay')).toBeNull()
  })
})
