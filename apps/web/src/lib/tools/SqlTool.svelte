<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import Workbench from '$lib/ui/Workbench.svelte'
  import ToolHeader from '$lib/ui/ToolHeader.svelte'
  import Button from '$lib/ui/Button.svelte'
  import { onMount, onDestroy } from 'svelte'
  import { format } from 'tols-cli/core/sql'

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

  let input = ''
  let output = ''
  /** @type {'uppercase' | 'lowercase'} */
  let keywordCase = 'uppercase'
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
        if (savedCase === 'uppercase' || savedCase === 'lowercase') keywordCase = savedCase
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

  function process() {
    output = ''
    errorMessage = ''

    if (!input.trim()) {
      output = ''
      return
    }

    try {
      if (input.length > MAX_INPUT_LENGTH) {
        throw new Error(`Input exceeds maximum length of ${MAX_INPUT_LENGTH} characters`)
      }
      output = format(input, { keywordCase })
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
   * @param {'uppercase' | 'lowercase'} case_
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
