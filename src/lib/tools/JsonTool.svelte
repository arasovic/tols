<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount, onDestroy } from 'svelte'

  const EXAMPLE_JSON = `{
  "name": "DevUtils",
  "version": "1.0.0",
  "features": ["JSON", "Base64", "Hash"],
  "active": true
}`

  const PLACEHOLDER_TEXT = '{"name": "Example", "version": "1.0.0"}'
  const MAX_INPUT_SIZE = 1024 * 1024 // 1MB
  const DEBOUNCE_DELAY = 300
  const SAVE_DELAY = 500

  let input = ''
  let output = ''
  let error = ''
  let compact = false
  let timeout
  let saveTimeout
  let saveInProgress = false

  function loadState() {
    try {
      const savedInput = localStorage.getItem('devutils-json-input')
      const savedCompact = localStorage.getItem('devutils-json-compact')
      if (savedInput) {
        input = savedInput
      } else {
        input = EXAMPLE_JSON
        process()
      }
      if (savedCompact) compact = savedCompact === 'true'
    } catch (e) {
      input = EXAMPLE_JSON
      error = 'Failed to load from localStorage: ' + e.message
      console.warn('Failed to load from localStorage:', e)
    }
  }

  function loadExample() {
    input = EXAMPLE_JSON
    process()
    saveState()
  }

  function saveState() {
    if (saveInProgress) {
      clearTimeout(saveTimeout)
    }
    saveInProgress = true
    saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem('devutils-json-input', input)
        localStorage.setItem('devutils-json-compact', compact.toString())
      } catch (e) {
        error = 'Failed to save to localStorage: ' + e.message
        console.warn('Failed to save to localStorage:', e)
      } finally {
        saveInProgress = false
      }
    }, SAVE_DELAY)
  }

  onMount(() => {
    loadState()
    if (input) process()
  })

  onDestroy(() => {
    clearTimeout(timeout)
    clearTimeout(saveTimeout)
  })

  function validateInputSize() {
    if (input.length > MAX_INPUT_SIZE) {
      error = `Input exceeds maximum size of ${MAX_INPUT_SIZE / 1024 / 1024}MB. Large files may cause performance issues.`
      return false
    }
    return true
  }

  function process() {
    error = ''
    output = ''

    if (!input.trim()) {
      error = 'Please enter JSON input'
      return
    }

    if (!validateInputSize()) {
      return
    }

    try {
      const parsed = JSON.parse(input)
      output = compact ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2)
    } catch (e) {
      const match = e.message.match(/position (\d+)/i)
      if (match) {
        const position = parseInt(match[1])
        const lines = input.substring(0, position).split('\n')
        const line = lines.length
        const column = lines[lines.length - 1].length + 1
        error = `Invalid JSON at line ${line}, column ${column}`
      } else {
        error = 'Invalid JSON: ' + e.message
      }
    }
  }

  function debouncedProcess() {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      process()
      saveState()
    }, DEBOUNCE_DELAY)
  }

  function minify() {
    compact = true
    process()
    saveState()
  }

  function prettify() {
    compact = false
    process()
    saveState()
  }

  function clear() {
    input = ''
    output = ''
    error = ''
    try {
      localStorage.removeItem('devutils-json-input')
      localStorage.removeItem('devutils-json-compact')
    } catch (e) {
      error = 'Failed to clear localStorage: ' + e.message
      console.warn('Failed to clear localStorage:', e)
    }
  }
</script>

<div class="tool">
  <div class="tool-header">
    <div class="tool-meta">
      <h1 class="tool-name">JSON Formatter</h1>
      <p class="tool-desc">Format, validate, and minify JSON data</p>
    </div>
    <div class="tool-actions">
      <div class="segmented" role="tablist" aria-label="JSON formatting options">
        <button
          class="segment"
          class:active={!compact}
          on:click={prettify}
          role="tab"
          aria-selected={!compact}
          aria-label="Format JSON with indentation"
        >
          Prettify
        </button>
        <button
          class="segment"
          class:active={compact}
          on:click={minify}
          role="tab"
          aria-selected={compact}
          aria-label="Minify JSON to single line"
        >
          Minify
        </button>
      </div>
      <button class="icon-btn" on:click={loadExample} title="Load Example" aria-label="Load example JSON">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M12 6v6l4 2"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
      </button>
      <button class="icon-btn" on:click={clear} title="Clear" aria-label="Clear input and output">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    </div>
  </div>

  <div class="workspace">
    <div class="editor">
      <div class="editor-header">
        <span class="editor-label">Input</span>
        <span class="char-count">{input.length} chars</span>
      </div>
      <textarea
        bind:value={input}
        on:input={debouncedProcess}
        placeholder={PLACEHOLDER_TEXT}
        class="editor-textarea"
        spellcheck="false"
        aria-label="JSON input"
        aria-describedby={error ? 'json-error' : undefined}
      ></textarea>
    </div>

    <div class="editor">
      <div class="editor-header">
        <span class="editor-label">Output</span>
        <div class="editor-meta">
          {#if output}
            <span class="char-count">{output.length} chars</span>
            <CopyButton text={output} />
          {/if}
        </div>
      </div>
      {#if error}
        <div class="error-display" role="alert" id="json-error" aria-live="polite">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{error}</span>
        </div>
      {:else}
        <pre class="output-display" role="region" aria-label="JSON output">{output || 'Output will appear here...'}</pre>
      {/if}
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

  .error-display {
    flex: 1;
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    padding: var(--space-3);
    background: var(--error-soft);
    color: var(--error-text);
    font-size: var(--text-sm);
  }

  @media (max-width: 768px) {
    .workspace {
      grid-template-columns: 1fr;
    }

    .tool-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .tool-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
</style>
