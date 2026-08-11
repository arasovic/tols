<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import ShareButton from '$lib/components/ShareButton.svelte'
  import PasteButton from '$lib/components/PasteButton.svelte'
  import ToolHeader from '$lib/ui/ToolHeader.svelte'
  import ToolShell from '$lib/ui/ToolShell.svelte'
  import PanelGroup from '$lib/ui/PanelGroup.svelte'
  import Panel from '$lib/ui/Panel.svelte'
  import Button from '$lib/ui/Button.svelte'
  import { readShareFragment } from '$lib/utils/share.js'
  import { fileDrop } from '$lib/utils/fileDrop.js'
  import { onMount, onDestroy } from 'svelte'
  import { validateCron, getDescription, getNextRuns } from 'tols-cli/core/cron'

  const CRON_PARTS = ['minute', 'hour', 'day', 'month', 'weekday']

  let input = '* * * * *'
  let description = ''
  /** @type {Date[]} */
  let nextRuns = []
  let error = ''
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeout
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let saveTimeout

  function loadState() {
    try {
      const savedInput = localStorage.getItem('devutils-cron-input')
      if (savedInput) input = savedInput
    } catch (/** @type {any} */ e) {
      console.error('Failed to load state from localStorage:', e)
    }
  }

  function saveState() {
    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem('devutils-cron-input', input)
      } catch (/** @type {any} */ e) {
        console.error('Failed to save state to localStorage:', e)
      }
    }, 500)
  }

  onMount(() => {
    // A shared link takes precedence over locally saved state
    const shared = readShareFragment()
    if (shared && typeof shared.input === 'string') {
      input = shared.input
    } else {
      loadState()
    }
    process()
  })

  onDestroy(() => {
    clearTimeout(timeout)
    clearTimeout(saveTimeout)
  })

  function process() {
    error = ''
    description = ''
    nextRuns = []

    if (!input.trim()) {
      error = 'Please enter a cron expression'
      return
    }

    const validationError = validateCron(input)
    if (validationError) {
      error = validationError
      return
    }

    description = getDescription(input)
    nextRuns = getNextRuns(input, 5)
  }

  function debouncedProcess() {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      process()
      saveState()
    }, 300)
  }

  /**
   * @param {string} cron
   */
  function setExample(cron) {
    input = cron
    process()
    saveState()
  }

  function clear() {
    input = ''
    description = ''
    nextRuns = []
    error = ''
    try {
      localStorage.removeItem('devutils-cron-input')
    } catch (/** @type {any} */ e) {
      console.error('Failed to clear state from localStorage:', e)
    }
  }

  /**
   * @param {Date} date
   */
  function formatDate(date) {
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
</script>

<div class="tool">
  <ToolHeader toolId="cron" />

  <ToolShell
    toolId="cron"
    action="parse"
    {input}
    output={description}
    onRun={process}
  >
    <div class="cron-input-section">
      <div class="cron-parts">
        {#each CRON_PARTS as part, i}
          <div class="cron-part">
            <span class="cron-part-label">{part}</span>
            <span class="cron-part-value">{input.split(/\s+/)[i] || '*'}</span>
          </div>
        {/each}
      </div>
      <input
        type="text"
        bind:value={input}
        on:input={debouncedProcess}
        use:fileDrop={{ onText: (text) => { input = text.trim(); process() } }}
        class="cron-input"
        class:invalid={error}
        placeholder="* * * * *"
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? 'cron-error' : undefined}
      />
    </div>

    {#if error}
      <div class="error-display" role="alert" aria-live="polite" id="cron-error">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>{error}</span>
      </div>
    {/if}

    {#if description && !error}
      <PanelGroup columns={1}>
        <Panel label="Description" data-testid="description-panel">
          <p class="description-text">{description}</p>
        </Panel>

        {#if nextRuns.length > 0}
          <Panel label="Next Execution Times" data-testid="next-runs-panel">
            <ul class="runs-list">
              {#each nextRuns as run}
                <li class="run-item">
                  <span class="run-date">{formatDate(run)}</span>
                  <CopyButton text={run.toISOString()} size="sm" />
                </li>
              {/each}
            </ul>
          </Panel>
        {/if}
      </PanelGroup>
    {/if}

    <div class="examples-section">
      <h3>Common Examples</h3>
      <div class="examples-grid">
        <button type="button" class="example-btn" on:click={() => setExample('*/5 * * * *')}>Every 5 minutes</button>
        <button type="button" class="example-btn" on:click={() => setExample('0 * * * *')}>Every hour</button>
        <button type="button" class="example-btn" on:click={() => setExample('0 0 * * *')}>Daily at midnight</button>
        <button type="button" class="example-btn" on:click={() => setExample('0 0 * * 0')}>Weekly on Sunday</button>
        <button type="button" class="example-btn" on:click={() => setExample('0 0 1 * *')}>Monthly</button>
        <button type="button" class="example-btn" on:click={() => setExample('0 9 * * 1-5')}>Weekdays at 9am</button>
      </div>
    </div>

    <svelte:fragment slot="rail">
      <Button on:click={clear} aria-label="Clear" title="Clear">clear</Button>
    </svelte:fragment>

    <svelte:fragment slot="rail-end">
      <PasteButton on:text={(e) => { input = e.detail.text; process() }} />
      <ShareButton getState={() => ({ input })} />
    </svelte:fragment>
  </ToolShell>
</div>

<style>
  .tool { display: flex; flex-direction: column; gap: 0; width: 100%; }

  .cron-input-section { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-4); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .cron-parts { display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--space-2); }
  .cron-part { display: flex; flex-direction: column; align-items: center; gap: var(--space-1); padding: var(--space-2); background: var(--bg-elevated); border-radius: var(--radius); }
  .cron-part-label { font-size: var(--text-xs); text-transform: uppercase; letter-spacing: var(--tracking-wide); color: var(--text-tertiary); }
  .cron-part-value { font-family: var(--font-mono); font-size: var(--text-lg); font-weight: var(--font-semibold); color: var(--text-primary); }
  .cron-input { width: 100%; padding: var(--space-3); font-family: var(--font-mono); font-size: var(--text-lg); text-align: center; color: var(--text-primary); background: var(--bg-elevated); border: 1px solid var(--border-default); border-radius: var(--radius); outline: none; }
  .cron-input:focus { border-color: var(--accent); box-shadow: var(--glow-focus); }
  .cron-input.invalid { border-color: var(--error); background: var(--error-soft); }
  .error-display { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4); background: var(--error-soft); color: var(--error-text); border-radius: var(--radius-md); }
  .description-text { font-size: var(--text-lg); color: var(--text-primary); margin: 0; padding: var(--space-4); }
  .runs-list { list-style: none; margin: 0; padding: 0; }
  .run-item { display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border-subtle); }
  .run-item:last-child { border-bottom: none; }
  .run-date { font-family: var(--font-mono); font-size: var(--text-sm); color: var(--text-primary); }
  .examples-section h3 { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--text-tertiary); margin-bottom: var(--space-3); text-transform: uppercase; letter-spacing: var(--tracking-wide); }
  .examples-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: var(--space-2); }
  .example-btn { padding: var(--space-2) var(--space-3); font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-secondary); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius); cursor: pointer; transition: all var(--transition-fast) var(--ease-out); }
  .example-btn:hover { background: var(--accent-soft); color: var(--accent); border-color: var(--accent-dim); }
  @media (max-width: 768px) { .cron-parts { grid-template-columns: repeat(3, 1fr); } .examples-grid { grid-template-columns: repeat(2, 1fr); } }
</style>