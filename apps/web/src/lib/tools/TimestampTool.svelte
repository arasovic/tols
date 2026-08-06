<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import ToolHeader from '$lib/ui/ToolHeader.svelte'
  import FactStrip from '$lib/ui/FactStrip.svelte'
  import ToolShell from '$lib/ui/ToolShell.svelte'
  import PanelGroup from '$lib/ui/PanelGroup.svelte'
  import Panel from '$lib/ui/Panel.svelte'
  import Button from '$lib/ui/Button.svelte'
  import { onMount, onDestroy } from 'svelte'
  import { toHuman, toUnix } from 'tols-cli/core/timestamp'

  const DEBOUNCE_MS = 150
  const SAVE_DEBOUNCE_MS = 500

  function getExampleTimestamp() {
    return Math.floor(Date.now() / 1000).toString()
  }

  let input = ''
  let output = ''
  let mode = 'toHuman'
  let fromTimezone = 'UTC'
  let error = ''
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeout
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let saveTimeout
  let stateLoaded = false

  // Declared once so the strip and the ⌘⇧C payload cannot drift. `conv`
  // autodetects a number→human / date→unix (packages/tols/src/tools/timestamp.js),
  // so toHuman maps onto it; toUnix maps onto `parse`, which is unambiguously
  // date→unix. The timezone only feeds number→human, so it is a flag there only.
  $: cliAction = mode === 'toHuman' ? 'conv' : 'parse'
  $: cliFlags = mode === 'toHuman' ? { tz: fromTimezone } : {}

  const timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'Local', label: 'Local Time' },
    { value: 'America/New_York', label: 'New York (EST/EDT)' },
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' }
  ]

  function loadState() {
    try {
      const savedInput = localStorage.getItem('devutils-timestamp-input')
      const savedMode = localStorage.getItem('devutils-timestamp-mode')
      const savedTimezone = localStorage.getItem('devutils-timestamp-timezone')
      if (savedInput) {
        input = savedInput
      } else {
        input = getExampleTimestamp()
      }
      if (savedMode) mode = savedMode
      if (savedTimezone && timezones.find(tz => tz.value === savedTimezone)) {
        fromTimezone = savedTimezone
      }
      stateLoaded = true
    } catch (/** @type {any} */ e) {
      input = getExampleTimestamp()
      stateLoaded = true
      console.warn('Failed to load from localStorage:', e)
    }
  }

  function saveState() {
    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem('devutils-timestamp-input', input)
        localStorage.setItem('devutils-timestamp-mode', mode)
        localStorage.setItem('devutils-timestamp-timezone', fromTimezone)
      } catch (/** @type {any} */ e) {
        console.warn('Failed to save to localStorage:', e)
      }
    }, SAVE_DEBOUNCE_MS)
  }

  onMount(() => {
    loadState()
    if (stateLoaded && input) process()
  })

  onDestroy(() => {
    clearTimeout(timeout)
    clearTimeout(saveTimeout)
  })


  function process() {
    error = ''
    output = ''

    if (!input || !input.trim()) {
      error = ''
      return
    }

    const trimmedInput = input.trim()

    try {
      if (mode === 'toHuman') {
        output = JSON.stringify(toHuman(trimmedInput, fromTimezone), null, 2)
      } else {
        output = JSON.stringify(toUnix(trimmedInput), null, 2)
      }
    } catch (/** @type {any} */ e) {
      error = e.message
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
    clearTimeout(saveTimeout)
    input = ''
    output = ''
    error = ''
    try {
      localStorage.removeItem('devutils-timestamp-input')
      localStorage.removeItem('devutils-timestamp-mode')
      localStorage.removeItem('devutils-timestamp-timezone')
    } catch (/** @type {any} */ e) {
      console.warn('Failed to clear localStorage:', e)
    }
  }

  function loadExample() {
    input = getExampleTimestamp()
    process()
    saveState()
  }

  function now() {
    const nowTs = Math.floor(Date.now() / 1000)
    input = nowTs.toString()
    process()
    saveState()
  }

  /**
   * @param {string} newMode
   */
  function setMode(newMode) {
    mode = newMode
    input = ''
    output = ''
    error = ''
    saveState()
  }
</script>

<div class="tool">
  <ToolHeader toolId="timestamp" />

  <ToolShell
    toolId="timestamp"
    action={cliAction}
    flags={cliFlags}
    {input}
    {output}
    onRun={process}
    let:copyNotice
  >
    <div class="controls-card">
      <div class="mode-selector">
        <button type="button"
          class="mode-btn"
          class:active={mode === 'toHuman'}
          on:click={() => setMode('toHuman')}
          aria-pressed={mode === 'toHuman'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Unix → Human
        </button>
        <button type="button"
          class="mode-btn"
          class:active={mode === 'toUnix'}
          on:click={() => setMode('toUnix')}
          aria-pressed={mode === 'toUnix'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <polyline points="17 1 21 5 17 9"></polyline>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
            <polyline points="7 23 3 19 7 15"></polyline>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
          </svg>
          Human → Unix
        </button>
      </div>
    </div>

    {#if mode === 'toHuman'}
      <div class="timezone-card">
        <div class="timezone-header">
          <span class="control-label">Output Timezone</span>
        </div>
        <div class="timezone-grid">
          {#each timezones as tz}
            <button type="button"
              class="tz-btn"
              class:active={fromTimezone === tz.value}
              on:click={() => { fromTimezone = tz.value; process(); }}
              aria-pressed={fromTimezone === tz.value}
            >
              {tz.label}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <PanelGroup columns={1}>
      <Panel label={mode === 'toHuman' ? 'Unix Timestamp' : 'Date & Time'}>
        <input
          id="timestamp-input"
          type="text"
          bind:value={input}
          on:input={debouncedProcess}
          on:keydown={(e) => e.key === 'Enter' && process()}
          placeholder={mode === 'toHuman' ? 'Enter Unix timestamp (e.g., 1704067200)...' : 'Enter date (e.g., 2024-01-01 00:00:00)...'}
          class="input-field mono"
          aria-describedby="timestamp-error"
        />
      </Panel>

      {#if error}
        <div id="timestamp-error" class="error-state" role="alert" aria-live="polite">
          <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
        </div>
      {:else if output}
        <Panel label="Converted" meta={copyNotice || ''}>
          <div class="output-content">
            <pre><code>{output}</code></pre>
          </div>
        </Panel>
      {:else}
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>Enter a timestamp or date to convert</span>
        </div>
      {/if}
    </PanelGroup>

    <FactStrip
      facts={[
        {
          label: 'Mode',
          value: mode === 'toHuman' ? 'Unix → Human' : 'Human → Unix',
          presentation: 'accent'
        },
        ...(mode === 'toHuman' && fromTimezone !== 'Local'
          ? [{ label: 'Timezone', value: fromTimezone }]
          : [])
      ]}
    />

    <svelte:fragment slot="rail">
      {#if mode === 'toHuman'}
        <Button on:click={now}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Now
        </Button>
      {/if}
      <Button on:click={loadExample} aria-label="Load Example">example</Button>
      <Button on:click={clear} aria-label="Clear">clear</Button>
    </svelte:fragment>

    <svelte:fragment slot="rail-end">
      {#if output}<CopyButton text={output} />{/if}
    </svelte:fragment>
  </ToolShell>
</div>

<style>
  .tool {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    width: 100%;
  }

  .controls-card {
    display: flex;
    justify-content: center;
    padding: var(--space-3);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
  }

  .mode-selector {
    display: flex;
    background: var(--bg-elevated);
    padding: var(--space-1);
    border-radius: var(--radius);
    border: 1px solid var(--border-subtle);
  }

  .mode-btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-secondary);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    transition: all var(--transition) var(--ease-out);
    white-space: nowrap;
  }

  .mode-btn:hover {
    color: var(--text-primary);
    background: var(--bg-hover);
  }

  .mode-btn.active {
    background: var(--accent);
    color: white;
    box-shadow: var(--shadow-accent-sm);
  }

  .timezone-card {
    padding: var(--space-3);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
  }

  .timezone-header {
    margin-bottom: var(--space-3);
  }

  .control-label {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
  }

  .timezone-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .tz-btn {
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-sm);
    background: var(--bg-elevated);
    color: var(--text-secondary);
    font-size: var(--text-xs);
    border: 1px solid var(--border-subtle);
    transition: all var(--transition) var(--ease-out);
  }

  .tz-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
    border-color: var(--border-default);
  }

  .tz-btn.active {
    background: var(--accent-muted);
    color: var(--accent);
    border-color: var(--accent-muted);
  }

  .input-field {
    padding: var(--space-3);
    border: none;
    background: var(--bg-surface);
    color: var(--text-primary);
    font-size: var(--text-sm);
  }

  .input-field:focus {
    outline: none;
  }

  .input-field::placeholder {
    color: var(--text-disabled);
  }

  .output-content {
    padding: var(--space-4);
    overflow-x: auto;
    max-height: 250px;
    overflow-y: auto;
  }

  .output-content pre {
    margin: 0;
    padding: 0;
    background: transparent;
    border: none;
  }

  .output-content code {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--text-primary);
    line-height: 1.8;
    white-space: pre;
  }

  .error-state {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--error-subtle);
    border: 1px solid var(--error-muted);
    border-radius: var(--radius-md);
    color: var(--error);
    font-size: var(--text-sm);
  }

  .error-icon {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    margin-top: 1px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-8);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    color: var(--text-tertiary);
    font-size: var(--text-sm);
  }

  .empty-icon {
    width: 32px;
    height: 32px;
    opacity: 0.5;
  }

  @media (max-width: 768px) {
    .mode-selector {
      flex-direction: column;
      width: 100%;
    }

    .mode-btn {
      justify-content: center;
    }
  }
</style>