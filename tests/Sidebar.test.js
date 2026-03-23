import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import { writable } from 'svelte/store'
import Sidebar from '$lib/components/Sidebar.svelte'

vi.mock('$app/stores', () => ({
  page: writable({ url: { pathname: '/json' } })
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

vi.mock('$app/environment', () => ({
  browser: true
}))

describe('Sidebar', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      matchMedia: vi.fn().mockReturnValue({ matches: false })
    })
    vi.stubGlobal('document', {
      documentElement: {
        setAttribute: vi.fn(),
        getAttribute: vi.fn()
      }
    })
  })

  it('should render correctly', () => {
    render(Sidebar)
    expect(screen.getByText('DevUtils')).toBeInTheDocument()
  })

  it('should show tools list', () => {
    render(Sidebar)
    expect(screen.getByText('Tools')).toBeInTheDocument()
    expect(screen.getByText('JSON')).toBeInTheDocument()
    expect(screen.getByText('Base64')).toBeInTheDocument()
  })

  it('should highlight active tool', () => {
    const { container } = render(Sidebar)
    const activeLink = container.querySelector('.nav-item.active')
    expect(activeLink).toBeInTheDocument()
  })

  it('should have theme toggle button', () => {
    render(Sidebar)
    expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument()
  })

  it('should close on escape key when open', async () => {
    const { component, container } = render(Sidebar, { props: { isOpen: true } })
    const sidebar = container.querySelector('.sidebar')
    expect(sidebar).toHaveClass('open')

    await fireEvent.keyDown(document, { key: 'Escape' })

    expect(sidebar).not.toHaveClass('open')
  })

  it('should show version in footer', () => {
    render(Sidebar)
    expect(screen.getByText('v1.0.0')).toBeInTheDocument()
  })

  it('should render tool icons', () => {
    const { container } = render(Sidebar)
    const icons = container.querySelectorAll('.nav-item-icon')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('should have correct navigation links', () => {
    const { container } = render(Sidebar)
    const links = container.querySelectorAll('.nav-item')
    expect(links.length).toBeGreaterThan(0)
  })

  it('should show logo', () => {
    render(Sidebar)
    expect(screen.getByText('DevUtils')).toBeInTheDocument()
  })

  it('should close sidebar on link click when open', async () => {
    const { container } = render(Sidebar, { props: { isOpen: true } })
    const jsonLink = screen.getByText('JSON')

    await fireEvent.click(jsonLink)

    const sidebar = container.querySelector('.sidebar')
    expect(sidebar).not.toHaveClass('open')
  })
})
