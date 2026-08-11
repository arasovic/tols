import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/svelte'
import { tick } from 'svelte'
import SearchOverlay from '$lib/components/SearchOverlay.svelte'

vi.mock('$app/environment', () => ({ browser: false }))
vi.mock('$app/navigation', () => ({ goto: vi.fn() }))
vi.mock('$app/paths', () => ({ base: '/dev-utilities' }))

describe('SearchOverlay outside the browser', () => {
  it('opens and closes without touching browser-only state', async () => {
    const { component, container } = render(SearchOverlay)

    component.open()
    await tick()
    expect(container.querySelector('.search-overlay')).toBeInTheDocument()

    component.toggle()
    await tick()
    expect(container.querySelector('.search-overlay')).not.toBeInTheDocument()
  })
})
