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

  it('keeps the closed sidebar out of the tab order and the a11y tree', async () => {
    // The off-canvas panel is hidden by `transform` only, so without `inert` its
    // 32 focusables stay tabbable and focus disappears off the left edge for 32
    // presses on every tool route.
    //
    // This asserts the PROPERTY, not the attribute, and that is deliberate:
    // `inert` is in Svelte 4's attribute_lookup table, so the client compiler
    // emits `aside.inert = value` rather than setAttribute. In a browser the
    // property reflects to the attribute and drives the behaviour; jsdom
    // implements neither, so `hasAttribute('inert')` is false here even though
    // the shipped page is correct. The focus-order effect itself is verified in
    // Chrome, not here — jsdom has no concept of inertness.
    const { container } = render(Layout)
    const sidebar = container.querySelector('.sidebar')
    const focusables = () =>
      sidebar.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])')

    expect(sidebar.inert).toBe(true)
    expect(focusables().length).toBeGreaterThan(0) // the guard is not passing vacuously

    await fireEvent.keyDown(window, { key: 'b', metaKey: true })
    expect(sidebar.inert).toBe(false)

    await fireEvent.keyDown(window, { key: 'Escape' })
    expect(sidebar.inert).toBe(true)
  })
})