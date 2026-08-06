import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/svelte'
import { page } from '$app/stores'
import { addRecent } from '$lib/stores/recentTools.js'
import Layout from '../src/routes/(app)/+layout.svelte'
import { labelInNameViolations } from './test-utils.js'

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

  it('gives every labelled control an accessible name containing its visible text', () => {
    // WCAG 2.5.3: `.search-trigger` reads "search ⌘K" and must be reachable by a
    // speech-input user saying "click search". Covers the sidebar too, since the
    // layout renders it.
    const { container } = render(Layout)
    expect(labelInNameViolations(container)).toEqual([])
  })

  it('owns the single <main> and the skip-link target for every tool route', () => {
    // Each of the 30 tool routes used to render its own <main id="main-content">
    // inside this layout's <main class="content">, which is invalid HTML — a
    // document has at most one <main>. The id lives here now.
    const { container } = render(Layout)
    const mains = container.querySelectorAll('main')
    expect(mains.length).toBe(1)
    expect(mains[0].id).toBe('main-content')
    expect(mains[0].classList.contains('content')).toBe(true)
  })

  it('makes the skip-link target focusable', () => {
    // Without tabindex the target exists but focus never lands on it: <main> is
    // not focusable, so activating the link only relocates the sequential focus
    // starting point — activeElement stays on <body>, so there is no focus ring
    // and nothing for a screen reader to announce. Verified in Chrome on the
    // landing page, which had the same shape.
    const { container } = render(Layout)
    const main = container.querySelector('#main-content')
    expect(main.tabIndex).toBe(-1)
    main.focus()
    expect(document.activeElement).toBe(main)
  })
})