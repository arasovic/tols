<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { generateUUID, generateUUIDs } from '$lib/utils/crypto.js'
  import { onMount, onDestroy } from 'svelte'

  const DEBOUNCE_TIME = 150
  const SAVE_DEBOUNCE_TIME = 500
  const MIN_COUNT = 1
  const MAX_COUNT = 100

  let count = 1
  let output = ''
  let error = ''
  let timeout
  let saveTimeout
  let localStorageError = ''

  function loadState() {
    try {
      const savedCount = localStorage.getItem('devutils-uuid-count')
      if (savedCount) {
        const parsed = parseInt(savedCount, 10)
        if (!isNaN(parsed) && parsed >= MIN_COUNT && parsed <= MAX_COUNT) {
          count = parsed
        }
      }
    } catch (e) {
      localStorageError = 'Failed to load saved settings'
      console.warn('Failed to load from localStorage:', e)
    }
  }

  function saveState() {
    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem('devutils-uuid-count', count.toString())
        localStorageError = ''
      } catch (e) {
        localStorageError = 'Failed to save settings'
        console.warn('Failed to save to localStorage:', e)
      }
    }, SAVE_DEBOUNCE_TIME)
  }

  onMount(() => {
    loadState()
    generate()
  })

  onDestroy(() => {
    clearTimeout(timeout)
    clearTimeout(saveTimeout)
  })

  function validateCount(value) {
    if (value === '' || value === null || value === undefined) return false
    const num = typeof value === 'string' ? parseInt(value, 10) : value
    if (isNaN(num)) return false
    if (!Number.isInteger(num)) return false
    return num
  }

  function sanitizeCount(value) {
    let num = validateCount(value)
    if (num === false) return MIN_COUNT
    if (num < MIN_COUNT) return MIN_COUNT
    if (num > MAX_COUNT) return MAX_COUNT
    return num
  }

  function generate() {
    error = ''
    output = ''

    const validated = validateCount(count)
    if (validated === false) {
      error = `Count must be between ${MIN_COUNT} and ${MAX_COUNT}`
      return
    }

    if (validated < MIN_COUNT || validated > MAX_COUNT) {
      error = `Count must be between ${MIN_COUNT} and ${MAX_COUNT}`
      return
    }

    count = validated

    if (count === 1) {
      output = generateUUID()
    } else {
      output = generateUUIDs(count).join('\n')
    }
    saveState()
  }

  function debouncedGenerate() {
    clearTimeout(timeout)
    timeout = setTimeout(generate, DEBOUNCE_TIME)
  }

  function handleInput(event) {
    const value = event.target.value
    const num = validateCount(value)
    if (num !== false) {
      count = num
      debouncedGenerate()
    } else {
      debouncedGenerate()
    }
  }

  function clear() {
    output = ''
    error = ''
    count = 1
    localStorageError = ''
    try {
      localStorage.removeItem('devutils-uuid-count')
    } catch (e) {
      console.warn('Failed to clear localStorage:', e)
    }
  }

  function loadExample() {
    count = 1
    generate()
    saveState()
  }

  function incrementCount() {
    if (count < MAX_COUNT) {
      count++
      generate()
    }
  }

  function decrementCount() {
    if (count > MIN_COUNT) {
      count--
      generate()
    }
  }
</script>

