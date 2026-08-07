<script>
  import { onMount, onDestroy, tick } from 'svelte'
  import ToolHeader from '$lib/ui/ToolHeader.svelte'
  import ToolShell from '$lib/ui/ToolShell.svelte'
  import Panel from '$lib/ui/Panel.svelte'
  import Button from '$lib/ui/Button.svelte'
  import {
    CODE128,
    determineSet,
    validateInput,
    findInvalidCharacters,
    encodeCode128,
    MAX_INPUT_LENGTH,
    MODULE_WIDTH,
    MODULE_HEIGHT,
    QUIET_ZONE,
    INVALID_CHARS_MESSAGE,
    EMPTY_INPUT_MESSAGE,
    TOO_LONG_MESSAGE
  } from 'tols-cli/core/barcode'

  let barcodeText = 'CODE128'
  let barcodeType = 'CODE128'
  /** @type {HTMLCanvasElement | undefined} */
  let canvas
  let error = ''
  /** @type {ReturnType<typeof setTimeout> | null} */
  let saveTimeout = null
  /** @type {ReturnType<typeof setTimeout> | null} */
  let debounceTimeout = null
  let isMounted = false

  const DEBOUNCE_DELAY = 150
  const SAVE_DELAY = 500
  const MAX_CANVAS_WIDTH = 10000

  function loadState() {
    try {
      const savedText = localStorage.getItem('devutils-barcode-text')
      const savedType = localStorage.getItem('devutils-barcode-type')
      if (savedText !== null) barcodeText = savedText
      if (savedType !== null) barcodeType = savedType
    } catch (/** @type {any} */ e) {
      console.error('Failed to load saved state:', e)
    }
  }

  function saveState() {
    try {
      if (saveTimeout) clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        try {
          localStorage.setItem('devutils-barcode-text', barcodeText)
          localStorage.setItem('devutils-barcode-type', barcodeType)
        } catch (storageError) {
          console.error('Failed to save state to localStorage:', storageError)
        }
      }, SAVE_DELAY)
    } catch (/** @type {any} */ e) {
      console.error('Failed to schedule state save:', e)
    }
  }

  onMount(async () => {
    loadState()
    await tick()
    if (canvas && barcodeText) {
      generateBarcode()
    }
    isMounted = true
  })

  onDestroy(() => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
      saveTimeout = null
    }
    if (debounceTimeout) {
      clearTimeout(debounceTimeout)
      debounceTimeout = null
    }
    isMounted = false
  })

  function generateBarcode() {
    const previousError = error
    error = ''

    if (!canvas) {
      error = 'Canvas not available'
      return
    }

    const validation = validateInput(barcodeText)
    if (!validation.valid) {
      error = validation.message
      const invalidChars = findInvalidCharacters(barcodeText)
      if (invalidChars.length > 0) {
        const details = invalidChars.slice(0, 3).map(c => `'${c.char}' (char ${c.code}) at pos ${c.index}`).join(', ')
        error += ` Problem at: ${details}${invalidChars.length > 3 ? '...' : ''}`
      }
      return
    }

    try {
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        error = 'Could not get canvas context'
        return
      }

      const values = encodeCode128(barcodeText)

      // 11 modules per symbol value, except STOP which is 13 (spec
      // termination); the core's CODE128.patterns[106] is the 13-bit form.
      const totalWidth = ((values.length - 1) * 11 + 13) * MODULE_WIDTH + QUIET_ZONE * 2

      if (totalWidth > MAX_CANVAS_WIDTH) {
        error = `Barcode too wide (${totalWidth}px). Maximum width is ${MAX_CANVAS_WIDTH}px.`
        return
      }

      canvas.width = totalWidth
      canvas.height = MODULE_HEIGHT + 40

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      let x = QUIET_ZONE
      ctx.fillStyle = '#000000'

      for (const val of values) {
        const pattern = CODE128.patterns[val]
        if (pattern) {
          for (let i = 0; i < pattern.length; i++) {
            if (pattern[i] === '1') {
              ctx.fillRect(x + i * MODULE_WIDTH, 0, MODULE_WIDTH, MODULE_HEIGHT)
            }
          }
          x += 11 * MODULE_WIDTH
        }
      }

      ctx.fillStyle = '#000000'
      ctx.font = '14px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(barcodeText, canvas.width / 2, MODULE_HEIGHT + 25)

      error = ''
    } catch (/** @type {any} */ e) {
      error = 'Error generating barcode: ' + (e.message || 'Unknown error')
      console.error('Barcode generation error:', e)
    }
  }

  function debouncedGenerate() {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout)
    }
    debounceTimeout = setTimeout(() => {
      generateBarcode()
      saveState()
      debounceTimeout = null
    }, DEBOUNCE_DELAY)
  }

  function downloadPNG() {
    if (!canvas) {
      error = 'No barcode to download'
      return
    }
    try {
      const link = document.createElement('a')
      link.download = 'barcode.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (/** @type {any} */ e) {
      error = 'Failed to download barcode'
      console.error('Download error:', e)
    }
  }

  function clear() {
    barcodeText = ''
    error = ''
    try {
      localStorage.removeItem('devutils-barcode-text')
      localStorage.removeItem('devutils-barcode-type')
    } catch (/** @type {any} */ e) {
      console.error('Failed to clear saved state:', e)
    }
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }
  }

  function loadExample() {
    barcodeText = 'CODE128'
    error = ''
    setTimeout(() => {
      generateBarcode()
      saveState()
    }, 0)
  }
