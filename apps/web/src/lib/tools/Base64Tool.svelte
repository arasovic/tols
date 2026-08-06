<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import ShareButton from '$lib/components/ShareButton.svelte'
  import PasteButton from '$lib/components/PasteButton.svelte'
  import Workbench from '$lib/ui/Workbench.svelte'
  import ToolHeader from '$lib/ui/ToolHeader.svelte'
  import FactStrip from '$lib/ui/FactStrip.svelte'
  import Button from '$lib/ui/Button.svelte'
  import { readShareFragment } from '$lib/utils/share.js'
  import { fileDrop } from '$lib/utils/fileDrop.js'
  import { onMount } from 'svelte'
  import { encode as utf8ToBase64, decode as base64ToUtf8 } from 'tols/core/base64'

  const EXAMPLE_TEXT = 'Hello, World!'
  const DEBOUNCE_WAIT = 150
  const SAVE_DELAY = 500
  const MAX_INPUT_LENGTH = 1048576 // 1MB

  let input = ''
  let output = ''
  let mode = 'encode'
  let error = ''
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let processTimeout
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let saveTimeout
  let isInputTooLong = false

  const VALID_MODES = ['encode', 'decode']

  // Declared once so the visible command and the ⌘⇧C payload cannot drift:
  // writing `mode === 'encode' ? 'enc' : 'dec'` a second time is how a renamed
  // action ends up displayed in one place and copied in another.
  $: cliAction = mode === 'encode' ? 'enc' : 'dec'

  /**
   * @param {string} m
   */
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
    } catch (/** @type {any} */ e) {
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
        } catch (/** @type {any} */ e) {
          console.warn('Failed to save to localStorage:', e)
        }
      }, SAVE_DELAY)
    } catch (/** @type {any} */ e) {
      console.warn('Failed to schedule save to localStorage:', e)
    }
  }

  onMount(() => {
    // A shared link takes precedence over locally saved state
    const shared = readShareFragment()
    if (shared && typeof shared.input === 'string') {
      input = shared.input
      if (shared.mode === 'encode' || shared.mode === 'decode') mode = shared.mode
      process()
    } else {
      loadState()
    }

    return () => {
      if (processTimeout) clearTimeout(processTimeout)
      if (saveTimeout) clearTimeout(saveTimeout)
    }
  })

  /**
   * @param {Error} err
   * @param {string} currentMode
   */
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
    } catch (/** @type {any} */ e) {
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
    } catch (/** @type {any} */ e) {
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

  /**
   * @param {string} newMode
   */
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

<div class="tool">
  <ToolHeader toolId="base64" />

  <Workbench
    toolId="base64"
    action={cliAction}
    {input}
    {output}
    onRun={process}
  >
    <textarea
      slot="input"
      bind:value={input}
      on:input={debouncedProcess}
      use:fileDrop={{ onText: (text) => { input = text; process() } }}
      placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Enter Base64 to decode...'}
      class="editor-textarea"
      spellcheck="false"
      aria-label={mode === 'encode' ? 'Text input to encode' : 'Base64 input to decode'}
    ></textarea>

    <svelte:fragment slot="output">
      {#if error}
        <div class="error-display" role="alert" aria-live="polite">
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
    </svelte:fragment>

    <svelte:fragment slot="rail">
      <!--
        The segments carry NO aria-label. Their visible text already is the
        accessible name, and an aria-label that does not contain the visible
        text breaks WCAG 2.5.3 (label in name) for speech-input users.
      -->
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
      <Button class="icon-btn" aria-label="Load example text" title="Load Example" on:click={loadExample}>example</Button>
      <Button class="icon-btn" aria-label="Clear all fields" title="Clear" on:click={clear}>clear</Button>
    </svelte:fragment>

    <svelte:fragment slot="rail-end">
      <PasteButton on:text={(e) => { input = e.detail.text; process() }} />
      {#if output}<CopyButton text={output} />{/if}
      <ShareButton getState={() => ({ input, mode })} />
    </svelte:fragment>
  </Workbench>

  <!--
    The strip is always shown: `mode` is always one of the two valid modes, so
    the visibility class the old strip toggled was never false after hydration.
  -->
  <FactStrip
    facts={[
      {
        label: 'Mode',
        value: mode === 'encode' ? 'Encoding' : 'Decoding',
        presentation: mode === 'encode' ? 'accent' : 'info'
      },
      { label: 'Input', value: `${input.length.toLocaleString()} chars`, presentation: 'mono' },
      { label: 'Output', value: `${output.length.toLocaleString()} chars`, presentation: 'mono' }
    ]}
  />
</div>

<style>
  /*
    Everything the two-column grid, the pane boxes, the pane headers and the
    icon buttons used to own now belongs to Workbench / Panel / ActionRail /
    Button. What is genuinely specific to the Base64 tool: the pane contents
    and the encode/decode mode switch.
  */
  .tool {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    width: 100%;
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
    transition: all var(--transition-fast) var(--ease-out);
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

  .editor-textarea {
    width: 100%;
    height: 100%;
    min-height: var(--pane-min-height);
    padding: var(--space-3);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: var(--leading-snug);
    background: transparent;
    border: none;
    resize: none;
    tab-size: 2;
  }

  .editor-textarea::placeholder {
    color: var(--text-muted);
  }

  .editor-textarea:focus-visible {
    box-shadow: inset 0 0 0 2px var(--accent);
  }

  .output-display {
    height: 100%;
    min-height: var(--pane-min-height);
    padding: var(--space-3);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: var(--leading-snug);
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow: auto;
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: var(--pane-min-height);
    padding: var(--space-4);
    color: var(--text-muted);
    font-size: var(--text-sm);
  }

  .error-display {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    min-height: var(--pane-min-height);
    padding: var(--space-3);
    background: var(--error-soft);
    color: var(--error-text);
    font-size: var(--text-sm);
  }

  
</style>
