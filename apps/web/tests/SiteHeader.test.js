import { existsSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/svelte'
import SiteHeader from '$lib/components/SiteHeader.svelte'

vi.mock('$app/paths', () => ({ base: '/dev-utilities' }))

vi.mock('$lib/stores/theme', () => ({
  theme: {
    subscribe: vi.fn((cb) => {
      cb('dark')
      return () => {}
    }),
    cycle: vi.fn()
  },
  themePreference: {
    subscribe: vi.fn((cb) => {
      cb('system')
      return () => {}
    })
  }
}))

describe('SiteHeader', () => {
  it('provides the shared editorial navigation header', () => {
    expect(existsSync('src/lib/components/SiteHeader.svelte')).toBe(true)
  })

  it('links the small wordmark home and carries the current context', () => {
    render(SiteHeader, { props: { context: 'JSON Formatter' } })

    expect(screen.getByRole('link', { name: 'tols' })).toHaveAttribute('href', '/dev-utilities/')
    expect(screen.getByText('JSON Formatter')).toBeInTheDocument()
  })

  it('keeps source and package links visible in the shared navigation', () => {
    render(SiteHeader)

    expect(screen.getByRole('link', { name: 'npm' })).toHaveAttribute('href', 'https://www.npmjs.com/package/tols-cli')
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/arasovic/tols')
  })

  it('opens the tool index from its factual text control', async () => {
    const { component } = render(SiteHeader)
    const onOpen = vi.fn()
    component.$on('openTools', onOpen)

    await fireEvent.click(screen.getByRole('button', { name: /all tools/i }))

    expect(onOpen).toHaveBeenCalledOnce()
  })
})
