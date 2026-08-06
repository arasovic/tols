<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import Workbench from '$lib/ui/Workbench.svelte'
  import ToolHeader from '$lib/ui/ToolHeader.svelte'
  import Button from '$lib/ui/Button.svelte'
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
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeout
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let saveTimeout
  let errorMessage = ''
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let errorTimeout

  // Declared once so the visible command and the ⌘⇧C payload cannot drift:
  // writing `keywordCase === 'uppercase' ? 'upper' : 'lower'` a second time is
  // how a renamed flag value ends up displayed in one place and copied in
  // another. The CLI reads the flag as `--keyword-case=upper|lower`.
  $: cliFlags = { 'keyword-case': keywordCase === 'uppercase' ? 'upper' : 'lower' }

  import ShareButton from '$lib/components/ShareButton.svelte'
  import PasteButton from '$lib/components/PasteButton.svelte'
  import { readShareFragment } from '$lib/utils/share.js'
  import { fileDrop } from '$lib/utils/fileDrop.js'

  // A shared link takes precedence over locally saved state
  const sharedState = readShareFragment()
  if (sharedState && typeof sharedState.input === 'string') {
    input = sharedState.input
    if (sharedState.keywordCase === 'uppercase' || sharedState.keywordCase === 'lowercase') {
      keywordCase = sharedState.keywordCase
    }
    process()
  } else {
    loadState()
  }

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
    } catch (/** @type {any} */ e) {
      showError('Failed to load saved state')
    }
  }

  function saveState() {
    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem('devutils-sql-input', input)
        localStorage.setItem('devutils-sql-case', keywordCase)
      } catch (/** @type {any} */ e) {
        showError('Failed to save state')
      }
    }, SAVE_DELAY_MS)
  }

  /**
   * @typedef {{ type: string, value: string, line: number, col: number }} SqlToken
   */

  /**
   * @param {string} message
   */
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

  /**
   * @param {string} sql
   * @returns {SqlToken[]}
   */
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

  /**
   * @param {SqlToken[]} tokens
   * @returns {string}
   */
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

  /**
   * @param {string} sql
   */
  function formatSQL(sql) {
    if (!sql.trim()) return ''

    if (sql.length > MAX_INPUT_LENGTH) {
      throw new Error(`Input exceeds maximum length of ${MAX_INPUT_LENGTH} characters`)
    }

    const tokens = tokenize(sql)
    const formatted = formatWithNewlines(tokens)

    return formatted.trim()
  }

  /**
   * @param {string} sql
   */
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

  /**
   * @param {string} string
   */
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
    } catch (/** @type {any} */ e) {
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
    } catch (/** @type {any} */ e) {
      showError('Failed to clear saved state')
    }
  }

  function loadExample() {
    input = EXAMPLE_SQL
    process()
    saveState()
  }

  /**
   * @param {string} case_
   */
  function setKeywordCase(case_) {
    keywordCase = case_
    process()
    saveState()
  }
</script>

<div class="tool">
  <ToolHeader toolId="sql" />

  <Workbench
    toolId="sql"
    action="fmt"
    flags={cliFlags}
    {input}
    {output}
    onRun={process}
  >
    <textarea
      slot="input"
      bind:value={input}
      on:input={debouncedProcess}
      use:fileDrop={{ onText: (text) => { input = text; process() } }}
      placeholder="Paste SQL query here..."
      class="editor-textarea"
      spellcheck="false"
      aria-label="SQL Input"
    ></textarea>

    <svelte:fragment slot="output">
      {#if errorMessage}
        <div class="error-banner" role="alert" aria-live="polite">{errorMessage}</div>
      {:else}
        <pre class="output-display" aria-live="polite">{output || 'Output will appear here...'}</pre>
      {/if}
    </svelte:fragment>

    <svelte:fragment slot="rail">
      <!--
        The segments carry NO aria-label. Their visible text already is the
        accessible name, and an aria-label that does not contain the visible
        text breaks WCAG 2.5.3 (label in name) for speech-input users.
      -->
      <div class="segmented">
        <button type="button" class="segment" class:active={keywordCase === 'uppercase'} on:click={() => setKeywordCase('uppercase')}>UPPER</button>
        <button type="button" class="segment" class:active={keywordCase === 'lowercase'} on:click={() => setKeywordCase('lowercase')}>lower</button>
      </div>
      <Button class="icon-btn" aria-label="Load Example" title="Load Example" on:click={loadExample}>example</Button>
      <Button class="icon-btn" aria-label="Clear" title="Clear" on:click={clear}>clear</Button>
    </svelte:fragment>

    <svelte:fragment slot="rail-end">
      <PasteButton on:text={(e) => { input = e.detail.text; process() }} />
      {#if output}<CopyButton text={output} />{/if}
      <ShareButton getState={() => ({ input, keywordCase })} />
    </svelte:fragment>
  </Workbench>
</div>

<style>
  /*
    Everything the two-column grid, the pane boxes, the pane headers and the
    icon buttons used to own now belongs to Workbench / Panel / ActionRail /
    Button. What is genuinely specific to the SQL tool: the pane contents, the
    UPPER/lower keyword-case switch, and the error readout.
  */
  .tool {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    width: 100%;
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
    transition: all var(--transition-fast) var(--ease-out);
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

  .error-banner {
    background: var(--error-bg, #fef2f2);
    color: var(--error-text, #dc2626);
    padding: var(--space-3);
    border-radius: var(--radius);
    border: 1px solid var(--error-border, #fecaca);
    font-size: var(--text-sm);
  }

  .editor-textarea {
    width: 100%;
    height: 100%;
    min-height: var(--pane-min-height);
    padding: var(--space-3);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: var(--leading-snug);
    background: transparent;
    border: none;
    resize: none;
    tab-size: 2;
  }

  .editor-textarea:focus {
    box-shadow: inset 0 0 0 2px var(--accent);
  }

  .editor-textarea::placeholder {
    color: var(--text-muted);
  }

  .output-display {
    height: 100%;
    min-height: var(--pane-min-height);
    margin: 0;
    padding: var(--space-3);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: var(--leading-snug);
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow: auto;
  }
</style>
