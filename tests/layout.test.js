import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/svelte'
import { page } from '$app/stores'
import { addRecent } from '$lib/stores/recentTools.js'
import Layout from '../src/routes/(app)/+layout.svelte'

const { baseMock } = vi.hoisted(() => ({ baseMock: { base: '/dev-utilities' } }))

vi.mock('$app/stores', async () => {
  const { writable } = await import('svelte/store')
  return { page: writable({ url: { pathname: '/dev-utilities/json' } }) }
})

vi.mock('$app/paths', () => ({
  get base() {
    return baseMock.base
  }
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

describe('(app) layout header title', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    baseMock.base = '/dev-utilities'
    page.set({ url: { pathname: '/dev-utilities/json' } })
  })

  it('renders the tool name from the registry for a base-prefixed path', () => {
    const { container } = render(Layout)
    const pageTitle = container.querySelector('.page-title')
    expect(pageTitle.textContent).toBe('JSON Formatter')
    expect(pageTitle.textContent).not.toBe('DevUtils')
  })

  it('records the current tool as recent', () => {
    render(Layout)
    expect(addRecent).toHaveBeenCalledWith('json')
  })

  it('renders the tool name when base is empty (dev mode)', () => {
    baseMock.base = ''
    page.set({ url: { pathname: '/json' } })
    const { container } = render(Layout)
    const pageTitle = container.querySelector('.page-title')
    expect(pageTitle.textContent).toBe('JSON Formatter')
  })

  it('renders the tool name when base is relative (prerender)', () => {
    baseMock.base = '.'
    page.set({ url: { pathname: '/dev-utilities/json' } })
    const { container } = render(Layout)
    const pageTitle = container.querySelector('.page-title')
    expect(pageTitle.textContent).toBe('JSON Formatter')
    expect(addRecent).toHaveBeenCalledWith('json')
  })
})