<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import ToolHeader from '$lib/ui/ToolHeader.svelte'
  import ToolShell from '$lib/ui/ToolShell.svelte'
  import Panel from '$lib/ui/Panel.svelte'
  import Button from '$lib/ui/Button.svelte'
  import { onMount, onDestroy } from 'svelte'
  import { generateMatrix } from 'tols-cli/core/qrcode'

  const DEFAULT_URL = 'https://github.com/arasovic/tols'
  const OLD_DEFAULT_URL = 'https://devutils.tools'

  let qrText = DEFAULT_URL
  let qrSize = 200
  /** @type {HTMLCanvasElement | undefined} */
  let qrCanvas
  let error = ''
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timeout = null
  /** @type {ReturnType<typeof setTimeout> | null} */
  let saveTimeout = null
  let canvasReady = false

  function loadState() {
    try {
      const savedText = localStorage.getItem('devutils-qr-text')
      const savedSize = localStorage.getItem('devutils-qr-size')

      // Use saved value only if it exists and is not the old default URL
      if (savedText && savedText !== OLD_DEFAULT_URL) {
        qrText = savedText
      }
      // Otherwise keep the new default (already set in variable declaration)

      if (savedSize) qrSize = parseInt(savedSize)
    } catch (/** @type {any} */ e) {
      // Fallback to defaults if localStorage fails
      qrText = DEFAULT_URL
      qrSize = 200
    }
  }

  function saveState() {
    try {
      if (saveTimeout) clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        try {
          localStorage.setItem('devutils-qr-text', qrText)
          localStorage.setItem('devutils-qr-size', qrSize.toString())
        } catch (/** @type {any} */ e) {
          // Silent fail on localStorage error
        }
      }, 500)
    } catch (/** @type {any} */ e) {
      // Silent fail
    }
  }

  onMount(() => {
    loadState()
    // Wait for canvas binding before generating
    setTimeout(() => {
      if (qrCanvas) {
        canvasReady = true
        generateQR()
      }
    }, 0)
  })

  onDestroy(() => {
    if (timeout) clearTimeout(timeout)
    if (saveTimeout) clearTimeout(saveTimeout)
  })


  function generateQR() {
    if (!qrText) {
      error = 'Please enter text'
      return
    }

    if (!qrCanvas) {
      error = 'Canvas not available'
      return
    }

    try {
      // The spec-complete encoder (versions 1-40, all EC levels, all 8
      // masks with penalty scoring, multi-block Reed-Solomon interleave,
      // alignment patterns, version info) lives in tols-cli/core/qrcode;
      // this component only rasterizes the returned matrix to the canvas.
      const { matrix, size } = generateMatrix(qrText, { ecLevel: 'M' })

      // Draw on canvas
      const ctx = qrCanvas.getContext('2d')
      if (!ctx) {
        error = 'Could not get canvas context'
        return
      }

      qrCanvas.width = qrSize
      qrCanvas.height = qrSize

      // Clear canvas (white background)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, qrSize, qrSize)

      // Draw QR code
      const cellSize = qrSize / size
      ctx.fillStyle = '#000000'

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (matrix[y][x] === 1) {
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
          }
        }
      }

      error = ''
    } catch (/** @type {any} */ e) {
      const msg = e.message || 'Unknown error'
      // The core's validation errors surface without the generic prefix,
      // matching the web's previous UX (e.g. "Text too long for QR code").
      error = msg === 'text too long for QR code'
        ? 'Text too long for QR code'
        : 'Error generating QR code: ' + msg
    }
  }

  function debouncedGenerate() {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      generateQR()
      saveState()
    }, 300)
  }

  function downloadPNG() {
    if (!qrCanvas) {
      error = 'No QR code to download'
      return
    }

    // Verify canvas has content
    try {
      const ctx = qrCanvas.getContext('2d')
      if (!ctx) {
        error = 'Could not get canvas context'
        return
      }

      const imageData = ctx.getImageData(0, 0, qrCanvas.width, qrCanvas.height)
      const hasContent = imageData.data.some((/** @type {number} */ pixel, /** @type {number} */ index) => {
        // Check alpha channel or if pixel is not white
        return index % 4 === 3 ? pixel > 0 : pixel < 255
      })

      if (!hasContent) {
        error = 'No QR code content to download'
        return
      }

      const link = document.createElement('a')
      link.download = 'qrcode.png'
      link.href = qrCanvas.toDataURL('image/png')
      link.click()
      error = ''
    } catch (/** @type {any} */ e) {
      error = 'Failed to download QR code'
    }
  }

  function clear() {
    qrText = ''
    try {
      localStorage.removeItem('devutils-qr-text')
      localStorage.removeItem('devutils-qr-size')
    } catch (/** @type {any} */ e) {
      // Silent fail
    }
    // Clear canvas and generate error
    if (qrCanvas) {
      const ctx = qrCanvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, qrSize, qrSize)
      }
    }
    // Trigger error display
    error = 'Please enter text'
  }

  /**
   * @param {string} url
   */
  function setExample(url) {
    qrText = url
    debouncedGenerate()
  }
