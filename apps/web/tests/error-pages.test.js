import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import ErrorSurface from '$lib/components/ErrorSurface.svelte'
import ErrorPage from '../src/routes/+error.svelte'
import NotFoundPage from '../src/routes/404/+page.svelte'

vi.mock('$app/paths', () => ({ base: '/dev-utilities' }))
vi.mock('$app/environment', () => ({ browser: true }))
vi.mock('$app/navigation', () => ({ goto: vi.fn() }))
vi.mock('$app/stores', async () => {
  const { writable } = await import('svelte/store')
  return { page: writable({ status: 503 }) }
})

describe('error pages', () => {
  it('renders base-safe recovery actions for a missing route', () => {
    render(ErrorSurface, { props: { status: 404 } })

    expect(screen.getByRole('heading', { level: 1, name: '404' })).toBeInTheDocument()
    expect(screen.getByText('Nothing at this address.')).toBeInTheDocument()
    expect(screen.getByText('The route may have moved, or it may never have existed.'))
      .toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to tols' }))
      .toHaveAttribute('href', '/dev-utilities/')
  })

  it('opens and toggles the tool index from both recovery controls', async () => {
    render(ErrorSurface, { props: { status: 500 } })

    expect(screen.getByText('The page could not be loaded.')).toBeInTheDocument()
    expect(screen.getByText('Return home or open the tool index to keep working.'))
      .toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Open tool index' }))
    expect(await screen.findByRole('dialog', { name: 'Search tools' })).toBeInTheDocument()

    await fireEvent.keyDown(window, { key: 'k', metaKey: true })
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Search tools' })).not.toBeInTheDocument()
    })

    await fireEvent.click(screen.getByRole('button', { name: /all tools/i }))
    expect(await screen.findByRole('dialog', { name: 'Search tools' })).toBeInTheDocument()

    await fireEvent.keyDown(window, { key: 'b', metaKey: true })
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Search tools' })).not.toBeInTheDocument()
    })
  })

  it('renders the current SvelteKit error status through the shared surface', () => {
    render(ErrorPage)

    expect(screen.getByRole('heading', { level: 1, name: '503' })).toBeInTheDocument()
    expect(document.title).toBe('503 — tols')
    expect(document.head.querySelector('meta[name="robots"]'))
      .toHaveAttribute('content', 'noindex')
  })

  it('renders the prerendered not-found route through the shared surface', () => {
    render(NotFoundPage)

    expect(screen.getByRole('heading', { level: 1, name: '404' })).toBeInTheDocument()
    expect(screen.getByText('Nothing at this address.')).toBeInTheDocument()
    expect(document.title).toBe('404 — tols')
  })
})
