<script context="module">
  export const EXAMPLE_HASH_TEXT = 'Hello World'
  export const DEBOUNCE_DELAY_MS = 150
  export const SAVE_DEBOUNCE_DELAY_MS = 500
  export const MAX_INPUT_LENGTH = 100000
</script>

<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { hashMessage, hashMD5 } from '$lib/utils/crypto.js'
  import { onMount, onDestroy } from 'svelte'

  let input = ''
  let algorithm = 'SHA-256'
  let output = ''
  let error = ''
  let timeout
  let saveTimeout
  let pendingHashId = 0

  const algorithms = [
    { value: 'SHA-256', name: 'SHA-256', bits: 256 },
    { value: 'SHA-512', name: 'SHA-512', bits: 512 },
    { value: 'SHA-1', name: 'SHA-1', bits: 160 },
    { value: 'MD5', name: 'MD5', bits: 128 }
  ]

  const validAlgorithmValues = algorithms.map(a => a.value)

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
    } catch (e) {
      input = EXAMPLE_HASH_TEXT
      console.warn('Failed to load from localStorage:', e)
    }
  }

  function saveState() {
    if (typeof window === 'undefined') return

    try {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        localStorage.setItem('devutils-hash-input', input)
        localStorage.setItem('devutils-hash-algorithm', algorithm)
      }, SAVE_DEBOUNCE_DELAY_MS)
    } catch (e) {
      console.warn('Failed to save to localStorage:', e)
    }
  }

  onMount(() => {
    loadState()
    if (input) hash()
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
      if (algorithm === 'MD5') {
        result = await hashMD5(input)
      } else {
        result = await hashMessage(input, algorithm)
      }

      if (currentHashId === pendingHashId) {
        output = result
      }
    } catch (e) {
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
    } catch (e) {
      console.warn('Failed to clear localStorage:', e)
    }
  }

  function loadExample() {
    input = EXAMPLE_HASH_TEXT
    hash()
    saveState()
  }

  function selectAlgorithm(algo) {
    algorithm = algo
    hash()
    saveState()
  }

  function getCurrentAlgorithmBits() {
    const algo = algorithms.find(a => a.value === algorithm)
    return algo ? algo.bits : 0
  }

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
      const prevButton = document.querySelector(`[data-algo="${prevAlgo.value}"]`)
      if (prevButton) prevButton.focus()
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      const nextIndex = algoIndex < algorithms.length - 1 ? algoIndex + 1 : 0
      const nextAlgo = algorithms[nextIndex]
      selectAlgorithm(nextAlgo.value)
      const nextButton = document.querySelector(`[data-algo="${nextAlgo.value}"]`)
      if (nextButton) nextButton.focus()
    }
  }
</script>

<div class="tool">
  <div class="tool-bar">
    <div class="tool-title">
      <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="4" y1="9" x2="20" y2="9"></line>
        <line x1="4" y1="15" x2="20" y2="15"></line>
        <line x1="10" y1="3" x2="8" y2="21"></line>
        <line x1="16" y1="3" x2="14" y2="21"></line>
      </svg>
      <h1 class="tool-title-text">Hash Generator</h1>
    </div>

    <div class="tool-actions">
      <button
        class="btn-ghost"
        on:click={loadExample}
        title="Load Example"
        aria-label="Load example text"
        type="button"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M12 6v6l4 2"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
      </button>
      <button
        class="btn-ghost"
        on:click={clear}
        title="Clear"
        aria-label="Clear all fields"
        type="button"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  </div>

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

  <div class="panel">
    <div class="panel-header">
      <span class="panel-title">Input Text</span>
      <span class="panel-badge" data-testid="input-char-count">{input.length} chars</span>
    </div>
    <textarea
      bind:value={input}
      on:input={debouncedHash}
      placeholder="Enter text to hash..."
      class="input-area"
      spellcheck="false"
      maxlength={MAX_INPUT_LENGTH}
      aria-label="Input text to hash"
      data-testid="hash-input"
    ></textarea>
  </div>

  <div class="panel output-panel" aria-live="polite" aria-atomic="true">
    <div class="panel-header">
      <span class="panel-title">
        <span class="hash-type">{algorithm}</span>
        <span class="hash-type-label">Hash</span>
      </span>
      <div class="header-actions">
        {#if output}
          <span class="panel-badge" data-testid="output-char-count">{output.length} chars</span>
        {/if}
        <CopyButton text={output} disabled={!output} />
      </div>
    </div>

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
  </div>

  <div class="info-bar">
    <div class="info-item">
      <span class="info-label">Algorithm:</span>
      <span class="badge badge-accent">{algorithm}</span>
    </div>
    {#if output}
      <div class="info-item">
        <span class="info-label">Length:</span>
        <span class="info-value">{output.length} characters</span>
      </div>
      <div class="info-item">
        <span class="info-label">Digest:</span>
        <span class="info-value">{getCurrentAlgorithmBits()}-bit</span>
      </div>
    {/if}
  </div>
</div>

<style>
  .tool {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    width: 100%;
  }

  .tool-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-3) var(--space-4);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
  }

  .tool-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
  }

  .tool-title-text {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    margin: 0;
    color: inherit;
  }

  .tool-icon {
    width: 18px;
    height: 18px;
    color: var(--accent);
  }

  .tool-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .btn-ghost {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius);
    background: transparent;
    color: var(--text-tertiary);
    transition: all var(--transition);
  }

  .btn-ghost:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
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
    transition: all var(--transition);
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

  .panel {
    display: flex;
    flex-direction: column;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    overflow: hidden;
    animation: fadeIn var(--transition-normal) ease;
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: var(--bg-elevated);
    border-bottom: 1px solid var(--border-subtle);
  }

  .panel-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
  }

  .hash-type {
    font-weight: var(--font-semibold);
    color: var(--accent);
  }

  .hash-type-label {
    color: var(--text-tertiary);
    font-weight: var(--font-normal);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-left: auto;
  }

  .panel-badge {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    padding: 2px 6px;
    background: var(--bg-surface);
    border-radius: var(--radius-sm);
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

  .output-panel {
    background: var(--bg-base);
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

  .info-bar {
    display: flex;
    align-items: center;
    gap: var(--space-6);
    padding: var(--space-3) var(--space-4);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .info-label {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
  }

  .info-value {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-primary);
  }

  .badge {
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    padding: 2px 8px;
    border-radius: var(--radius-sm);
    background: var(--bg-elevated);
    color: var(--text-secondary);
  }

  .badge-accent {
    background: var(--accent-subtle);
    color: var(--accent);
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 768px) {
    .tool-bar {
      flex-direction: column;
      gap: var(--space-3);
      align-items: flex-start;
    }

    .tool-actions {
      width: 100%;
      justify-content: flex-end;
    }

    .algorithm-selector {
      flex-wrap: wrap;
      justify-content: center;
    }

    .algo-btn {
      min-width: 80px;
      padding: var(--space-2) var(--space-3);
    }

    .info-bar {
      flex-wrap: wrap;
    }
  }
</style>