<div class="tool">
  <div class="tool-bar">
    <div class="tool-title">
      <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="3" y1="9" x2="21" y2="9"></line>
        <line x1="9" y1="21" x2="9" y2="9"></line>
      </svg>
      <h1 class="tool-title-text">UUID Generator</h1>
    </div>

    <div class="tool-actions">
      <button class="btn-primary" on:click={generate} aria-label="Generate UUIDs">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true">
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
        Generate
      </button>
      <button class="btn-ghost" on:click={loadExample} aria-label="Load example">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true">
          <path d="M12 6v6l4 2"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
      </button>
      <button class="btn-ghost" on:click={clear} aria-label="Clear output">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  </div>

  <div class="controls-card">
    <div class="count-control">
      <span class="control-label">Number of UUIDs</span>
      <div class="count-buttons">
        <button
          class="count-btn"
          on:click={decrementCount}
          disabled={count <= MIN_COUNT}
          aria-label="Decrease count"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <input
          type="number"
          bind:value={count}
          on:input={handleInput}
          min={MIN_COUNT}
          max={MAX_COUNT}
          class="count-input"
          aria-label="Number of UUIDs to generate"
        />
        <button
          class="count-btn"
          on:click={incrementCount}
          disabled={count >= MAX_COUNT}
          aria-label="Increase count"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-header">
      <span class="panel-title">Generated UUID{count > 1 ? 's' : ''}</span>
      <div class="header-actions">
        {#if count > 1 && output}
          <span class="panel-badge">{count} UUIDs</span>
        {:else if output}
          <span class="panel-badge">v4</span>
        {/if}
        {#if output}
          <CopyButton text={output} />
        {/if}
      </div>
    </div>

    {#if error}
      <div class="error-state" role="alert" aria-live="assertive">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{error}</span>
      </div>
    {:else if localStorageError}
      <div class="error-state localStorage-error" role="alert" aria-live="polite">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{localStorageError}</span>
      </div>
    {:else if count === 1}
      <div class="single-output">
        <code class="uuid-single">{output}</code>
      </div>
    {:else}
      <div class="uuid-list">
        {#each output.split('\n').filter(uuid => uuid) as uuid, i (uuid)}
          <div class="uuid-item">
            <span class="uuid-index">{String(i + 1).padStart(2, '0')}</span>
            <code class="uuid-text">{uuid}</code>
            <CopyButton text={uuid} />
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <div class="info-bar">
    <div class="info-item">
      <span class="info-label">Version:</span>
      <span class="badge badge-accent">UUID v4</span>
    </div>
    <div class="info-item">
      <span class="info-label">Format:</span>
      <span class="info-value">xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx</span>
    </div>
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

  .btn-primary {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: var(--accent);
    color: white;
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    border-radius: var(--radius);
    box-shadow: var(--shadow-xs), var(--shadow-accent-sm);
    transition: all var(--transition);
  }

  .btn-primary:hover {
    background: var(--accent-hover);
    box-shadow: var(--shadow-sm), var(--shadow-accent);
    transform: translateY(-1px);
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
    justify-content: center;
    padding: var(--space-4);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
  }

  .count-control {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
  }

  .control-label {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    font-weight: var(--font-medium);
  }

  .count-buttons {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    background: var(--bg-elevated);
    padding: var(--space-1);
    border-radius: var(--radius);
    border: 1px solid var(--border-subtle);
  }

  .count-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--radius-sm);
    background: var(--bg-surface);
    color: var(--text-secondary);
    border: 1px solid var(--border-subtle);
    transition: all var(--transition);
  }

  .count-btn:hover:not(:disabled) {
    background: var(--bg-hover);
    color: var(--text-primary);
    border-color: var(--border-default);
  }

  .count-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .count-input {
    width: 70px;
    padding: var(--space-2);
    text-align: center;
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    font-family: var(--font-mono);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
  }

  .count-input:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-muted);
  }

  .panel {
    display: flex;
    flex-direction: column;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    overflow: hidden;
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
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
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

  .single-output {
    padding: var(--space-6);
    display: flex;
    justify-content: center;
    background: var(--bg-base);
  }

  .uuid-single {
    font-family: var(--font-mono);
    font-size: var(--text-lg);
    color: var(--accent);
    letter-spacing: 0.05em;
    animation: fadeIn var(--transition-normal) ease;
  }

  .uuid-list {
    max-height: 400px;
    overflow-y: auto;
    background: var(--bg-base);
  }

  .uuid-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--border-subtle);
    transition: background var(--transition);
    animation: fadeInUp var(--transition-normal) ease;
    animation-fill-mode: both;
  }

  .uuid-item:last-child {
    border-bottom: none;
  }

  .uuid-item:hover {
    background: var(--bg-hover);
  }

  .uuid-index {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    font-family: var(--font-mono);
    min-width: 24px;
  }

  .uuid-text {
    flex: 1;
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--text-primary);
    letter-spacing: 0.03em;
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

  .localStorage-error {
    background: var(--warning-subtle, var(--error-subtle));
    border-top-color: var(--warning-muted, var(--error-muted));
    color: var(--warning, var(--error));
  }

  .error-icon {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    margin-top: 1px;
  }

  .info-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-4);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    flex-wrap: wrap;
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
    font-family: var(--font-mono);
    color: var(--text-primary);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
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

    .info-bar {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
