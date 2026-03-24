<script>
  import { onMount, onDestroy } from 'svelte'
  import CopyButton from '$lib/components/CopyButton.svelte'

  const DEBOUNCE_WAIT = 150
  const SAVE_DELAY = 500
  const MAX_INPUT_LENGTH = 1048576 // 1MB

  let input = ''
  let compressedBytes = null
  let error = ''
  let processTimeout
  let saveTimeout
  let isProcessing = false
  let prefersReducedMotion = false

  $: originalSize = new Blob([input]).size
  $: compressedSize = compressedBytes ? compressedBytes.length : 0
  $: compressionRatio = originalSize > 0 ? ((originalSize - compressedSize) / originalSize * 100).toFixed(1) : 0
  $: savingsPercent = originalSize > 0 ? Math.max(0, compressionRatio) : 0

  function loadState() {
    try {
      const savedInput = localStorage.getItem('devutils-gzip-input')
      if (savedInput) {
        input = savedInput.slice(0, MAX_INPUT_LENGTH)
      }
    } catch (e) {
      console.warn('Failed to load from localStorage:', e)
    }
  }

  function saveState() {
    try {
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }
      saveTimeout = setTimeout(() => {
        try {
          localStorage.setItem('devutils-gzip-input', input)
        } catch (e) {
          console.warn('Failed to save to localStorage:', e)
        }
      }, SAVE_DELAY)
    } catch (e) {
      console.warn('Failed to schedule save to localStorage:', e)
    }
  }

  async function compressData(text) {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const stream = new CompressionStream('gzip')
    const writer = stream.writable.getWriter()
    writer.write(data)
    writer.close()

    const reader = stream.readable.getReader()
    const chunks = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }

    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }
    return result
  }

  async function process() {
    if (!input) {
      compressedBytes = null
      error = ''
      return
    }

    isProcessing = true
    error = ''

    try {
      compressedBytes = await compressData(input)
    } catch (e) {
      error = 'Compression failed: ' + e.message
      compressedBytes = null
    } finally {
      isProcessing = false
    }
  }

  function debouncedProcess() {
    if (processTimeout) {
      clearTimeout(processTimeout)
    }
    processTimeout = setTimeout(() => {
      process()
      saveState()
    }, DEBOUNCE_WAIT)
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  function handleInput(event) {
    const value = event.target.value
    if (value.length > MAX_INPUT_LENGTH) {
      input = value.slice(0, MAX_INPUT_LENGTH)
      error = 'Input truncated to 1MB limit'
    } else {
      input = value
      error = ''
    }
    debouncedProcess()
  }

  function clearInput() {
    input = ''
    compressedBytes = null
    error = ''
    saveState()
  }

  onMount(() => {
    loadState()
    process()

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion = mediaQuery.matches

    const handleChange = (e) => {
      prefersReducedMotion = e.matches
    }
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  })

  onDestroy(() => {
    if (processTimeout) clearTimeout(processTimeout)
    if (saveTimeout) clearTimeout(saveTimeout)
  })
</script>

<div class="tool">
  <div class="tool-header">
    <div class="tool-meta">
      <h1 class="tool-name">Gzip Compression Calculator</h1>
      <p class="tool-desc">Calculate gzip compression size and analyze bandwidth savings</p>
    </div>
    <div class="tool-actions">
      <button
        class="icon-btn"
        on:click={clearInput}
        title="Clear"
        aria-label="Clear input"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    </div>
  </div>

  <div class="content-grid">
    <div class="input-section">
      <label class="section-label" for="gzip-input">Input Text</label>
      <textarea
        id="gzip-input"
        class="input-area"
        bind:value={input}
        on:input={handleInput}
        placeholder="Enter text to compress..."
        rows="10"
        aria-describedby="input-stats"
      ></textarea>
      <div class="input-stats" id="input-stats">
        <span>Original size: {formatBytes(originalSize)}</span>
        {#if input.length >= MAX_INPUT_LENGTH}
          <span class="limit-warning">(max 1MB)</span>
        {/if}
      </div>
    </div>

    <div class="output-section">
      <label class="section-label">Compression Results</label>
      <div class="results-card">
        {#if isProcessing}
          <div class="loading" aria-live="polite">Compressing...</div>
        {:else if error}
          <div class="error-message" role="alert">{error}</div>
        {:else if compressedBytes}
          <div class="stat-row">
            <span class="stat-label">Compressed size:</span>
            <span class="stat-value compressed">{formatBytes(compressedSize)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Savings:</span>
            <span class="stat-value savings">{formatBytes(originalSize - compressedSize)} ({savingsPercent}%)</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Ratio:</span>
            <span class="stat-value">{(compressedSize / originalSize * 100).toFixed(1)}% of original</span>
          </div>
        {:else}
          <div class="empty-state">Enter text to see compression stats</div>
        {/if}
      </div>

      {#if compressedBytes && !isProcessing && !error}
        <div class="output-actions">
          <CopyButton text={Array.from(compressedBytes).map(b => b.toString(16).padStart(2, '0')).join('')} />
          <CopyButton text={input} />
        </div>
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

  .content-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-5);
  }

  .input-section,
  .output-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .section-label {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
  }

  .input-area {
    width: 100%;
    min-height: 200px;
    padding: var(--space-3);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--text-primary);
    resize: vertical;
    transition: border-color var(--transition-fast);
  }

  .input-area:focus {
    outline: none;
    border-color: var(--border-focus);
  }

  .input-stats {
    display: flex;
    gap: var(--space-2);
    font-size: var(--text-xs);
    color: var(--text-tertiary);
  }

  .limit-warning {
    color: var(--text-error);
  }

  .results-card {
    padding: var(--space-4);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius);
    min-height: 200px;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-3) 0;
    border-bottom: 1px solid var(--border-subtle);
  }

  .stat-row:last-child {
    border-bottom: none;
  }

  .stat-label {
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  .stat-value {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-primary);
  }

  .stat-value.compressed {
    color: var(--text-success);
  }

  .stat-value.savings {
    color: var(--text-accent);
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 150px;
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  .error-message {
    padding: var(--space-3);
    background: var(--bg-error);
    border: 1px solid var(--border-error);
    border-radius: var(--radius);
    font-size: var(--text-sm);
    color: var(--text-error);
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 150px;
    font-size: var(--text-sm);
    color: var(--text-tertiary);
  }

  .output-actions {
    display: flex;
    gap: var(--space-2);
  }

  @media (max-width: 768px) {
    .content-grid {
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
