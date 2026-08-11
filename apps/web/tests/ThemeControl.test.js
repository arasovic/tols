import { existsSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/svelte'
import { get } from 'svelte/store'
import ThemeControl from '$lib/ui/ThemeControl.svelte'
import { theme, themePreference } from '$lib/stores/theme'

describe('ThemeControl', () => {
  beforeEach(() => {
    theme.set('system')
  })

  it('provides a shared theme preference control', () => {
    expect(existsSync('src/lib/ui/ThemeControl.svelte')).toBe(true)
  })

  it('states the current automatic preference without icon-only chrome', () => {
    render(ThemeControl)

    expect(screen.getByRole('button', { name: 'Theme: auto. Change theme' }))
      .toHaveTextContent('theme / auto')
  })

  it('cycles through explicit and automatic preferences', async () => {
    render(ThemeControl)
    const control = screen.getByRole('button')

    await fireEvent.click(control)
    expect(get(themePreference)).toBe('light')
    expect(control).toHaveTextContent('theme / light')

    await fireEvent.click(control)
    expect(get(themePreference)).toBe('dark')
    expect(control).toHaveTextContent('theme / dark')

    await fireEvent.click(control)
    expect(get(themePreference)).toBe('system')
    expect(control).toHaveTextContent('theme / auto')
  })
})
