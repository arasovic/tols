import { describe, it, expect, vi } from 'vitest'
import { fileDrop, MAX_DROP_BYTES } from '$lib/utils/fileDrop.js'

describe('fileDrop action', () => {
  function setup() {
    const node = document.createElement('textarea')
    document.body.appendChild(node)
    const onText = vi.fn()
    const onError = vi.fn()
    const action = fileDrop(node, { onText, onError })
    return { node, onText, onError, action }
  }

  it('reads a dropped text file and calls onText', async () => {
    const { node, onText } = setup()

    const file = new File(['hello drop'], 'sample.txt', { type: 'text/plain' })
    const event = new Event('drop', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'dataTransfer', {
      value: { files: [file], types: ['Files'] }
    })

    node.dispatchEvent(event)

    await new Promise(resolve => setTimeout(resolve, 10))
    expect(onText).toHaveBeenCalledWith('hello drop', 'sample.txt')
  })

  it('ignores drops without files', async () => {
    const { node, onText } = setup()

    const event = new Event('drop', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'dataTransfer', { value: { files: [], types: ['text/plain'] } })

    node.dispatchEvent(event)

    await new Promise(resolve => setTimeout(resolve, 10))
    expect(onText).not.toHaveBeenCalled()
  })

  it('refuses files above the size limit', async () => {
    const { node, onText, onError } = setup()

    const file = new File(['x'], 'big.txt', { type: 'text/plain' })
    Object.defineProperty(file, 'size', { value: MAX_DROP_BYTES + 1 })
    const event = new Event('drop', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'dataTransfer', {
      value: { files: [file], types: ['Files'] }
    })

    node.dispatchEvent(event)

    await new Promise(resolve => setTimeout(resolve, 10))
    expect(onText).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith(expect.stringContaining('too large'))
  })

  it('toggles the drag-over class while dragging a file', () => {
    const { node } = setup()

    const over = new Event('dragover', { bubbles: true, cancelable: true })
    Object.defineProperty(over, 'dataTransfer', { value: { types: ['Files'] } })
    node.dispatchEvent(over)
    expect(node.classList.contains('drag-over')).toBe(true)

    const leave = new Event('dragleave', { bubbles: true, cancelable: true })
    Object.defineProperty(leave, 'dataTransfer', { value: { types: ['Files'] } })
    node.dispatchEvent(leave)
    expect(node.classList.contains('drag-over')).toBe(false)
  })

  it('removes listeners on destroy', async () => {
    const { node, onText, action } = setup()
    action.destroy()

    const file = new File(['after destroy'], 'x.txt', { type: 'text/plain' })
    const event = new Event('drop', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'dataTransfer', {
      value: { files: [file], types: ['Files'] }
    })
    node.dispatchEvent(event)

    await new Promise(resolve => setTimeout(resolve, 10))
    expect(onText).not.toHaveBeenCalled()
  })
})
