import { describe, it, expect, vi } from 'vitest'
import { dispatchShortcut, SHORTCUTS } from '$lib/ui/shortcuts.js'

describe('shortcut model', () => {
  it('declares the locked key map', () => {
    expect(SHORTCUTS).toEqual({
      palette: '⌘K',
      sidebar: '⌘B',
      run: '⌘⏎',
      copyCommand: '⌘⇧C',
      copyOutput: '⌘⇧O',
      close: 'Esc'
    })
  })

  it('routes cmd+shift+c to copyCommand', () => {
    const handlers = { copyCommand: vi.fn() }
    const event = new KeyboardEvent('keydown', { key: 'c', metaKey: true, shiftKey: true })
    dispatchShortcut(event, handlers)
    expect(handlers.copyCommand).toHaveBeenCalledOnce()
  })

  it('routes cmd+shift+o to copyOutput', () => {
    const handlers = { copyOutput: vi.fn() }
    dispatchShortcut(new KeyboardEvent('keydown', { key: 'o', metaKey: true, shiftKey: true }), handlers)
    expect(handlers.copyOutput).toHaveBeenCalledOnce()
  })

  it('routes cmd+enter to run', () => {
    const handlers = { run: vi.fn() }
    dispatchShortcut(new KeyboardEvent('keydown', { key: 'Enter', metaKey: true }), handlers)
    expect(handlers.run).toHaveBeenCalledOnce()
  })

  it('accepts ctrl as an alias for cmd', () => {
    const handlers = { sidebar: vi.fn() }
    dispatchShortcut(new KeyboardEvent('keydown', { key: 'b', ctrlKey: true }), handlers)
    expect(handlers.sidebar).toHaveBeenCalledOnce()
  })

  it('ignores plain cmd+c so normal copy still works', () => {
    const handlers = { copyCommand: vi.fn() }
    dispatchShortcut(new KeyboardEvent('keydown', { key: 'c', metaKey: true }), handlers)
    expect(handlers.copyCommand).not.toHaveBeenCalled()
  })

  it('does not throw when a handler is not registered', () => {
    expect(() => dispatchShortcut(new KeyboardEvent('keydown', { key: 'Enter', metaKey: true }), {})).not.toThrow()
  })
})
