<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount, onDestroy } from 'svelte'

  const EXAMPLE_SQL = `SELECT u.id, u.name, u.email, COUNT(o.id) as order_count, SUM(o.total) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active' AND u.created_at > '2024-01-01'
GROUP BY u.id, u.name, u.email
HAVING COUNT(o.id) > 5
ORDER BY total_spent DESC
LIMIT 100;`

  const DEBOUNCE_MS = 300
  const SAVE_DELAY_MS = 500
  const MAX_INPUT_LENGTH = 100000
  const ERROR_DISPLAY_DURATION = 3000

  const KEYWORDS = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'INSERT', 'UPDATE', 'DELETE',
    'VALUES', 'SET', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'FULL', 'CROSS',
    'ON', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'ALL',
    'DISTINCT', 'AS', 'ASC', 'DESC', 'NULL', 'IS', 'IN', 'BETWEEN', 'LIKE',
    'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'IF', 'CREATE', 'TABLE',
    'ALTER', 'DROP', 'INDEX', 'VIEW', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES',
    'UNIQUE', 'DEFAULT', 'AUTO_INCREMENT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX'
  ]

  const NEWLINE_BEFORE = ['SELECT', 'FROM', 'WHERE', 'GROUP', 'ORDER', 'HAVING', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS', 'UNION']

  let input = ''
  let output = ''
  let keywordCase = 'uppercase'
  let indentation = '  '
  let timeout
  let saveTimeout
  let errorMessage = ''
  let errorTimeout

  loadState()

  function loadState() {
    try {
      const savedInput = localStorage.getItem('devutils-sql-input')
      const savedCase = localStorage.getItem('devutils-sql-case')
      if (savedInput) {
        input = savedInput
        if (savedCase) keywordCase = savedCase
        process()
      } else {
        input = EXAMPLE_SQL
        process()
      }
    } catch (e) {
      showError('Failed to load saved state')
    }
  }

  function saveState() {
    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem('devutils-sql-input', input)
        localStorage.setItem('devutils-sql-case', keywordCase)
      } catch (e) {
        showError('Failed to save state')
      }
    }, SAVE_DELAY_MS)
  }

  function showError(message) {
    errorMessage = message
    clearTimeout(errorTimeout)
    errorTimeout = setTimeout(() => {
      errorMessage = ''
    }, ERROR_DISPLAY_DURATION)
  }

  onMount(() => {
  })

  onDestroy(() => {
    clearTimeout(timeout)
    clearTimeout(saveTimeout)
    clearTimeout(errorTimeout)
  })

  function tokenize(sql) {
    const tokens = []
    let i = 0
    let line = 1
    let col = 1

    while (i < sql.length) {
      const char = sql[i]
      const nextChar = sql[i + 1]

      if (char === '-' && nextChar === '-') {
        let comment = '--'
        i += 2
        col += 2
        while (i < sql.length && sql[i] !== '\n') {
          comment += sql[i]
          i++
          col++
        }
        tokens.push({ type: 'COMMENT', value: comment, line, col })
        continue
      }

      if (char === '/' && nextChar === '*') {
        let comment = '/*'
        i += 2
        col += 2
        while (i < sql.length - 1 && !(sql[i] === '*' && sql[i + 1] === '/')) {
          if (sql[i] === '\n') {
            line++
            col = 1
          } else {
            col++
          }
          comment += sql[i]
          i++
        }
        if (i < sql.length - 1) {
          comment += '*/'
          i += 2
          col += 2
        }
        tokens.push({ type: 'COMMENT', value: comment, line, col })
        continue
      }

      if (char === "'" || char === '"') {
        const quote = char
        let str = quote
        i++
        col++
        while (i < sql.length && sql[i] !== quote) {
          if (sql[i] === '\\' && i + 1 < sql.length) {
            str += sql[i] + sql[i + 1]
            i += 2
            col += 2
          } else {
            if (sql[i] === '\n') {
              line++
              col = 1
            } else {
              col++
            }
            str += sql[i]
            i++
          }
        }
        if (i < sql.length) {
          str += quote
          i++
          col++
        }
        tokens.push({ type: 'STRING', value: str, line, col })
        continue
      }

      if (/\s/.test(char)) {
        let ws = ''
        while (i < sql.length && /\s/.test(sql[i])) {
          if (sql[i] === '\n') {
            line++
            col = 1
          } else {
            col++
          }
          ws += sql[i]
          i++
        }
        tokens.push({ type: 'WHITESPACE', value: ws, line, col })
        continue
      }

      if (/[a-zA-Z_]/.test(char)) {
        let word = ''
        while (i < sql.length && /[a-zA-Z0-9_$]/.test(sql[i])) {
          word += sql[i]
          i++
          col++
        }
        tokens.push({ type: 'WORD', value: word, line, col })
        continue
      }

      if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(sql[i + 1] || ''))) {
        let num = ''
        while (i < sql.length && (/[0-9.]/.test(sql[i]) || sql[i].toLowerCase() === 'e' || /[+-]/.test(sql[i]))) {
          num += sql[i]
          i++
          col++
        }
        tokens.push({ type: 'NUMBER', value: num, line, col })
        continue
      }

      if (char === ';') {
        tokens.push({ type: 'SEMICOLON', value: ';', line, col })
        i++
        col++
        continue
      }

      tokens.push({ type: 'SYMBOL', value: char, line, col })
      i++
      col++
    }

    return tokens
  }

  function formatWithNewlines(tokens) {
    const result = []
    let indentLevel = 0
    let currentLine = ''
    let needsNewline = false

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      const nextToken = tokens[i + 1]

      if (token.type === 'COMMENT') {
        if (currentLine.trim()) {
          result.push(indentation.repeat(Math.max(0, indentLevel)) + currentLine.trim())
          currentLine = ''
        }
        result.push(token.value)
        needsNewline = true
        continue
      }

      if (token.type === 'STRING') {
        currentLine += token.value
        continue
      }

      if (token.type === 'WHITESPACE') {
        if (currentLine && !currentLine.endsWith(' ')) {
          currentLine += ' '
        }
        continue
      }

      if (token.type === 'SEMICOLON') {
        if (currentLine.trim()) {
          result.push(indentation.repeat(Math.max(0, indentLevel)) + currentLine.trim())
        }
        result.push(';')
        currentLine = ''
        indentLevel = 0
        needsNewline = true
        continue
      }

      if (token.type === 'WORD') {
        const upperWord = token.value.toUpperCase()

        if (NEWLINE_BEFORE.includes(upperWord)) {
          if (currentLine.trim()) {
            result.push(indentation.repeat(Math.max(0, indentLevel)) + currentLine.trim())
          }
          currentLine = ''
          const replacement = keywordCase === 'uppercase' ? upperWord : upperWord.toLowerCase()
          currentLine = replacement
          needsNewline = false
        } else {
          const replacement = KEYWORDS.includes(upperWord)
            ? (keywordCase === 'uppercase' ? upperWord : upperWord.toLowerCase())
            : token.value
          currentLine += replacement
        }
        continue
      }

      if (token.type === 'SYMBOL') {
        if (token.value === '(') {
          currentLine += token.value
          indentLevel++
        } else if (token.value === ')') {
          if (/^\s*\)/.test(currentLine)) {
            indentLevel = Math.max(0, indentLevel - 1)
          }
          currentLine += token.value
          indentLevel = Math.max(0, indentLevel - 1)
        } else if (token.value === ',') {
          currentLine += token.value
          if (currentLine.trim()) {
            result.push(indentation.repeat(Math.max(0, indentLevel)) + currentLine.trim())
          }
          currentLine = indentation
        } else {
          currentLine += token.value
        }
        continue
      }

      currentLine += token.value
    }

    if (currentLine.trim()) {
      result.push(indentation.repeat(Math.max(0, indentLevel)) + currentLine.trim())
    }

    return result.join('\n')
  }

  function formatSQL(sql) {
    if (!sql.trim()) return ''

    if (sql.length > MAX_INPUT_LENGTH) {
      throw new Error(`Input exceeds maximum length of ${MAX_INPUT_LENGTH} characters`)
    }

    const tokens = tokenize(sql)
    const formatted = formatWithNewlines(tokens)

    return formatted.trim()
  }

  function minifySQL(sql) {
    if (!sql.trim()) return ''

    const tokens = tokenize(sql)
    const result = []

    for (const token of tokens) {
      if (token.type === 'COMMENT') continue
      if (token.type === 'WHITESPACE') {
        if (result.length > 0 && !/\s$/.test(result[result.length - 1])) {
          result.push(' ')
        }
        continue
      }
      result.push(token.value)
    }

    return result
      .join('')
      .replace(/\s*([(),])\s*/g, '$1')
      .replace(/\s+/g, ' ')
      .trim()
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  function process() {
    output = ''
    errorMessage = ''

    if (!input.trim()) {
      output = ''
      return
    }

    try {
      output = formatSQL(input)
    } catch (e) {
      showError(e.message || 'Failed to format SQL')
      output = ''
    }
  }

  function debouncedProcess() {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      process()
      saveState()
    }, DEBOUNCE_MS)
  }

  function clear() {
    input = ''
    output = ''
    errorMessage = ''
    try {
      localStorage.removeItem('devutils-sql-input')
      localStorage.removeItem('devutils-sql-case')
    } catch (e) {
      showError('Failed to clear saved state')
    }
  }

  function loadExample() {
    input = EXAMPLE_SQL
    process()
    saveState()
  }

  function setKeywordCase(case_) {
    keywordCase = case_
    process()
    saveState()
  }
