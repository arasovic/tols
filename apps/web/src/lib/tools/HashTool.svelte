<script context="module">
  export const EXAMPLE_HASH_TEXT = 'Hello World'
  export const DEBOUNCE_DELAY_MS = 150
  export const SAVE_DEBOUNCE_DELAY_MS = 500
  export const MAX_INPUT_LENGTH = 100000
</script>

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
  import { hash as coreHash } from 'tols/core/hash'
  import { onMount, onDestroy } from 'svelte'

  let input = ''
  let algorithm = 'SHA-256'
  let output = ''
  let error = ''
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeout
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let saveTimeout
  let pendingHashId = 0

  const algorithms = [
    { value: 'SHA-256', name: 'SHA-256', bits: 256 },
    { value: 'SHA-512', name: 'SHA-512', bits: 512 },
    { value: 'SHA-1', name: 'SHA-1', bits: 160 },
    { value: 'MD5', name: 'MD5', bits: 128 }
  ]

  const validAlgorithmValues = algorithms.map(a => a.value)

  // Declared once so the strip and the ⌘⇧C payload cannot drift. The CLI names
  // the algorithms md5|sha1|sha256|sha512 (cli/templates.js) while the selector
  // carries the display hyphen, so the two spellings have to be reconciled
  // somewhere — doing it twice is how one of them ends up stale.
  $: cliAction = algorithm.toLowerCase().replace('-', '')

  /**
   * @param {string} algo
   */
  function isValidAlgorithm(algo) {
    return validAlgorithmValues.includes(algo)
  }

  function loadState() {
    if (typeof window === 'undefined') return

    try {
      const savedInput = localStorage.getItem('devutils-hash-input')
      const savedAlgorithm = localStorage.getItem('devutils-hash-algorithm')
      if (savedInput) {
        input = savedInput
      } else {
        input = EXAMPLE_HASH_TEXT
        hash()
      }
      if (savedAlgorithm && isValidAlgorithm(savedAlgorithm)) {
        algorithm = savedAlgorithm
      }
    } catch (/** @type {any} */ e) {
      input = EXAMPLE_HASH_TEXT
      console.warn('Failed to load from localStorage:', e)
    }
  }

  function saveState() {
    if (typeof window === 'undefined') return

    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem('devutils-hash-input', input)
        localStorage.setItem('devutils-hash-algorithm', algorithm)
      } catch (/** @type {any} */ e) {
        console.warn('Failed to save to localStorage:', e)
      }
    }, SAVE_DEBOUNCE_DELAY_MS)
  }

  onMount(() => {
    // A shared link takes precedence over locally saved state
    const shared = readShareFragment()
    if (shared && typeof shared.input === 'string') {
      input = shared.input
      if (shared.algorithm && algorithms.some(a => a.value === shared.algorithm)) {
        algorithm = shared.algorithm
      }
      hash()
    } else {
      loadState()
      if (input) hash()
    }
  })

  onDestroy(() => {
    clearTimeout(timeout)
    clearTimeout(saveTimeout)
  })

  async function hash() {
    const currentHashId = ++pendingHashId
    error = ''

    if (!input.trim()) {
      output = ''
      return
    }

    try {
      let result
      result = await coreHash(input, algorithm.replace('-', '').toLowerCase())

      if (currentHashId === pendingHashId) {
        output = result
      }
    } catch (/** @type {any} */ e) {
      if (currentHashId === pendingHashId) {
        output = ''
        error = 'Hash calculation failed. Please try again.'
      }
    }
  }

  function debouncedHash() {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      hash()
      saveState()
    }, DEBOUNCE_DELAY_MS)
  }

  function clear() {
    input = ''
    output = ''
    error = ''
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem('devutils-hash-input')
      localStorage.removeItem('devutils-hash-algorithm')
    } catch (/** @type {any} */ e) {
      console.warn('Failed to clear localStorage:', e)
    }
  }

  function loadExample() {
    input = EXAMPLE_HASH_TEXT
    hash()
    saveState()
  }

  /**
   * @param {string} algo
   */
  function selectAlgorithm(algo) {
    algorithm = algo
    hash()
    saveState()
  }

  function getCurrentAlgorithmBits() {
    const algo = algorithms.find(a => a.value === algorithm)
    return algo ? algo.bits : 0
  }

  /**
   * @param {KeyboardEvent} event
   * @param {{ value: string, name: string, bits: number }} algo
   */
  function handleAlgoKeyDown(event, algo) {
    const currentIndex = algorithms.findIndex(a => a.value === algorithm)
    const algoIndex = algorithms.findIndex(a => a.value === algo.value)

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selectAlgorithm(algo.value)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      const prevIndex = algoIndex > 0 ? algoIndex - 1 : algorithms.length - 1
      const prevAlgo = algorithms[prevIndex]
      selectAlgorithm(prevAlgo.value)
      const prevButton = /** @type {HTMLElement | null} */ (document.querySelector(`[data-algo="${prevAlgo.value}"]`))
      if (prevButton) prevButton.focus()
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      const nextIndex = algoIndex < algorithms.length - 1 ? algoIndex + 1 : 0
      const nextAlgo = algorithms[nextIndex]
      selectAlgorithm(nextAlgo.value)
      const nextButton = /** @type {HTMLElement | null} */ (document.querySelector(`[data-algo="${nextAlgo.value}"]`))
      if (nextButton) nextButton.focus()
    }
  }
