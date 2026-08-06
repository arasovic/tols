import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/svelte'
import Panel from '$lib/ui/Panel.svelte'

describe('Panel', () => {
  it('renders no .panel-meta element when meta is empty', () => {
    const { container } = render(Panel, { props: { label: 'stdin' } })
    expect(container.querySelector('.panel-meta')).toBeFalsy()
  })

  it('renders .panel-meta when meta is set', () => {
    const { container } = render(Panel, { props: { label: 'stdin', meta: '12 B' } })
    expect(container.querySelector('.panel-meta')?.textContent.trim()).toBe('12 B')
  })

  it('renders no aria-label when label is empty', () => {
    const { container } = render(Panel)
    const section = container.querySelector('.panel')
    expect(section.hasAttribute('aria-label')).toBe(false)
  })
})
