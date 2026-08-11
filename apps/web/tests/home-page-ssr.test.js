import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/svelte'
import HomePage from '../src/routes/+page.svelte'

vi.mock('$app/paths', () => ({ base: '/dev-utilities' }))
vi.mock('$app/environment', () => ({ browser: false }))

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

afterEach(() => {
  vi.restoreAllMocks()
})

describe('landing page outside the browser', () => {
  it('does not write the theme attribute', () => {
    const setAttribute = vi.spyOn(document.documentElement, 'setAttribute')

    render(HomePage)

    expect(setAttribute).not.toHaveBeenCalledWith('data-theme', expect.anything())
  })
})
