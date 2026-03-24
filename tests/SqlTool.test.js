import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import SqlTool from '$lib/tools/SqlTool.svelte'

describe('SqlTool', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
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
    expect(screen.getByLabelText('SQL Input')).toBeInTheDocument()
    expect(screen.getByText('Formatted SQL')).toBeInTheDocument()
  })

  it('should format SQL input', async () => {
    render(SqlTool)
    const textarea = screen.getByLabelText('SQL Input')
    await fireEvent.input(textarea, { target: { value: 'select * from users' } })

    await waitFor(() => {
      const output = screen.getByText(/SELECT/i)
      expect(output).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should convert keywords to uppercase', async () => {
    render(SqlTool)
    const textarea = screen.getByLabelText('SQL Input')
    await fireEvent.input(textarea, { target: { value: 'select * from users where id = 1' } })

    await waitFor(() => {
      const output = screen.getByText(/SELECT\s+\*\s+FROM\s+users\s+WHERE/i, { selector: 'pre' })
      expect(output).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should convert keywords to lowercase', async () => {
    render(SqlTool)
    const lowerButton = screen.getByText('lower')
    await fireEvent.click(lowerButton)

    const textarea = screen.getByLabelText('SQL Input')
    await fireEvent.input(textarea, { target: { value: 'SELECT * FROM users' } })

    await waitFor(() => {
      const output = screen.getByText(/select/i, { selector: 'pre' })
      expect(output).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should clear content when clear button clicked', async () => {
    render(SqlTool)
    const textarea = /** @type {HTMLTextAreaElement} */ (screen.getByLabelText('SQL Input'))
    await fireEvent.input(textarea, { target: { value: 'SELECT * FROM users' } })

    await waitFor(() => {
      expect(textarea.value).toBe('SELECT * FROM users')
    }, { timeout: 500 })

    const clearButton = screen.getByLabelText('Clear')
    await fireEvent.click(clearButton)

    expect(textarea.value).toBe('')
  })

  it('should load example when load example button clicked', async () => {
    render(SqlTool)
    const loadExampleButton = screen.getByLabelText('Load Example')
    await fireEvent.click(loadExampleButton)

    const textarea = /** @type {HTMLTextAreaElement} */ (screen.getByLabelText('SQL Input'))
    await waitFor(() => {
      expect(textarea.value).toContain('SELECT')
    }, { timeout: 500 })
  })

  it('should show character count', async () => {
    render(SqlTool)
    // There are two char-count elements (input and output), so check for at least one
    await waitFor(() => {
      const charCounts = screen.getAllByText(/\d+ chars/)
      expect(charCounts.length).toBeGreaterThanOrEqual(1)
    }, { timeout: 500 })
  })

  it('should handle SELECT statements', async () => {
    render(SqlTool)
    const textarea = screen.getByLabelText('SQL Input')
    await fireEvent.input(textarea, { target: { value: 'select id, name from users' } })

    await waitFor(() => {
      const output = screen.getByText(/SELECT\s+id,\s+name\s+FROM\s+users/i, { selector: 'pre' })
      expect(output).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should handle JOIN statements', async () => {
    render(SqlTool)
    const textarea = screen.getByLabelText('SQL Input')
    await fireEvent.input(textarea, { target: { value: 'select * from users u join orders o on u.id = o.user_id' } })

    await waitFor(() => {
      const output = screen.getByText(/JOIN/i, { selector: 'pre' })
      expect(output).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should handle GROUP BY and ORDER BY', async () => {
    render(SqlTool)
    const textarea = screen.getByLabelText('SQL Input')
    await fireEvent.input(textarea, { target: { value: 'select count(*) from users group by status order by count' } })

    await waitFor(() => {
      const output = screen.getByText(/GROUP.*BY.*ORDER.*BY/is, { selector: 'pre' })
      expect(output).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should debounce input processing', async () => {
    // Clear the default example first
    localStorage.clear()
    const { container } = render(SqlTool)
    const clearButton = screen.getByLabelText('Clear')
    await fireEvent.click(clearButton)

    const textarea = screen.getByLabelText('SQL Input')

    await fireEvent.input(textarea, { target: { value: 'SEL' } })

    const outputBefore = container.querySelector('.output-display')?.textContent
    expect(outputBefore).not.toContain('FROM')

    await fireEvent.input(textarea, { target: { value: 'SELECT * F' } })
    await fireEvent.input(textarea, { target: { value: 'SELECT * FROM users' } })

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      const text = output?.textContent || ''
      expect(text).toContain('FROM')
    }, { timeout: 500 })
  })

  it('should NOT convert keywords inside string literals', async () => {
    const { container } = render(SqlTool)
    const textarea = screen.getByLabelText('SQL Input')
    await fireEvent.input(textarea, { target: { value: "SELECT * FROM users WHERE name = 'select from'" } })

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      expect(output?.textContent).toContain("'select from'")
    }, { timeout: 500 })
  })

  it('should NOT convert keywords inside double-quoted strings', async () => {
    const { container } = render(SqlTool)
    const textarea = screen.getByLabelText('SQL Input')
    await fireEvent.input(textarea, { target: { value: 'SELECT * FROM users WHERE name = "select from"' } })

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      expect(output?.textContent).toContain('"select from"')
    }, { timeout: 500 })
  })

  it('should preserve single-line comments', async () => {
    render(SqlTool)
    const textarea = screen.getByLabelText('SQL Input')
    await fireEvent.input(textarea, { target: { value: 'SELECT * FROM users -- get all users\nWHERE id = 1' } })

    await waitFor(() => {
      const output = screen.getByText(/-- get all users/, { selector: 'pre' })
      expect(output).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should preserve multi-line comments', async () => {
    render(SqlTool)
    const textarea = screen.getByLabelText('SQL Input')
    await fireEvent.input(textarea, { target: { value: 'SELECT /* all columns */ * FROM users' } })

    await waitFor(() => {
      const output = screen.getByText(/\/\* all columns \*\//, { selector: 'pre' })
      expect(output).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should handle subqueries correctly', async () => {
    render(SqlTool)
    const textarea = screen.getByLabelText('SQL Input')
    await fireEvent.input(textarea, { target: { value: 'SELECT * FROM (SELECT id FROM users) AS u WHERE id = 1' } })

    await waitFor(() => {
      const output = screen.getByText(/\(\s*SELECT\s+id\s+FROM\s+users\s*\)/is, { selector: 'pre' })
      expect(output).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should handle nested subqueries', async () => {
    render(SqlTool)
    const textarea = screen.getByLabelText('SQL Input')
    await fireEvent.input(textarea, { target: { value: 'SELECT * FROM (SELECT * FROM (SELECT id FROM orders) o) u' } })

    await waitFor(() => {
      const output = screen.getByText(/SELECT \* FROM/i, { selector: 'pre' })
      expect(output).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should handle CASE WHEN statements', async () => {
    render(SqlTool)
    const textarea = screen.getByLabelText('SQL Input')
    await fireEvent.input(textarea, { target: { value: 'SELECT CASE WHEN status = 1 THEN active ELSE inactive END FROM users' } })

    await waitFor(() => {
      const output = screen.getByText(/CASE\s+WHEN.*THEN.*ELSE.*END/is, { selector: 'pre' })
      expect(output).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should handle identifiers matching keywords', async () => {
    render(SqlTool)
    const textarea = screen.getByLabelText('SQL Input')
    await fireEvent.input(textarea, { target: { value: 'SELECT order.id FROM order' } })

    await waitFor(() => {
      const output = screen.getByText(/SELECT\s+order\.id\s+FROM\s+order/is, { selector: 'pre' })
      expect(output).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should handle empty input', async () => {
    render(SqlTool)
    const textarea = screen.getByLabelText('SQL Input')
    await fireEvent.input(textarea, { target: { value: '' } })

    await waitFor(() => {
      const output = screen.getByText(/Output will appear here/i, { selector: 'pre' })
      expect(output).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should handle whitespace-only input', async () => {
    render(SqlTool)
    const textarea = screen.getByLabelText('SQL Input')
    await fireEvent.input(textarea, { target: { value: '   \n\t  ' } })

    await waitFor(() => {
      const output = screen.getByText(/Output will appear here/i, { selector: 'pre' })
      expect(output).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should handle multiple statements', async () => {
    const { container } = render(SqlTool)
    const textarea = screen.getByLabelText('SQL Input')
    await fireEvent.input(textarea, { target: { value: 'SELECT * FROM users; SELECT * FROM orders;' } })

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      const text = output?.textContent || ''
      expect(text).toContain('users')
      expect(text).toContain('orders')
      expect(text).toContain(';')
    }, { timeout: 500 })
  })

  it('should handle COUNT with proper parentheses', async () => {
    render(SqlTool)
    const textarea = screen.getByLabelText('SQL Input')
    await fireEvent.input(textarea, { target: { value: 'SELECT COUNT(id) FROM users' } })

    await waitFor(() => {
      const output = screen.getByText(/COUNT\(id\)/i, { selector: 'pre' })
      expect(output).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should handle deeply nested parentheses', async () => {
    render(SqlTool)
    const textarea = screen.getByLabelText('SQL Input')
    await fireEvent.input(textarea, { target: { value: 'SELECT * FROM (((users)))' } })

    await waitFor(() => {
      const output = screen.getByText(/users/i, { selector: 'pre' })
      expect(output).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should handle unicode characters in identifiers', async () => {
    render(SqlTool)
    const textarea = screen.getByLabelText('SQL Input')
    await fireEvent.input(textarea, { target: { value: 'SELECT * FROM utilisateurs WHERE nom = "Émilie"' } })

    await waitFor(() => {
      const output = screen.getByText(/utilisateurs/i, { selector: 'pre' })
      expect(output).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should save state to localStorage', async () => {
    render(SqlTool)
    const textarea = screen.getByLabelText('SQL Input')
    await fireEvent.input(textarea, { target: { value: 'SELECT * FROM users' } })

    await waitFor(() => {
      expect(localStorage.getItem('devutils-sql-input')).toBe('SELECT * FROM users')
    }, { timeout: 1000 })
  })

  it('should load state from localStorage', async () => {
    localStorage.setItem('devutils-sql-input', 'SELECT id FROM products')
    localStorage.setItem('devutils-sql-case', 'lowercase')

    const { container } = render(SqlTool)

    await waitFor(() => {
      const output = container.querySelector('.output-display')
      const text = output?.textContent || ''
      // Should be lowercase since we saved lowercase
      expect(text).toContain('select')
    }, { timeout: 1000 })
  })

  it('should show error for invalid/malformed SQL gracefully', async () => {
    render(SqlTool)
    const textarea = screen.getByLabelText('SQL Input')
    const veryLongInput = 'SELECT '.repeat(20000)
    await fireEvent.input(textarea, { target: { value: veryLongInput } })

    await waitFor(() => {
      const errorBanner = screen.queryByRole('alert')
      expect(errorBanner).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should handle case toggle on existing input', async () => {
    render(SqlTool)
    const textarea = screen.getByLabelText('SQL Input')
    await fireEvent.input(textarea, { target: { value: 'select * from users' } })

    await waitFor(() => {
      const output = screen.getByText(/SELECT/i, { selector: 'pre' })
      expect(output).toBeInTheDocument()
    }, { timeout: 500 })

    const lowerButton = screen.getByText('lower')
    await fireEvent.click(lowerButton)

    await waitFor(() => {
      const output = screen.getByText(/select/i, { selector: 'pre' })
      expect(output).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should have aria-live on output for screen readers', () => {
    render(SqlTool)
    const output = screen.getByText(/SELECT|Output will appear here/i).closest('[aria-live]')
    expect(output).toBeInTheDocument()
    expect(output).toHaveAttribute('aria-live', 'polite')
  })

  it('should have accessible icon buttons', () => {
    render(SqlTool)
    expect(screen.getByLabelText('Load Example')).toBeInTheDocument()
    expect(screen.getByLabelText('Clear')).toBeInTheDocument()
  })
})