</script>

<div class="tool">
  <ToolHeader toolId="barcode" />

  <ToolShell
    toolId="barcode"
    action="gen"
    input={barcodeText}
    output=""
    onRun={generateBarcode}
  >
    <div class="barcode-input">
      <div class="input-group">
        <label for="barcode-text">Text to encode</label>
        <input
          id="barcode-text"
          type="text"
          bind:value={barcodeText}
          on:input={debouncedGenerate}
          placeholder="Enter text or numbers..."
          maxlength={MAX_INPUT_LENGTH}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'barcode-error' : undefined}
        />
      </div>
      <div class="input-group type-group">
        <label for="barcode-type">Type</label>
        <select id="barcode-type" bind:value={barcodeType}>
          <option value="CODE128">Code128</option>
        </select>
      </div>
    </div>

    {#if error}
      <div class="error-display" role="alert" aria-live="polite">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{error}</span>
      </div>
    {/if}

    <Panel label="Barcode">
      <div class="barcode-preview">
        <canvas
          bind:this={canvas}
          class="barcode-canvas"
          aria-label={barcodeText ? `Barcode representing: ${barcodeText}` : 'Barcode preview area'}
        ></canvas>
      </div>
    </Panel>

    <svelte:fragment slot="rail">
      {#if barcodeText}
        <Button variant="primary" on:click={downloadPNG} aria-label="Download barcode PNG">Download PNG</Button>
      {/if}
      <Button on:click={loadExample} title="Load Example" aria-label="Load example barcode text">example</Button>
      <Button on:click={clear} title="Clear" aria-label="Clear barcode input">clear</Button>
    </svelte:fragment>
  </ToolShell>
</div>

<style>
  .tool { display: flex; flex-direction: column; gap: var(--space-4); width: 100%; }
  .error-display { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4); background: var(--error-soft); color: var(--error-text); border-radius: var(--radius-md); }
  .barcode-input { display: flex; gap: var(--space-4); padding: var(--space-4); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .input-group { display: flex; flex-direction: column; gap: var(--space-1); }
  .input-group label { font-size: var(--text-xs); font-weight: var(--font-medium); text-transform: uppercase; letter-spacing: var(--tracking-wide); color: var(--text-tertiary); }
  .input-group input, .input-group select { padding: var(--space-3); border: 1px solid var(--border-default); border-radius: var(--radius); background: var(--bg-base); color: var(--text-primary); font-size: var(--text-base); outline: none; }
  .input-group input:focus, .input-group select:focus { border-color: var(--accent); box-shadow: var(--glow-focus); }
  .type-group { width: 120px; }
  .barcode-preview { display: flex; justify-content: center; padding: var(--space-6); }
  .barcode-canvas { background: white; border-radius: var(--radius); box-shadow: var(--shadow-sm); }
  @media (max-width: 768px) { .barcode-input { flex-direction: column; } .type-group { width: 100%; } }
</style>