</script>

<div class="tool">
  <div class="tool-header">
    <div class="tool-meta">
      <h1 class="tool-name">SQL Formatter</h1>
      <p class="tool-desc">Format and beautify SQL queries</p>
    </div>
    <div class="tool-actions">
      <div class="segmented">
        <button class="segment" class:active={keywordCase === 'uppercase'} on:click={() => setKeywordCase('uppercase')}>UPPER</button>
        <button class="segment" class:active={keywordCase === 'lowercase'} on:click={() => setKeywordCase('lowercase')}>lower</button>
      </div>
      <button class="icon-btn" on:click={loadExample} title="Load Example" aria-label="Load Example">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></svg>
      </button>
      <button class="icon-btn" on:click={clear} title="Clear" aria-label="Clear">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  </div>

  {#if errorMessage}
    <div class="error-banner" role="alert">
      {errorMessage}
    </div>
  {/if}

  <div class="workspace">
    <div class="editor">
      <div class="editor-header">
        <span class="editor-label">SQL Input</span>
        <span class="char-count">{input.length} chars</span>
      </div>
      <textarea
        bind:value={input}
        on:input={debouncedProcess}
        placeholder="Paste SQL query here..."
        class="editor-textarea"
        spellcheck="false"
        aria-label="SQL Input"
      ></textarea>
    </div>

    <div class="editor">
      <div class="editor-header">
        <span class="editor-label">Formatted SQL</span>
        <div class="editor-meta">
          {#if output}
            <span class="char-count">{output.length} chars</span>
            <CopyButton text={output} />
          {/if}
        </div>
      </div>
      <pre class="output-display" aria-live="polite">{output || 'Output will appear here...'}</pre>
    </div>
  </div>
</div>

<style>
  .tool {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    width: 100%;
    animation: fadeIn var(--transition) var(--ease-out);
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .tool-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-4);
    padding-bottom: var(--space-4);
    border-bottom: 1px solid var(--border-subtle);
  }

  .tool-meta {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .tool-name {
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    letter-spacing: var(--tracking-tight);
    margin: 0;
  }

  .tool-desc {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    margin: 0;
  }

  .tool-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .segmented {
    display: flex;
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius);
    padding: 2px;
  }

  .segment {
    display: flex;
    align-items: center;
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .segment:hover {
    color: var(--text-primary);
  }

  .segment.active {
    background: var(--bg-surface);
    color: var(--text-primary);
    border: 1px solid var(--border-default);
    box-shadow: var(--shadow-xs);
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius);
    background: transparent;
    color: var(--text-tertiary);
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .icon-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .icon-btn:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .error-banner {
    background: var(--error-bg, #fef2f2);
    color: var(--error-text, #dc2626);
    padding: var(--space-3);
    border-radius: var(--radius);
    border: 1px solid var(--error-border, #fecaca);
    font-size: var(--text-sm);
  }

  .workspace {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }

  .editor {
    display: flex;
    flex-direction: column;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    overflow: hidden;
    min-height: 400px;
  }

  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3);
    background: var(--bg-elevated);
    border-bottom: 1px solid var(--border-subtle);
  }

  .editor-label {
    font-size: var(--text-xs);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
    color: var(--text-tertiary);
  }

  .editor-meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .char-count {
    font-size: var(--text-xs);
    color: var(--text-muted);
    font-family: var(--font-mono);
  }

  .editor-textarea {
    flex: 1;
    padding: var(--space-3);
    border: none;
    background: var(--bg-surface);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: var(--leading-snug);
    resize: none;
    outline: none;
  }

  .editor-textarea:focus {
    box-shadow: inset 0 0 0 2px var(--accent);
  }

  .editor-textarea::placeholder {
    color: var(--text-muted);
  }

  .output-display {
    flex: 1;
    margin: 0;
    padding: var(--space-3);
    background: var(--bg-surface);
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: var(--leading-snug);
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow: auto;
  }

  .output-display:not(:empty):not(:only-child) {
    color: var(--text-primary);
  }

  @media (max-width: 768px) {
    .workspace { grid-template-columns: 1fr; }
    .tool-header { flex-direction: column; align-items: flex-start; }
    .tool-actions { width: 100%; justify-content: flex-end; }
  }
</style>
