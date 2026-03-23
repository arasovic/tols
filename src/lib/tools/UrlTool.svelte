<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount } from 'svelte'

  const EXAMPLE_URL = 'https://example.com/path?name=John&age=30'

  let input = ''
  let output = ''
  let mode = 'encode'
  let error = ''
  let timeout
  let saveTimeout

  function loadState() {
    try {
      const savedInput = localStorage.getItem('devutils-url-input')
      const savedMode = localStorage.getItem('devutils-url-mode')
      if (savedInput) {
        input = savedInput
      } else {
        input = EXAMPLE_URL
        process()
      }
      if (savedMode) mode = savedMode
    } catch (e) {
      input = EXAMPLE_URL
      console.warn('Failed to load from localStorage:', e)
    }
  }

  function saveState() {
    try {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        localStorage.setItem('devutils-url-input', input)
        localStorage.setItem('devutils-url-mode', mode)
      }, 500)
    } catch (e) {
      console.warn('Failed to save to localStorage:', e)
    }
  }

  onMount(() => {
    loadState()
    if (input) process()
  })

  function process() {
    error = ''
    output = ''

    if (!input.trim()) {
      return
    }

    try {
      if (mode === 'encode') {
        output = encodeURIComponent(input)
      } else {
        output = decodeURIComponent(input)
      }
    } catch (e) {
      error = 'Invalid input for URL ' + mode
    }
  }

  function debouncedProcess() {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      process()
      saveState()
    }, 150)
  }

  function clear() {
    input = ''
    output = ''
    error = ''
    try {
      localStorage.removeItem('devutils-url-input')
      localStorage.removeItem('devutils-url-mode')
    } catch (e) {
      console.warn('Failed to clear localStorage:', e)
    }
  }

  function loadExample() {
    input = EXAMPLE_URL
    process()
    saveState()
  }

  function setMode(newMode) {
    mode = newMode
    process()
    saveState()
  }

  function extractFromURL() {
    try {
      const url = new URL(input)
      const path = url.pathname + url.search + url.hash
      output = encodeURIComponent(path)
      mode = 'encode'
      error = ''
    } catch (e) {
      error = 'Invalid URL format'
    }
  }

  function extractPath() {
    try {
      const url = new URL(input)
      output = url.pathname
      mode = 'encode'
      error = ''
    } catch (e) {
      error = 'Invalid URL format'
    }
  }

  function extractParams() {
    try {
      const url = new URL(input)
      const params = new URLSearchParams(url.search)
      output = encodeURIComponent(params.toString())
      mode = 'encode'
      error = ''
    } catch (e) {
      error = 'Invalid URL format'
    }
  }
</script>

<div class="tool">
  <div class="tool-bar">
    <div class="tool-title">
      <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
      </svg>
      <h1 class="tool-title-text">URL Encoder/Decoder</h1>
    </div>
    
    <div class="tool-actions">
      <div class="mode-toggle">
        <button 
          class="mode-btn" 
          class:active={mode === 'encode'}
          on:click={() => setMode('encode')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <line x1="17" y1="10" x2="3" y2="10"></line>
            <line x1="21" y1="6" x2="3" y2="6"></line>
            <line x1="21" y1="14" x2="3" y2="14"></line>
            <line x1="17" y1="18" x2="3" y2="18"></line>
          </svg>
          Encode
        </button>
        <button 
          class="mode-btn" 
          class:active={mode === 'decode'}
          on:click={() => setMode('decode')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Decode
        </button>
      </div>

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

  <div class="panels">
    <div class="panel input-panel">
      <div class="panel-header">
        <span class="panel-title">
          {#if mode === 'encode'}
            Text Input
          {:else}
            Encoded Input
          {/if}
        </span>
        <div class="header-actions">
          {#if mode === 'encode'}
            <button class="extract-btn" on:click={extractFromURL} title="Extract from URL">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              Extract
            </button>
            <button class="extract-btn" on:click={extractPath} title="Extract path">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              Path
            </button>
            <button class="extract-btn" on:click={extractParams} title="Extract parameters">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              Params
            </button>
          {/if}
          <span class="panel-badge">{input.length} chars</span>
        </div>
      </div>
      <textarea
        bind:value={input}
        on:input={debouncedProcess}
        placeholder={mode === 'encode' ? 'Enter text or URL to encode...' : 'Enter URL-encoded string to decode...'}
        class="input-area"
        spellcheck="false"
      ></textarea>
    </div>

    <div class="panel output-panel">
      <div class="panel-header">
        <span class="panel-title">
          {#if mode === 'encode'}
            Encoded Output
          {:else}
            Decoded Output
          {/if}
        </span>
        {#if output}
          <span class="panel-badge">{output.length} chars</span>
        {/if}
        {#if output}
          <CopyButton text={output} />
        {/if}
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
        <div class="output-content mono">{output}</div>
      {:else}
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
          <span>{mode === 'encode' ? 'Enter text to encode' : 'Enter encoded string to decode'}</span>
        </div>
      {/if}
    </div>
  </div>

  <div class="info-bar">
    <div class="info-item">
      <span class="info-label">Mode:</span>
      <span class="badge" class:badge-accent={mode === 'encode'} class:badge-info={mode === 'decode'}>
        {mode === 'encode' ? 'Encoding' : 'Decoding'}
      </span>
    </div>
    {#if output}
      <div class="info-item">
        <span class="info-label">Output length:</span>
        <span class="info-value">{output.length} characters</span>
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
    gap: var(--space-3);
  }

  .mode-toggle {
    display: flex;
    background: var(--bg-elevated);
    border-radius: var(--radius);
    padding: 3px;
    border: 1px solid var(--border-subtle);
  }

  .mode-btn {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
    background: transparent;
    transition: all var(--transition);
  }

  .mode-btn:hover {
    color: var(--text-primary);
  }

  .mode-btn.active {
    background: var(--accent);
    color: white;
    box-shadow: var(--shadow-accent-sm);
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

  .panels {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
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

  .extract-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    background: transparent;
    transition: all var(--transition);
  }

  .extract-btn:hover {
    background: var(--bg-hover);
    color: var(--accent);
  }

  .panel-badge {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    padding: 2px 6px;
    background: var(--bg-surface);
    border-radius: var(--radius-sm);
  }

  .input-area {
    flex: 1;
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

  .output-content {
    flex: 1;
    min-height: 280px;
    padding: var(--space-3);
    background: var(--bg-base);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow: auto;
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
    flex: 1;
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

  .badge-info {
    background: var(--info-muted);
    color: var(--info);
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 768px) {
    .panels {
      grid-template-columns: 1fr;
    }

    .tool-bar {
      flex-direction: column;
      gap: var(--space-3);
      align-items: flex-start;
    }

    .tool-actions {
      width: 100%;
      justify-content: space-between;
    }

    .info-bar {
      flex-wrap: wrap;
    }

    .header-actions {
      flex-wrap: wrap;
    }
  }
</style>