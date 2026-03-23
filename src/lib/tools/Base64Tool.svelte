<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount } from 'svelte'

  const EXAMPLE_TEXT = 'Hello, World!'

  let input = ''
  let output = ''
  let mode = 'encode'
  let error = ''
  let timeout
  let saveTimeout

  function loadState() {
    try {
      const savedInput = localStorage.getItem('devutils-base64-input')
      const savedMode = localStorage.getItem('devutils-base64-mode')
      if (savedInput) {
        input = savedInput
      } else {
        input = EXAMPLE_TEXT
        mode = 'encode'
        process()
      }
      if (savedMode) mode = savedMode
    } catch (e) {
      input = EXAMPLE_TEXT
      console.warn('Failed to load from localStorage:', e)
    }
  }

  function saveState() {
    try {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        localStorage.setItem('devutils-base64-input', input)
        localStorage.setItem('devutils-base64-mode', mode)
      }, 500)
    } catch (e) {
      console.warn('Failed to save to localStorage:', e)
    }
  }

  onMount(() => {
    loadState()
    if (input) process()
  })

  function utf8ToBase64(str) {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(str)
    const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
    return btoa(binString)
  }

  function base64ToUtf8(str) {
    const binString = atob(str)
    const bytes = new Uint8Array(binString.length)
    for (let i = 0; i < binString.length; i++) {
      bytes[i] = binString.charCodeAt(i)
    }
    const decoder = new TextDecoder('utf-8')
    return decoder.decode(bytes)
  }

  function process() {
    error = ''
    output = ''

    if (!input.trim()) {
      return
    }

    try {
      if (mode === 'encode') {
        output = utf8ToBase64(input)
      } else {
        output = base64ToUtf8(input)
      }
    } catch (e) {
      error = 'Invalid input for Base64 ' + mode
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
      localStorage.removeItem('devutils-base64-input')
      localStorage.removeItem('devutils-base64-mode')
    } catch (e) {
      console.warn('Failed to clear localStorage:', e)
    }
  }

  function loadExample() {
    input = EXAMPLE_TEXT
    mode = 'encode'
    process()
    saveState()
  }

  function setMode(newMode) {
    mode = newMode
    process()
    saveState()
  }
</script>

<div class="tool">
  <div class="tool-header">
    <div class="tool-meta">
      <h1 class="tool-name">Base64 Encoder</h1>
      <p class="tool-desc">Encode and decode Base64 strings</p>
    </div>
    <div class="tool-actions">
      <div class="segmented">
        <button
          class="segment"
          class:active={mode === 'encode'}
          on:click={() => setMode('encode')}
        >
          Encode
        </button>
        <button
          class="segment"
          class:active={mode === 'decode'}
          on:click={() => setMode('decode')}
        >
          Decode
        </button>
      </div>
      <button class="icon-btn" on:click={loadExample} title="Load Example">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 6v6l4 2"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
      </button>
      <button class="icon-btn" on:click={clear} title="Clear">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    </div>
  </div>

  <div class="workspace">
    <div class="editor">
      <div class="editor-header">
        <span class="editor-label">
          {mode === 'encode' ? 'Text Input' : 'Base64 Input'}
        </span>
        <span class="char-count">{input.length} chars</span>
      </div>
      <textarea
        bind:value={input}
        on:input={debouncedProcess}
        placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Enter Base64 to decode...'}
        class="editor-textarea"
        spellcheck="false"
      ></textarea>
    </div>

    <div class="editor">
      <div class="editor-header">
        <span class="editor-label">
          {mode === 'encode' ? 'Base64 Output' : 'Text Output'}
        </span>
        <div class="editor-meta">
          {#if output}
            <span class="char-count">{output.length} chars</span>
            <CopyButton text={output} />
          {/if}
        </div>
      </div>
      {#if error}
        <div class="error-display">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{error}</span>
        </div>
      {:else if output}
        <div class="output-display mono">{output}</div>
      {:else}
        <div class="empty-state">
          <span>Output will appear here...</span>
        </div>
      {/if}
    </div>
  </div>

  {#if output}
    <div class="info-bar">
      <div class="info-item">
        <span class="info-label">Mode</span>
        <span class="badge" class:accent={mode === 'encode'} class:info={mode === 'decode'}>
          {mode === 'encode' ? 'Encoding' : 'Decoding'}
        </span>
      </div>
      <div class="info-item">
        <span class="info-label">Input</span>
        <span class="info-value">{input.length} chars</span>
      </div>
      <div class="info-item">
        <span class="info-label">Output</span>
        <span class="info-value">{output.length} chars</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .tool {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    width: 100%;
    animation: fadeIn var(--transition) var(--ease-out);
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
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

  .segmented {
    display: flex;
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius);
    padding: 2px;
  }

  .segment {
    display: flex;
    align-items: center;
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .segment:hover {
    color: var(--text-primary);
  }

  .segment.active {
    background: var(--bg-surface);
    color: var(--text-primary);
    border: 1px solid var(--border-default);
    box-shadow: var(--shadow-xs);
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

  .workspace {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }

  .editor {
    display: flex;
    flex-direction: column;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    overflow: hidden;
    min-height: 320px;
  }

  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3);
    background: var(--bg-elevated);
    border-bottom: 1px solid var(--border-subtle);
  }

  .editor-label {
    font-size: var(--text-xs);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
    color: var(--text-tertiary);
  }

  .editor-meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .char-count {
    font-size: var(--text-xs);
    color: var(--text-muted);
    font-family: var(--font-mono);
  }

  .editor-textarea {
    flex: 1;
    padding: var(--space-3);
    border: none;
    background: var(--bg-surface);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: var(--leading-snug);
    resize: none;
    outline: none;
  }

  .editor-textarea::placeholder {
    color: var(--text-muted);
  }

  .output-display {
    flex: 1;
    padding: var(--space-3);
    background: var(--bg-surface);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: var(--leading-snug);
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow: auto;
  }

  .mono {
    font-family: var(--font-mono);
  }

  .empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
    color: var(--text-muted);
    font-size: var(--text-sm);
  }

  .error-display {
    flex: 1;
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    padding: var(--space-3);
    background: var(--error-soft);
    color: var(--error-text);
    font-size: var(--text-sm);
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
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
    color: var(--text-tertiary);
  }

  .info-value {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-primary);
    font-family: var(--font-mono);
  }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 1px 6px;
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    border-radius: var(--radius-sm);
    background: var(--bg-elevated);
    color: var(--text-secondary);
    border: 1px solid var(--border-subtle);
  }

  .badge.accent {
    background: var(--accent-soft);
    color: var(--accent);
    border-color: var(--accent-dim);
  }

  .badge.info {
    background: var(--info-soft);
    color: var(--info);
    border-color: rgba(59, 130, 246, 0.2);
  }

  @media (max-width: 768px) {
    .workspace {
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

    .info-bar {
      flex-wrap: wrap;
      gap: var(--space-3);
    }
  }
</style>
