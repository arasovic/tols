<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { hashMessage, hashMD5 } from '$lib/utils/crypto.js'
  import { onMount } from 'svelte'

  const EXAMPLE_HASH_TEXT = 'Hello World'

  let input = ''
  let algorithm = 'SHA-256'
  let output = ''
  let error = ''
  let timeout
  let saveTimeout

  const algorithms = [
    { value: 'SHA-256', name: 'SHA-256', bits: 256 },
    { value: 'SHA-512', name: 'SHA-512', bits: 512 },
    { value: 'SHA-1', name: 'SHA-1', bits: 160 },
    { value: 'MD5', name: 'MD5', bits: 128 }
  ]

  function loadState() {
    try {
      const savedInput = localStorage.getItem('devutils-hash-input')
      const savedAlgorithm = localStorage.getItem('devutils-hash-algorithm')
      if (savedInput) {
        input = savedInput
      } else {
        input = EXAMPLE_HASH_TEXT
        hash()
      }
      if (savedAlgorithm && algorithms.find(a => a.value === savedAlgorithm)) {
        algorithm = savedAlgorithm
      }
    } catch (e) {
      input = EXAMPLE_HASH_TEXT
      console.warn('Failed to load from localStorage:', e)
    }
  }

  function saveState() {
    try {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        localStorage.setItem('devutils-hash-input', input)
        localStorage.setItem('devutils-hash-algorithm', algorithm)
      }, 500)
    } catch (e) {
      console.warn('Failed to save to localStorage:', e)
    }
  }

  onMount(() => {
    loadState()
    if (input) hash()
  })

  async function hash() {
    error = ''
    output = ''

    if (!input.trim()) {
      return
    }

    try {
      if (algorithm === 'MD5') {
        output = await hashMD5(input)
      } else {
        output = await hashMessage(input, algorithm)
      }
    } catch (e) {
      error = 'Hash calculation failed: ' + e.message
    }
  }

  function debouncedHash() {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      hash()
      saveState()
    }, 150)
  }

  function clear() {
    input = ''
    output = ''
    error = ''
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
      <button class="btn-ghost" on:click={loadExample} title="Load Example">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M12 6v6l4 2"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
      </button>
      <button class="btn-ghost" on:click={clear} title="Clear">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  </div>

  <div class="controls-card">
    <span class="control-label">Select Algorithm</span>
    <div class="algorithm-selector">
      {#each algorithms as algo}
        <button 
          class="algo-btn" 
          class:active={algorithm === algo.value}
          on:click={() => selectAlgorithm(algo.value)}
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
      <span class="panel-badge">{input.length} chars</span>
    </div>
    <textarea
      bind:value={input}
      on:input={debouncedHash}
      placeholder="Enter text to hash..."
      class="input-area"
      spellcheck="false"
    ></textarea>
  </div>

  <div class="panel output-panel">
    <div class="panel-header">
      <span class="panel-title">
        <span class="hash-type">{algorithm}</span>
        <span class="hash-type-label">Hash</span>
      </span>
      <div class="header-actions">
        {#if output}
          <span class="panel-badge">{output.length} chars</span>
        {/if}
        {#if output}
          <CopyButton text={output} />
        {/if}
      </div>
    </div>
    
    {#if error}
      <div class="error-state">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{error}</span>
      </div>
    {:else if output}
      <div class="hash-output">
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
        <span class="info-value">{algorithms.find(a => a.value === algorithm)?.bits}-bit</span>
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