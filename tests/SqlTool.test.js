import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import SqlTool from '$lib/tools/SqlTool.svelte'

describe('SqlTool', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with tool header', () => {
    render(SqlTool)
    expect(screen.getByText('SQL Formatter')).toBeInTheDocument()
  })

  it('should have UPPER and lower case options', () => {
    render(SqlTool)

    expect(screen.getByText('UPPER')).toBeInTheDocument()
    expect(screen.getByText('lower')).toBeInTheDocument()
  })

  it('should have input and output areas', () => {
    render(SqlTool)

    expect(screen.getByText('SQL Input')).toBeInTheDocument()
    expect(screen.getByText('Formatted SQL')).toBeInTheDocument()
  })

  it('should format SQL input', async () => {
    const { container } = render(SqlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'select * from users' } })

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      expect(output?.textContent).toBeTruthy()
      expect(output?.textContent).toContain('SELECT')
    }, { timeout: 500 })
  })

  it('should convert keywords to uppercase', async () => {
    const { container } = render(SqlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'select * from users where id = 1' } })

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      expect(output?.textContent).toBeTruthy()
      const text = output?.textContent || ''
      expect(text).toContain('SELECT')
      expect(text).toContain('FROM')
      expect(text).toContain('WHERE')
    }, { timeout: 500 })
  })

  it('should convert keywords to lowercase', async () => {
    const { container } = render(SqlTool)

    const lowerButton = screen.getByText('lower')
    await fireEvent.click(lowerButton)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'SELECT * FROM users' } })

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      expect(output?.textContent).toBeTruthy()
      const text = output?.textContent || ''
      expect(text).toContain('select')
      expect(text).toContain('from')
    }, { timeout: 500 })
  })

  it('should clear content when clear button clicked', async () => {
    const { container } = render(SqlTool)

    const clearButton = container.querySelector('[title="Clear"]')
    await fireEvent.click(clearButton)

    const textarea = container.querySelector('.editor-textarea')
    expect(textarea?.value).toBe('')
  })

  it('should load example when load example button clicked', async () => {
    const { container } = render(SqlTool)

    const loadExampleButton = container.querySelector('[title="Load Example"]')
    await fireEvent.click(loadExampleButton)

    const textarea = container.querySelector('.editor-textarea')
    expect(textarea?.value).toContain('SELECT')
  })

  it('should show character count', async () => {
    const { container } = render(SqlTool)

    await waitFor(() => {
      expect(container.textContent).toContain('chars')
    }, { timeout: 500 })
  })

  it('should handle SELECT statements', async () => {
    const { container } = render(SqlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'select id, name from users' } })

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      const text = output?.textContent || ''
      expect(text).toContain('SELECT')
    }, { timeout: 500 })
  })

  it('should handle JOIN statements', async () => {
    const { container } = render(SqlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'select * from users u join orders o on u.id = o.user_id' } })

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      const text = output?.textContent || ''
      expect(text).toContain('JOIN')
    }, { timeout: 500 })
  })

  it('should handle GROUP BY and ORDER BY', async () => {
    const { container } = render(SqlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 'select count(*) from users group by status order by count' } })

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      const text = output?.textContent || ''
      expect(text).toContain('GROUP')
      expect(text).toContain('ORDER')
    }, { timeout: 500 })
  })

  it('should debounce input processing', async () => {
    const { container } = render(SqlTool)

    const textarea = container.querySelector('.editor-textarea')
    await fireEvent.input(textarea, { target: { value: 's' } })
    await fireEvent.input(textarea, { target: { value: 'se' } })
    await fireEvent.input(textarea, { target: { value: 'sel' } })

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      const text = output?.textContent || ''
      expect(text).toContain('SEL')
    }, { timeout: 500 })
  })
})
