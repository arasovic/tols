<script>
  import { onMount, onDestroy } from 'svelte'
  import CopyButton from '$lib/components/CopyButton.svelte'
  import ToolHeader from '$lib/ui/ToolHeader.svelte'
  import ToolShell from '$lib/ui/ToolShell.svelte'
  import PanelGroup from '$lib/ui/PanelGroup.svelte'
  import Panel from '$lib/ui/Panel.svelte'
  import Button from '$lib/ui/Button.svelte'

  const DEBOUNCE_WAIT = 150
  const SAVE_DELAY = 500
  const MAX_INPUT_LENGTH = 1048576 // 1MB

  let input = ''
  /** @type {Uint8Array | null} */
  let compressedBytes = null
  let error = ''
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let processTimeout
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let saveTimeout
  let isProcessing = false
  let prefersReducedMotion = false

  $: originalSize = new Blob([input]).size
  $: compressedSize = compressedBytes ? compressedBytes.length : 0
  $: compressionRatio = originalSize > 0 ? ((originalSize - compressedSize) / originalSize * 100).toFixed(1) : 0
  $: savingsPercent = originalSize > 0 ? Math.max(0, Number(compressionRatio)) : 0
  // Hex of the compressed bytes, the same representation the tool's copy
  // button offers; feeds ⌘⇧O (the CLI's own `comp` prints base64).
  $: cliOutput = compressedBytes ? Array.from(compressedBytes).map(b => b.toString(16).padStart(2, '0')).join('') : ''

  function loadState() {
    try {
      const savedInput = localStorage.getItem('devutils-gzip-input')
      if (savedInput) {
        input = savedInput.slice(0, MAX_INPUT_LENGTH)
      }
    } catch (/** @type {any} */ e) {
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
        } catch (/** @type {any} */ e) {
          console.warn('Failed to save to localStorage:', e)
        }
      }, SAVE_DELAY)
    } catch (/** @type {any} */ e) {
      console.warn('Failed to schedule save to localStorage:', e)
    }
  }

  /**
   * @param {string} text
   * @returns {Promise<Uint8Array>}
   */
  async function compressData(text) {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const stream = new CompressionStream('gzip')
    const writer = stream.writable.getWriter()
    writer.write(data)
    writer.close()

    const reader = stream.readable.getReader()
    /** @type {Uint8Array[]} */
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
    } catch (/** @type {any} */ e) {
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

  /**
   * @param {number} bytes
   */
  function formatBytes(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * @param {Event & { currentTarget: HTMLTextAreaElement }} event
   */
  function handleInput(event) {
    const value = event.currentTarget.value
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

    /** @param {MediaQueryListEvent} e */
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
  <ToolHeader toolId="gzip" />

  <ToolShell
    toolId="gzip"
    action="comp"
    {input}
    output={cliOutput}
    onRun={process}
    let:copyNotice
  >
    <PanelGroup columns={2}>
      <Panel label="Input Text" meta={formatBytes(originalSize)}>
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
      </Panel>

      <Panel label="Compression Results" meta={copyNotice || (compressedBytes ? formatBytes(compressedSize) : '')}>
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
      </Panel>
    </PanelGroup>

    <svelte:fragment slot="rail">
      <Button on:click={clearInput} title="Clear" aria-label="Clear input">clear</Button>
    </svelte:fragment>

    <svelte:fragment slot="rail-end">
      {#if compressedBytes && !isProcessing && !error}
        <CopyButton text={cliOutput} />
        <CopyButton text={input} />
      {/if}
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
    transition: border-color var(--transition-fast) var(--ease-out);
  }

  .input-area:focus {
    outline: none;
    border-color: var(--border-focus);
  }

  .input-stats {
    display: flex;
    gap: var(--space-2);
    margin-top: var(--space-2);
    font-size: var(--text-xs);
    color: var(--text-tertiary);
  }

  .limit-warning {
    color: var(--text-error);
  }

  .results-card {
    padding: var(--space-4);
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
</style>
