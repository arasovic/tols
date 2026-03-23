<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount } from 'svelte'

  const EXAMPLE_SQL = `SELECT u.id, u.name, u.email, COUNT(o.id) as order_count, SUM(o.total) as total_spent FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.status = 'active' AND u.created_at > '2024-01-01' GROUP BY u.id, u.name, u.email HAVING COUNT(o.id) > 5 ORDER BY total_spent DESC LIMIT 100;`

  let input = ''
  let output = ''
  let keywordCase = 'uppercase'
  let indentation = '  '
  let timeout
  let saveTimeout

  function loadState() {
    try {
      const savedInput = localStorage.getItem('devutils-sql-input')
      const savedCase = localStorage.getItem('devutils-sql-case')
      if (savedInput) input = savedInput
      else input = EXAMPLE_SQL
      if (savedCase) keywordCase = savedCase
    } catch (e) {}
  }

  function saveState() {
    try {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        localStorage.setItem('devutils-sql-input', input)
        localStorage.setItem('devutils-sql-case', keywordCase)
      }, 500)
    } catch (e) {}
  }

  onMount(() => {
    loadState()
    if (input) process()
  })

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
  const NEWLINE_AFTER = [',']

  function formatSQL(sql) {
    let formatted = sql

    formatted = formatted.replace(/\s+/g, ' ').trim()

    for (const keyword of KEYWORDS) {
      const regex = new RegExp('\\b' + keyword + '\\b', 'gi')
      const replacement = keywordCase === 'uppercase' ? keyword.toUpperCase() : keyword.toLowerCase()
      formatted = formatted.replace(regex, replacement)
    }

    for (const keyword of NEWLINE_BEFORE) {
      const k = keywordCase === 'uppercase' ? keyword.toUpperCase() : keyword.toLowerCase()
      const regex = new RegExp('\\s*' + k + '\\b', 'gi')
      formatted = formatted.replace(regex, '\n' + k)
    }

    for (const char of NEWLINE_AFTER) {
      formatted = formatted.replace(new RegExp(escapeRegExp(char) + '\\s*', 'g'), char + '\n  ')
    }

    const lines = formatted.split('\n')
    let indentLevel = 0
    const result = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      if (/^\)/.test(trimmed)) indentLevel = Math.max(0, indentLevel - 1)

      const indent = indentation.repeat(Math.max(0, indentLevel))
      result.push(indent + trimmed)

      if (/\($/.test(trimmed)) indentLevel++
    }

    return result.join('\n')
  }

  function minifySQL(sql) {
    return sql
      .replace(/--[^\n]*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([(),])\s*/g, '$1')
      .trim()
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  function process() {
    output = ''

    if (!input.trim()) {
      output = ''
      return
    }

    try {
      output = formatSQL(input)
    } catch (e) {
      output = input
    }
  }

  function debouncedProcess() {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      process()
      saveState()
    }, 300)
  }

  function clear() {
    input = ''
    output = ''
    try {
      localStorage.removeItem('devutils-sql-input')
      localStorage.removeItem('devutils-sql-case')
    } catch (e) {}
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
      <button class="icon-btn" on:click={loadExample} title="Load Example">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></svg>
      </button>
      <button class="icon-btn" on:click={clear} title="Clear">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  </div>

  <div class="workspace">
    <div class="editor">
      <div class="editor-header">
        <span class="editor-label">SQL Input</span>
        <span class="char-count">{input.length} chars</span>
      </div>
      <textarea bind:value={input} on:input={debouncedProcess} placeholder="Paste SQL query here..." class="editor-textarea" spellcheck="false"></textarea>
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
      <pre class="output-display">{output || 'Output will appear here...'}</pre>
    </div>
  </div>
</div>

<style>
  .tool { display: flex; flex-direction: column; gap: var(--space-5); width: 100%; animation: fadeIn var(--transition) var(--ease-out); }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  .tool-header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); padding-bottom: var(--space-4); border-bottom: 1px solid var(--border-subtle); }
  .tool-meta { display: flex; flex-direction: column; gap: var(--space-1); }
  .tool-name { font-size: var(--text-xl); font-weight: var(--font-semibold); color: var(--text-primary); letter-spacing: var(--tracking-tight); margin: 0; }
  .tool-desc { font-size: var(--text-sm); color: var(--text-tertiary); margin: 0; }
  .tool-actions { display: flex; align-items: center; gap: var(--space-2); }
  .segmented { display: flex; background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius); padding: 2px; }
  .segment { display: flex; align-items: center; padding: var(--space-1) var(--space-3); border-radius: var(--radius-sm); font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-secondary); background: transparent; border: none; cursor: pointer; transition: all var(--transition-fast); }
  .segment:hover { color: var(--text-primary); }
  .segment.active { background: var(--bg-surface); color: var(--text-primary); border: 1px solid var(--border-default); box-shadow: var(--shadow-xs); }
  .icon-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: var(--radius); background: transparent; color: var(--text-tertiary); border: none; cursor: pointer; transition: all var(--transition-fast); }
  .icon-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
  .workspace { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
  .editor { display: flex; flex-direction: column; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden; min-height: 400px; }
  .editor-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-2) var(--space-3); background: var(--bg-elevated); border-bottom: 1px solid var(--border-subtle); }
  .editor-label { font-size: var(--text-xs); font-weight: var(--font-semibold); text-transform: uppercase; letter-spacing: var(--tracking-wide); color: var(--text-tertiary); }
  .editor-meta { display: flex; align-items: center; gap: var(--space-2); }
  .char-count { font-size: var(--text-xs); color: var(--text-muted); font-family: var(--font-mono); }
  .editor-textarea { flex: 1; padding: var(--space-3); border: none; background: var(--bg-surface); color: var(--text-primary); font-family: var(--font-mono); font-size: var(--text-sm); line-height: var(--leading-snug); resize: none; outline: none; }
  .editor-textarea::placeholder { color: var(--text-muted); }
  .output-display { flex: 1; margin: 0; padding: var(--space-3); background: var(--bg-surface); color: var(--text-secondary); font-family: var(--font-mono); font-size: var(--text-sm); line-height: var(--leading-snug); white-space: pre-wrap; word-wrap: break-word; overflow: auto; }
  .output-display:not(:empty):not(:only-child) { color: var(--text-primary); }
  @media (max-width: 768px) { .workspace { grid-template-columns: 1fr; } .tool-header { flex-direction: column; align-items: flex-start; } .tool-actions { width: 100%; justify-content: flex-end; } }
</style>