</script>

<div class="tool">
  <ToolHeader toolId="qrcode" />

  <ToolShell
    toolId="qrcode"
    action="gen"
    flags={{ ec: 'M' }}
    input={qrText}
  >
    {#if error}
      <div class="error-display" role="alert">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>{error}</span>
      </div>
    {/if}

    <div class="qr-input-section">
      <div class="input-group">
        <label for="qr-text-input">Text or URL</label>
        <input id="qr-text-input" type="text" bind:value={qrText} on:input={debouncedGenerate} placeholder="Enter text or URL..." />
      </div>
      <div class="input-group size-group">
        <label for="qr-size-slider">Size: {qrSize}px</label>
        <input id="qr-size-slider" type="range" bind:value={qrSize} min="100" max="500" step="50" on:input={debouncedGenerate} />
      </div>
    </div>

    <Panel label="QR Code">
      <div class="qr-preview">
        <canvas bind:this={qrCanvas} width={qrSize} height={qrSize} aria-label="Generated QR code"></canvas>
      </div>
    </Panel>

    <div class="examples-section">
      <h3>Quick Examples</h3>
      <div class="examples">
        <button type="button" class="example-btn" on:click={() => setExample('https://github.com')}>GitHub</button>
        <button type="button" class="example-btn" on:click={() => setExample('https://google.com')}>Google</button>
        <button type="button" class="example-btn" on:click={() => setExample('mailto:hello@example.com')}>Email</button>
        <button type="button" class="example-btn" on:click={() => setExample('tel:+1234567890')}>Phone</button>
      </div>
    </div>

    <svelte:fragment slot="rail">
      {#if qrText}
        <Button variant="primary" on:click={downloadPNG} aria-label="Download QR code PNG">Download PNG</Button>
      {/if}
      <Button on:click={clear} title="Clear" aria-label="Clear">clear</Button>
    </svelte:fragment>
  </ToolShell>
</div>

<style>
  .tool { display: flex; flex-direction: column; gap: 0; width: 100%; }
  .error-display { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4); background: var(--error-soft); color: var(--error-text); border-radius: var(--radius-md); }
  .qr-input-section { display: flex; flex-direction: column; gap: var(--space-4); padding: var(--space-4); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .input-group { display: flex; flex-direction: column; gap: var(--space-2); }
  .input-group label { font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-secondary); }
  .input-group input[type="text"] { padding: var(--space-3); border: 1px solid var(--border-default); border-radius: var(--radius); background: var(--bg-base); color: var(--text-primary); font-size: var(--text-base); outline: none; }
  .input-group input[type="text"]:focus { border-color: var(--accent); box-shadow: var(--glow-focus); }
  .size-group input[type="range"] { width: 100%; }
  .qr-preview { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); padding: var(--space-6); }
  .qr-preview canvas { background: white; border-radius: var(--radius); }
  .examples-section h3 { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--text-tertiary); margin-bottom: var(--space-3); text-transform: uppercase; letter-spacing: var(--tracking-wide); }
  .examples { display: flex; flex-wrap: wrap; gap: var(--space-2); }
  .example-btn { padding: var(--space-2) var(--space-3); font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-secondary); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius); cursor: pointer; transition: all var(--transition-fast) var(--ease-out); }
  .example-btn:hover { background: var(--accent-soft); color: var(--accent); border-color: var(--accent-dim); }
  .example-btn:focus { outline: 2px solid var(--accent); outline-offset: 2px; }
</style>
