import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import Button from '$lib/ui/Button.svelte'

describe('Button', () => {
  it('renders .btn-primary for the primary variant', () => {
    const { container } = render(Button, { props: { variant: 'primary' } })
    expect(container.querySelector('.btn-primary')).toBeTruthy()
    expect(container.querySelector('.btn-ghost')).toBeFalsy()
  })

  it('renders .btn-ghost for the ghost variant', () => {
    const { container } = render(Button, { props: { variant: 'ghost' } })
    expect(container.querySelector('.btn-ghost')).toBeTruthy()
    expect(container.querySelector('.btn-primary')).toBeFalsy()
  })

  it('sets the DOM disabled property when disabled', () => {
    const { container } = render(Button, { props: { disabled: true } })
    const button = container.querySelector('.btn')
    expect(button.disabled).toBe(true)
  })

  it('suppresses the click handler when disabled', () => {
    // Native HTMLElement.click() honors the disabled state (unlike a raw
    // dispatchEvent(new MouseEvent('click')), which bypasses it) — this is
    // what a real pointer click goes through, so it's the realistic check.
    const handler = vi.fn()
    const { container, component } = render(Button, { props: { disabled: true } })
    component.$on('click', handler)

    container.querySelector('.btn').click()

    expect(handler).not.toHaveBeenCalled()
  })

  it('renders a .kbd element with the given keys when kbd is set', () => {
    const { container } = render(Button, { props: { kbd: '⌘⏎' } })
    const kbd = container.querySelector('.kbd')
    expect(kbd).toBeTruthy()
    expect(kbd.textContent.trim()).toBe('⌘⏎')
  })

  it('renders no .kbd element when kbd is omitted', () => {
    const { container } = render(Button)
    expect(container.querySelector('.kbd')).toBeFalsy()
  })

  it('forwards on:click to the consumer', async () => {
    const handler = vi.fn()
    const { container, component } = render(Button)
    component.$on('click', handler)

    await fireEvent.click(container.querySelector('.btn'))

    expect(handler).toHaveBeenCalledOnce()
  })

  it('passes aria-label through to the button via $$restProps', () => {
    const { container } = render(Button, { props: { 'aria-label': 'Format JSON' } })
    const button = container.querySelector('.btn')
    expect(button.getAttribute('aria-label')).toBe('Format JSON')
  })
})
