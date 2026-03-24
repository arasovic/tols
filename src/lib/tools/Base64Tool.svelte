<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount } from 'svelte'

  const EXAMPLE_TEXT = 'Hello, World!'
  const DEBOUNCE_WAIT = 150
  const SAVE_DELAY = 500
  const MAX_INPUT_LENGTH = 1048576 // 1MB

  let input = ''
  let output = ''
  let mode = 'encode'
  let error = ''
  let processTimeout
  let saveTimeout
  let isInputTooLong = false

  const VALID_MODES = ['encode', 'decode']

  function isValidMode(m) {
    return VALID_MODES.includes(m)
  }

  function loadState() {
    try {
      const savedInput = localStorage.getItem('devutils-base64-input')
      const savedMode = localStorage.getItem('devutils-base64-mode')

      if (savedMode && isValidMode(savedMode)) {
        mode = savedMode
      } else {
        mode = 'encode'
      }

      if (savedInput) {
        input = savedInput.slice(0, MAX_INPUT_LENGTH)
      } else {
        input = EXAMPLE_TEXT
        mode = 'encode'
      }
      process()
    } catch (e) {
      input = EXAMPLE_TEXT
      mode = 'encode'
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
          localStorage.setItem('devutils-base64-input', input)
          localStorage.setItem('devutils-base64-mode', mode)
        } catch (e) {
          console.warn('Failed to save to localStorage:', e)
        }
      }, SAVE_DELAY)
    } catch (e) {
      console.warn('Failed to schedule save to localStorage:', e)
    }
  }

  onMount(() => {
    loadState()

    return () => {
      if (processTimeout) clearTimeout(processTimeout)
      if (saveTimeout) clearTimeout(saveTimeout)
    }
  })

  function utf8ToBase64(str) {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(str)
    // Use Uint8Array directly for better performance
    let binary = ''
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  function base64ToUtf8(str) {
    const cleaned = str.replace(/\s/g, '')

    // Validate Base64 before decoding
    if (!isValidBase64(cleaned)) {
      throw new Error('Invalid Base64 string')
    }

    const binString = atob(cleaned)
    const bytes = new Uint8Array(binString.length)
    for (let i = 0; i < binString.length; i++) {
      bytes[i] = binString.charCodeAt(i)
    }
    const decoder = new TextDecoder('utf-8')
    return decoder.decode(bytes)
  }

  function isValidBase64(str) {
    // Check if string contains only valid Base64 characters
    if (!str || !/^[A-Za-z0-9+/]*={0,2}$/.test(str)) {
      return false
    }
    // Base64 length without padding should be valid
    // Unpadded Base64 can be any length, padded must be divisible by 4
    const withoutPadding = str.replace(/=+$/, '')
    const padding = str.length - withoutPadding.length
    // Valid lengths: unpadded (any), padded (divisible by 4)
    return padding === 0 || str.length % 4 === 0
  }

  function getErrorMessage(err, currentMode) {
    // Use instanceof DOMException for cross-browser compatibility
    if (err instanceof DOMException || /InvalidCharacterError/.test(err.message)) {
      return 'Invalid Base64: contains characters not in Base64 alphabet (A-Z, a-z, 0-9, +, /, =)'
    }
    if (currentMode === 'decode') {
      return 'Invalid Base64 string: check for proper padding (=) and valid characters'
    }
    return 'Encoding error: unable to convert text to Base64'
  }

  function process() {
    error = ''
    output = ''
    isInputTooLong = false

    // Check for empty input without trim() for consistent UX
    if (input.length === 0) {
      return
    }

    // Check for input length limit
    if (input.length > MAX_INPUT_LENGTH) {
      isInputTooLong = true
      error = `Input exceeds maximum length of ${MAX_INPUT_LENGTH.toLocaleString()} characters (${(MAX_INPUT_LENGTH / 1024 / 1024).toFixed(2)} MB)`
      return
    }

    try {
      if (mode === 'encode') {
        output = utf8ToBase64(input)
      } else {
        output = base64ToUtf8(input)
      }
    } catch (e) {
      error = getErrorMessage(e, mode)
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

  function clear() {
    input = ''
    output = ''
    error = ''
    isInputTooLong = false
    mode = 'encode'
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
    isInputTooLong = false
    process()
    saveState()
  }

  function setMode(newMode) {
    if (processTimeout) {
      clearTimeout(processTimeout)
    }
    processTimeout = setTimeout(() => {
      mode = newMode
      process()
      saveState()
    }, DEBOUNCE_WAIT)
  }
</script>

<section class="tool" role="main" aria-label="Base64 Encoder/Decoder Tool">
  <div class="tool-header">
    <div class="tool-meta">
      <h1 class="tool-name">Base64 Encoder/Decoder</h1>
      <p class="tool-desc">Encode and decode Base64 strings</p>
    </div>
    <div class="tool-actions">
      <div class="segmented">
        <button
          type="button"
          class="segment"
          class:active={mode === 'encode'}
          on:click={() => setMode('encode')}
        >
          Encode
        </button>
        <button
          type="button"
          class="segment"
          class:active={mode === 'decode'}
          on:click={() => setMode('decode')}
        >
          Decode
        </button>
      </div>
      <button
        type="button"
        class="icon-btn"
        on:click={loadExample}
        title="Load Example"
        aria-label="Load example text"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 6v6l4 2"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
      </button>
      <button
        type="button"
        class="icon-btn"
        on:click={clear}
        title="Clear"
        aria-label="Clear all fields"
      >
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
        <span class="char-count" class:error={isInputTooLong}>
          {input.length.toLocaleString()} / {MAX_INPUT_LENGTH.toLocaleString()} chars
        </span>
      </div>
      <textarea
        bind:value={input}
        on:input={debouncedProcess}
        placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Enter Base64 to decode...'}
        class="editor-textarea"
        spellcheck="false"
        aria-label={mode === 'encode' ? 'Text input to encode' : 'Base64 input to decode'}
      ></textarea>
    </div>

    <div class="editor">
      <div class="editor-header">
        <span class="editor-label">
          {mode === 'encode' ? 'Base64 Output' : 'Text Output'}
        </span>
        <div class="editor-meta">
          {#if output}
            <span class="char-count">{output.length.toLocaleString()} chars</span>
            <CopyButton text={output} />
          {/if}
        </div>
      </div>
      {#if error}
        <div class="error-display" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{error}</span>
        </div>
      {:else if output}
        <div class="output-display" aria-live="polite">{output}</div>
      {:else}
        <div class="empty-state">
          <span>Output will appear here...</span>
        </div>
      {/if}
    </div>
  </div>

  <div class="info-bar" class:visible={mode || input.length > 0 || output.length > 0}>
    <div class="info-item">
      <span class="info-label">Mode</span>
      <span class="badge" class:accent={mode === 'encode'} class:info={mode === 'decode'}>
        {mode === 'encode' ? 'Encoding' : 'Decoding'}
      </span>
    </div>
    <div class="info-item">
      <span class="info-label">Input</span>
      <span class="info-value">{input.length.toLocaleString()} chars</span>
    </div>
    <div class="info-item">
      <span class="info-label">Output</span>
      <span class="info-value">{output.length.toLocaleString()} chars</span>
    </div>
  </div>
</section>

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

  .segment:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
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

  .icon-btn:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
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

  .char-count.error {
    color: var(--error);
    font-weight: var(--font-semibold);
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

  .editor-textarea:focus-visible {
    box-shadow: inset 0 0 0 2px var(--accent);
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
    display: none;
    align-items: center;
    gap: var(--space-6);
    padding: var(--space-3) var(--space-4);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
  }

  .info-bar.visible {
    display: flex;
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