</script>

<div class="tool">
  <ToolHeader toolId="hash" />

  <ToolShell
    toolId="hash"
    action={cliAction}
    {input}
    {output}
    onRun={hash}
    let:copyNotice
  >
    <div class="controls-card">
      <span class="control-label">Select Algorithm</span>
      <div class="algorithm-selector" role="radiogroup" aria-label="Hash algorithm selection">
        {#each algorithms as algo}
          <button
            class="algo-btn"
            class:active={algorithm === algo.value}
            on:click={() => selectAlgorithm(algo.value)}
            on:keydown={(e) => handleAlgoKeyDown(e, algo)}
            role="radio"
            aria-checked={algorithm === algo.value}
            aria-label="{algo.name} {algo.bits}-bit hash algorithm"
            data-algo={algo.value}
            type="button"
          >
            <span class="algo-name">{algo.name}</span>
            <span class="algo-bits">{algo.bits}-bit</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- columns={1} because the digest is a single long line: side by side it
         would wrap mid-hash, and the input and its result read top-to-bottom
         here rather than as two halves of a pipe. -->
    <PanelGroup columns={1}>
      <Panel label="Input Text" meta="{input.length} chars" data-testid="input-panel">
        <textarea
          bind:value={input}
          on:input={debouncedHash}
          use:fileDrop={{ onText: (text) => { input = text; hash() } }}
          placeholder="Enter text to hash..."
          class="input-area"
          spellcheck="false"
          maxlength={MAX_INPUT_LENGTH}
          aria-label="Input text to hash"
          data-testid="hash-input"
        ></textarea>
      </Panel>

      <Panel
        label="{algorithm} Hash"
        meta={copyNotice || (output ? `${output.length} chars` : '')}
        data-testid="output-panel"
        aria-live="polite"
        aria-atomic="true"
      >

      {#if error}
        <div class="error-state" role="alert" aria-live="assertive" data-testid="error-state">
          <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
        </div>
      {:else if output}
        <div class="hash-output" data-testid="hash-output">
          <code>{output}</code>
        </div>
      {:else}
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <line x1="4" y1="9" x2="20" y2="9"></line>
            <line x1="4" y1="15" x2="20" y2="15"></line>
            <line x1="10" y1="3" x2="8" y2="21"></line>
            <line x1="16" y1="3" x2="14" y2="21"></line>
          </svg>
          <span>Enter text to generate hash</span>
        </div>
      {/if}
      </Panel>
    </PanelGroup>

    <FactStrip
      facts={[
        { label: 'Algorithm', value: algorithm, presentation: 'accent' },
        ...(output
          ? [
              { label: 'Length', value: `${output.length} characters` },
              { label: 'Digest', value: `${getCurrentAlgorithmBits()}-bit` }
            ]
          : [])
      ]}
    />

    <svelte:fragment slot="rail">
      <Button on:click={loadExample} aria-label="Load example text" title="Load Example">example</Button>
      <Button on:click={clear} aria-label="Clear all fields" title="Clear">clear</Button>
    </svelte:fragment>

    <svelte:fragment slot="rail-end">
      <PasteButton on:text={(e) => { input = e.detail.text; hash() }} />
      <CopyButton text={output} disabled={!output} />
      <ShareButton getState={() => ({ input, algorithm })} />
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
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
  }

  .control-label {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    font-weight: var(--font-medium);
  }

  .algorithm-selector {
    display: flex;
    gap: var(--space-2);
    background: var(--bg-elevated);
    padding: var(--space-1);
    border-radius: var(--radius);
    border: 1px solid var(--border-subtle);
  }

  .algo-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-secondary);
    transition: all var(--transition) var(--ease-out);
    min-width: 90px;
  }

  .algo-btn:hover {
    color: var(--text-primary);
    background: var(--bg-hover);
  }

  .algo-btn.active {
    background: var(--accent);
    color: white;
    box-shadow: var(--shadow-accent-sm);
  }

  .algo-name {
    font-size: var(--text-sm);
    font-weight: var(--font-semibold);
  }

  .algo-bits {
    font-size: var(--text-xs);
    opacity: 0.7;
  }








  .input-area {
    min-height: 160px;
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


  .hash-output {
    padding: var(--space-4);
    overflow-x: auto;
  }

  .hash-output code {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--text-primary);
    word-break: break-all;
    letter-spacing: 0.02em;
    line-height: 1.8;
  }

  .error-state {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--error-subtle);
    border-top: 1px solid var(--error-muted);
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
    color: var(--text-tertiary);
    font-size: var(--text-sm);
  }

  .empty-icon {
    width: 32px;
    height: 32px;
    opacity: 0.5;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 768px) {
    .algorithm-selector {
      flex-wrap: wrap;
      justify-content: center;
    }

    .algo-btn {
      min-width: 80px;
      padding: var(--space-2) var(--space-3);
    }
  }
</style>
