<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import ShareButton from '$lib/components/ShareButton.svelte'
  import PasteButton from '$lib/components/PasteButton.svelte'
  import ToolHeader from '$lib/ui/ToolHeader.svelte'
  import FactStrip from '$lib/ui/FactStrip.svelte'
  import ToolShell from '$lib/ui/ToolShell.svelte'
  import PanelGroup from '$lib/ui/PanelGroup.svelte'
  import Panel from '$lib/ui/Panel.svelte'
  import Button from '$lib/ui/Button.svelte'
  import { readShareFragment } from '$lib/utils/share.js'
  import { fileDrop } from '$lib/utils/fileDrop.js'
  import { onMount, onDestroy } from 'svelte'
  import { VALID_FLAGS, validateFlags } from 'tols-cli/core/regex'

  const EXAMPLE_REGEX = '\\d+'
  const EXAMPLE_TEXT = 'There are 42 apples and 123 oranges'
  const REGEX_TIMEOUT_MS = 5000
  const DEBOUNCE_DELAY_MS = 150
  const SAVE_DELAY_MS = 500

  let input = ''
  let pattern = ''
  let flags = 'g'
  /** @type {RegExpMatchArray[]} */
  let matches = []
  let error = ''
  let errorDetails = ''
  let highlightedInput = ''
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timeout = null
  /** @type {ReturnType<typeof setTimeout> | null} */
  let saveTimeout = null
  /** @type {Worker | null} */
  let currentWorker = null
  let persistentError = ''

  // The CLI mirrors the single match mode as `tols regex match` with
  // --pattern= and --flags= (packages/tols/src/tools/regex.js). Deriving both
  // here once keeps the strip and the ⌘⇧C payload from drifting.
  $: cliFlags = { pattern, flags }
  $: matchesText = matches.map(m => m[0]).join('\n')

  const flagOptions = [
    { value: 'g', label: 'Global', desc: 'Find all matches' },
    { value: 'i', label: 'Case Insensitive', desc: 'Ignore case' },
    { value: 'm', label: 'Multiline', desc: '^$ match line start/end' },
    { value: 's', label: 'Dotall', desc: '. matches newlines' },
    { value: 'u', label: 'Unicode', desc: 'Enable unicode' },
    { value: 'y', label: 'Sticky', desc: 'Match from lastIndex only' }
  ]

  const workerScript = `
    self.onmessage = function(e) {
      const { pattern, flags, text, id } = e.data;
      try {
        const regex = new RegExp(pattern, flags);
        let result;
        if (!regex.global) {
          result = text.match(regex);
        } else {
          result = Array.from(text.matchAll(regex));
        }
        self.postMessage({ id, result, error: null });
      } catch (err) {
        self.postMessage({ id, result: null, error: err.message });
      }
    };
  `;

  function createWorker() {
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    return new Worker(workerUrl);
  }

  function terminateWorker() {
    if (currentWorker) {
      currentWorker.terminate();
      currentWorker = null;
    }
  }

  function loadState() {
    try {
      const savedInput = localStorage.getItem('devutils-regex-input')
      const savedPattern = localStorage.getItem('devutils-regex-pattern')
      const savedFlags = localStorage.getItem('devutils-regex-flags')
      if (savedInput) {
        input = savedInput
      } else {
        input = EXAMPLE_TEXT
      }
      if (savedPattern) {
        pattern = savedPattern
      } else {
        pattern = EXAMPLE_REGEX
      }
      if (savedFlags) {
        const validatedFlags = validateFlags(savedFlags)
        flags = validatedFlags || 'g'
      }
      error = ''
      errorDetails = ''
    } catch (/** @type {any} */ e) {
      input = EXAMPLE_TEXT
      pattern = EXAMPLE_REGEX
      flags = 'g'
      persistentError = `Failed to load from localStorage: ${e.message || 'Unknown error'}`
    }
  }

  function saveState() {
    try {
      if (saveTimeout) clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        try {
          localStorage.setItem('devutils-regex-input', input)
          localStorage.setItem('devutils-regex-pattern', pattern)
          localStorage.setItem('devutils-regex-flags', flags)
          persistentError = ''
        } catch (/** @type {any} */ e) {
          persistentError = `Failed to save to localStorage: ${e.message || 'Unknown error'}`
        }
      }, SAVE_DELAY_MS)
    } catch (/** @type {any} */ e) {
      persistentError = `Failed to save to localStorage: ${e.message || 'Unknown error'}`
    }
  }

  onMount(() => {
    // A shared link takes precedence over locally saved state
    const shared = readShareFragment()
    if (shared && (typeof shared.pattern === 'string' || typeof shared.input === 'string')) {
      if (typeof shared.pattern === 'string') pattern = shared.pattern
      if (typeof shared.input === 'string') input = shared.input
      if (typeof shared.flags === 'string') flags = shared.flags
      performMatch()
    } else {
      loadState()
      performMatch()
    }
  })

  onDestroy(() => {
    if (timeout) clearTimeout(timeout)
    if (saveTimeout) clearTimeout(saveTimeout)
    terminateWorker()
  })

  /**
   * @param {string} text
   */
  function escapeHtml(text) {
    if (!text) return ''
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/`/g, '&#96;')
      .replace(/\0/g, '&#0;')
  }

  /**
   * @param {string} pattern
   * @param {string} flags
   * @param {string} text
   * @returns {Promise<RegExpMatchArray | RegExpMatchArray[] | null>}
   */
  async function performMatchWithTimeout(pattern, flags, text) {
    // Check if Web Workers are available (not available in test environments like jsdom)
    const workersAvailable = typeof Worker !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL

    if (!workersAvailable) {
      // Fallback to synchronous execution for test environments
      return new Promise((resolve, reject) => {
        try {
          const regex = new RegExp(pattern, flags)
          let result
          if (!regex.global) {
            result = text.match(regex)
          } else {
            result = Array.from(text.matchAll(regex))
          }
          resolve(result)
        } catch (/** @type {any} */ err) {
          reject(new Error(err.message))
        }
      })
    }

    return new Promise((resolve, reject) => {
      terminateWorker()

      const worker = createWorker()
      currentWorker = worker
      const timeoutId = setTimeout(() => {
        terminateWorker()
        reject(new Error('Regex operation timed out - possible catastrophic backtracking'))
      }, REGEX_TIMEOUT_MS)

      worker.onmessage = (e) => {
        clearTimeout(timeoutId)
        terminateWorker()
        const { result, error: workerError } = e.data
        if (workerError) {
          reject(new Error(workerError))
        } else {
          resolve(result)
        }
      }

      worker.onerror = (e) => {
        clearTimeout(timeoutId)
        terminateWorker()
        reject(new Error('Worker error: ' + e.message))
      }

      worker.postMessage({ pattern, flags, text, id: Date.now() })
    })
  }

  async function performMatch() {
    error = ''
    errorDetails = ''
    matches = []
    highlightedInput = ''

    if (!pattern.trim()) {
      highlightedInput = ''
      return
    }

    if (!input) {
      highlightedInput = ''
      return
    }

    try {
      const validatedFlags = validateFlags(flags)

      let matchResult = await performMatchWithTimeout(pattern, validatedFlags, input)

      const isGlobal = validatedFlags.includes('g')

      if (!isGlobal) {
        if (matchResult) {
          matches = [/** @type {RegExpMatchArray} */ (matchResult)]
        }
      } else {
        matches = /** @type {RegExpMatchArray[]} */ (matchResult || [])
      }

      let highlighted = ''
      let lastIndex = 0

      matches.forEach(match => {
        if (!match || typeof match.index !== 'number') {
          return
        }
        const start = match.index
        const end = start + (match[0]?.length || 0)
        highlighted += escapeHtml(input.substring(lastIndex, start))
        highlighted += `<mark class="match-highlight">${escapeHtml(match[0] || '')}</mark>`
        lastIndex = end
      })

      highlighted += escapeHtml(input.substring(lastIndex))

      highlightedInput = highlighted || escapeHtml(input)
    } catch (/** @type {any} */ e) {
      error = 'Invalid regex pattern'
      errorDetails = e.message || 'Unknown error'
      matches = []
      highlightedInput = ''
    }
  }

  function debouncedMatch() {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      performMatch()
      saveState()
    }, DEBOUNCE_DELAY_MS)
  }

  function clear() {
    input = ''
    pattern = ''
    matches = []
    highlightedInput = ''
    error = ''
    errorDetails = ''
    persistentError = ''
    try {
      localStorage.removeItem('devutils-regex-input')
      localStorage.removeItem('devutils-regex-pattern')
      localStorage.removeItem('devutils-regex-flags')
    } catch (/** @type {any} */ e) {
      persistentError = `Failed to clear localStorage: ${e.message || 'Unknown error'}`
    }
  }

  function loadExample() {
    error = ''
    errorDetails = ''
    input = EXAMPLE_TEXT
    pattern = EXAMPLE_REGEX
    performMatch()
    saveState()
  }

  /**
   * @param {string} flag
   */
  function toggleFlag(flag) {
    if (!VALID_FLAGS.has(flag)) return
    if (flags.includes(flag)) {
      flags = flags.replace(new RegExp(flag, 'g'), '')
    } else {
      flags += flag
    }
    performMatch()
    saveState()
  }

  function dismissPersistentError() {
    persistentError = ''
  }
</script>

<div class="tool">
  <ToolHeader toolId="regex" />

  <ToolShell
    toolId="regex"
    action="match"
    flags={cliFlags}
    {input}
    output={matchesText}
    onRun={performMatch}
  >
    {#if persistentError}
      <div class="persistent-error">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span class="error-content">{persistentError}</span>
        <button type="button" class="error-dismiss" on:click={dismissPersistentError} aria-label="Dismiss error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    {/if}

    <div class="pattern-card">
      <label for="regex-pattern" class="pattern-label">Regex Pattern</label>
      <div class="pattern-input-group">
        <span class="delimiter">/</span>
        <input
          type="text"
          id="regex-pattern"
          bind:value={pattern}
          on:input={debouncedMatch}
          placeholder="Enter regex pattern..."
          class="pattern-input mono"
          spellcheck="false"
          aria-label="Regex pattern"
        />
        <span class="delimiter">/</span>
        <span class="flags-display mono" aria-label="Active regex flags">{flags}</span>
      </div>
      <div class="flags-row">
        {#each flagOptions as flag}
          <button type="button"
            class="flag-btn"
            class:active={flags.includes(flag.value)}
            on:click={() => toggleFlag(flag.value)}
            title="{flag.label}: {flag.desc}"
            aria-label="Toggle {flag.label} flag ({flag.value})"
            aria-pressed={flags.includes(flag.value)}
          >
            {flag.value}
          </button>
        {/each}
      </div>
    </div>

    {#if error}
      <div class="error-state">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <div class="error-content">
          <span class="error-title">{error}</span>
          {#if errorDetails}
            <span class="error-details">{errorDetails}</span>
          {/if}
        </div>
      </div>
    {/if}

    <PanelGroup>
      <Panel label="Test String" meta="{input.length} chars">
        <textarea
          id="regex-input-text"
          bind:value={input}
          on:input={debouncedMatch}
          use:fileDrop={{ onText: (text) => { input = text; performMatch() } }}
          placeholder="Enter text to test against the regex..."
          class="input-area"
          spellcheck="false"
          aria-label="Text to match against regex pattern"
        ></textarea>
      </Panel>

      <Panel label="Matches" meta={matches.length > 0 ? String(matches.length) : ''}>
        {#if highlightedInput}
          <div class="highlighted-area">{@html highlightedInput}</div>
        {:else}
          <div class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
              <path d="m15 5 4 4"></path>
            </svg>
            <span>
              {#if !pattern.trim()}
                Enter a regex pattern to see matches
              {:else if !input}
                Enter text to test against the regex
              {:else}
                Matches will appear here
              {/if}
            </span>
          </div>
        {/if}
      </Panel>
    </PanelGroup>

    {#if matches.length > 0}
      <PanelGroup columns={1}>
        <Panel label="Match Details" meta="{matches.length} matches">
          <div class="matches-list">
            {#each matches as match, i}
              <div class="match-item" style="animation-delay: {i * 30}ms">
                <span class="match-index">{i + 1}</span>
                <div class="match-content">
                  <code class="match-text">{match[0]}</code>
                  {#if match.length > 1}
                    <div class="match-groups">
                      {#each match.slice(1) as group, gi}
                        <span class="group-item">
                          <span class="group-label">Group {gi + 1}:</span>
                          <code class="group-value">{group || '(empty)'}</code>
                        </span>
                      {/each}
                    </div>
                  {/if}
                </div>
                <span class="match-position">@{match.index}</span>
              </div>
            {/each}
          </div>
        </Panel>
      </PanelGroup>
    {/if}

    <FactStrip
      facts={[
        { label: 'Flags', value: flags || '(none)', presentation: 'mono' },
        { label: 'Pattern', value: pattern || '(empty)', presentation: 'mono' }
      ]}
    />

    <svelte:fragment slot="rail">
      <Button on:click={loadExample} aria-label="Load Example" title="Load Example">example</Button>
      <Button on:click={clear} aria-label="Clear" title="Clear">clear</Button>
    </svelte:fragment>

    <svelte:fragment slot="rail-end">
      <PasteButton on:text={(e) => { input = e.detail.text; performMatch() }} />
      {#if matchesText}<CopyButton text={matchesText} />{/if}
      <ShareButton getState={() => ({ pattern, input, flags })} />
    </svelte:fragment>
  </ToolShell>
</div>

<style>
  .tool {
    display: flex;
    flex-direction: column;
    gap: 0;
    width: 100%;
  }

  .persistent-error {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--error-subtle);
    border: 1px solid var(--error-muted);
    border-radius: var(--radius-md);
    color: var(--error);
    font-size: var(--text-sm);
  }

  .persistent-error .error-icon {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
  }

  .persistent-error .error-content {
    flex: 1;
  }

  .error-dismiss {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: var(--radius);
    background: transparent;
    color: var(--error);
    transition: all var(--transition) var(--ease-out);
    flex-shrink: 0;
  }

  .error-dismiss:hover {
    background: var(--error-muted);
  }

  .pattern-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
  }

  .pattern-input-group {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: var(--bg-base);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius);
  }

  .delimiter {
    font-family: var(--font-mono);
    color: var(--accent);
    font-weight: var(--font-bold);
    font-size: var(--text-lg);
  }

  .pattern-input {
    flex: 1;
    padding: var(--space-1);
    border: none;
    background: transparent;
    color: var(--text-primary);
    font-size: var(--text-base);
  }

  .pattern-input:focus {
    outline: none;
  }

  .pattern-input::placeholder {
    color: var(--text-disabled);
  }

  .flags-display {
    color: var(--accent-secondary);
    font-size: var(--text-sm);
    min-width: 30px;
  }

  .flags-row {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .flag-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--radius);
    background: var(--bg-elevated);
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-weight: var(--font-semibold);
    font-size: var(--text-sm);
    border: 1px solid var(--border-subtle);
    transition: all var(--transition) var(--ease-out);
  }

  .flag-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
    border-color: var(--border-default);
  }

  .flag-btn.active {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
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

  .error-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .error-title {
    font-weight: var(--font-semibold);
  }

  .error-details {
    color: var(--error-muted);
    font-size: var(--text-xs);
  }

  .input-area {
    min-height: 280px;
    padding: var(--space-3);
    border: none;
    background: var(--bg-surface);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: 1.6;
    resize: vertical;
  }

  .input-area:focus {
    outline: none;
  }

  .input-area::placeholder {
    color: var(--text-disabled);
  }

  .highlighted-area {
    min-height: 280px;
    padding: var(--space-3);
    background: var(--bg-base);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-y: auto;
    max-height: 280px;
    color: var(--text-primary);
  }

  .highlighted-area :global(.match-highlight) {
    background: var(--accent-muted);
    color: var(--accent);
    padding: 1px 2px;
    border-radius: 2px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    min-height: 280px;
    color: var(--text-tertiary);
    font-size: var(--text-sm);
  }

  .empty-icon {
    width: 32px;
    height: 32px;
    opacity: 0.5;
  }

  .matches-list {
    max-height: 250px;
    overflow-y: auto;
    background: var(--bg-base);
  }

  .match-item {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-3);
    border-bottom: 1px solid var(--border-subtle);
    transition: background var(--transition) var(--ease-out);
    animation: fadeInUp var(--transition-normal) ease backwards;
  }

  .match-item:last-child {
    border-bottom: none;
  }

  .match-item:hover {
    background: var(--bg-hover);
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .match-index {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: var(--bg-elevated);
    color: var(--text-tertiary);
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    border-radius: var(--radius-full);
    flex-shrink: 0;
  }

  .match-content {
    flex: 1;
    min-width: 0;
  }

  .match-text {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--accent);
    word-break: break-all;
  }

  .match-groups {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-1);
  }

  .group-item {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-xs);
  }

  .group-label {
    color: var(--text-tertiary);
  }

  .group-value {
    font-family: var(--font-mono);
    color: var(--text-secondary);
    background: var(--bg-elevated);
    padding: 1px 4px;
    border-radius: 2px;
  }

  .match-position {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    flex-shrink: 0;
  }

  .mono {
    font-family: var(--font-mono);
  }

  .pattern-label {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
  }
</style>