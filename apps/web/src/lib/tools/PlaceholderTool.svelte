<script>
  import { onMount, onDestroy } from 'svelte'
  import ToolHeader from '$lib/ui/ToolHeader.svelte'
  import ToolShell from '$lib/ui/ToolShell.svelte'
  import Panel from '$lib/ui/Panel.svelte'
  import Button from '$lib/ui/Button.svelte'
  import { clamp, getLuminance, getContrastRatio, fontSizeFor, MIN_DIMENSION, MAX_DIMENSION, MAX_TEXT_LENGTH } from 'tols-cli/core/placeholder'

  let width = 400
  let height = 300
  let bgColor = '#E5E7EB'
  let textColor = '#374151'
  let placeholderText = ''
  /** @type {HTMLCanvasElement | undefined} */
  let canvas
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeout
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let saveTimeout
  let canvasReady = false
  let errorMessage = ''

  // The CLI mirrors the five controls as flags, --text-color for the hyphenated
  // flag name (packages/tols/src/tools/placeholder.js). The text is only
  // passed once non-empty: an empty --text would override the CLI's own
  // width x height fallback.
  $: cliFlags = {
    width,
    height,
    bg: bgColor,
    'text-color': textColor,
    text: placeholderText || undefined
  }

  /**
   * @param {number} value
   */
  function isValidInteger(value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value)
  }

  function loadState() {
    try {
      const savedWidth = localStorage.getItem('devutils-placeholder-width')
      const savedHeight = localStorage.getItem('devutils-placeholder-height')
      const savedBg = localStorage.getItem('devutils-placeholder-bg')
      const savedTextColor = localStorage.getItem('devutils-placeholder-textcolor')
      const savedText = localStorage.getItem('devutils-placeholder-text')

      if (savedWidth) {
        const parsedWidth = parseInt(savedWidth, 10)
        if (isValidInteger(parsedWidth)) {
          width = clamp(parsedWidth, MIN_DIMENSION, MAX_DIMENSION)
        }
      }
      if (savedHeight) {
        const parsedHeight = parseInt(savedHeight, 10)
        if (isValidInteger(parsedHeight)) {
          height = clamp(parsedHeight, MIN_DIMENSION, MAX_DIMENSION)
        }
      }
      if (savedBg && /^#[0-9A-Fa-f]{6}$/.test(savedBg)) {
        bgColor = savedBg
      }
      if (savedTextColor && /^#[0-9A-Fa-f]{6}$/.test(savedTextColor)) {
        textColor = savedTextColor
      }
      if (savedText && typeof savedText === 'string') {
        placeholderText = savedText.slice(0, MAX_TEXT_LENGTH)
      }
    } catch (/** @type {any} */ e) {
      console.error('Failed to load placeholder state from localStorage:', e)
      errorMessage = 'Failed to load saved settings'
      setTimeout(() => { errorMessage = '' }, 3000)
    }
  }

  function saveState() {
    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem('devutils-placeholder-width', width.toString())
        localStorage.setItem('devutils-placeholder-height', height.toString())
        localStorage.setItem('devutils-placeholder-bg', bgColor)
        localStorage.setItem('devutils-placeholder-textcolor', textColor)
        localStorage.setItem('devutils-placeholder-text', placeholderText)
      } catch (/** @type {any} */ e) {
        console.error('Failed to save placeholder state to localStorage:', e)
        errorMessage = 'Failed to save settings'
        setTimeout(() => { errorMessage = '' }, 3000)
      }
    }, 500)
  }

  onMount(() => {
    loadState()
    requestAnimationFrame(() => {
      canvasReady = true
      drawPlaceholder()
    })
  })

  onDestroy(() => {
    clearTimeout(timeout)
    clearTimeout(saveTimeout)
  })

  function drawPlaceholder() {
    if (!canvas || !canvasReady) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = width
    canvas.height = height

    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, width, height)

    ctx.strokeStyle = textColor
    ctx.lineWidth = 2
    const borderPadding = Math.min(20, Math.floor(width / 4), Math.floor(height / 4))
    if (width > borderPadding * 2 && height > borderPadding * 2) {
      ctx.strokeRect(borderPadding, borderPadding, width - borderPadding * 2, height - borderPadding * 2)
    }

    const displayText = (placeholderText || `${width}x${height}`).slice(0, MAX_TEXT_LENGTH)

    const contrastRatio = getContrastRatio(bgColor, textColor)
    const hasLowContrast = contrastRatio < 4.5

    const fontSize = fontSizeFor(width, height)

    ctx.fillStyle = textColor
    ctx.font = `bold ${fontSize}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const maxTextWidth = width - borderPadding * 2 - 10
    let truncatedText = displayText
    let textMetrics = ctx.measureText(truncatedText)
    while (truncatedText.length > 0 && textMetrics.width > maxTextWidth) {
      truncatedText = truncatedText.slice(0, -1)
      textMetrics = ctx.measureText(truncatedText + '...')
    }
    if (truncatedText !== displayText) {
      truncatedText = truncatedText + '...'
    }

    ctx.fillText(truncatedText, width / 2, height / 2)

    const subtitleFontSize = Math.max(10, Math.floor(fontSize * 0.6))
    ctx.font = `${subtitleFontSize}px sans-serif`
    const subtitleOffset = Math.max(20, Math.floor(fontSize * 0.8))
    const subtitleY = Math.min(height / 2 + subtitleOffset, height - borderPadding - 10)
    ctx.fillText('Placeholder', width / 2, subtitleY)

    if (hasLowContrast && width > 200 && height > 100) {
      ctx.save()
      ctx.fillStyle = contrastRatio < 2 ? 'rgba(255,0,0,0.8)' : 'rgba(255,165,0,0.9)'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'top'
      ctx.fillText(`Low contrast: ${contrastRatio.toFixed(1)}:1`, width - 5, 5)
      ctx.restore()
    }
  }

  function debouncedDraw() {
    width = clamp(width, MIN_DIMENSION, MAX_DIMENSION)
    height = clamp(height, MIN_DIMENSION, MAX_DIMENSION)

    clearTimeout(timeout)
    timeout = setTimeout(() => {
      drawPlaceholder()
      saveState()
    }, 300)
  }

  function downloadPNG() {
    if (!canvas) {
      errorMessage = 'Canvas not available'
      setTimeout(() => { errorMessage = '' }, 3000)
      return
    }
    try {
      const link = document.createElement('a')
      link.download = `placeholder-${width}x${height}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (/** @type {any} */ e) {
      console.error('Failed to download PNG:', e)
      errorMessage = 'Failed to download image'
      setTimeout(() => { errorMessage = '' }, 3000)
    }
  }

  function clear() {
    width = 400
    height = 300
    bgColor = '#E5E7EB'
    textColor = '#374151'
    placeholderText = ''
    errorMessage = ''
    try {
      localStorage.removeItem('devutils-placeholder-width')
      localStorage.removeItem('devutils-placeholder-height')
      localStorage.removeItem('devutils-placeholder-bg')
      localStorage.removeItem('devutils-placeholder-textcolor')
      localStorage.removeItem('devutils-placeholder-text')
    } catch (/** @type {any} */ e) {
      console.error('Failed to clear localStorage:', e)
    }
    drawPlaceholder()
  }
</script>

<div class="tool">
  <ToolHeader toolId="placeholder" />

  <ToolShell
    toolId="placeholder"
    action="gen"
    flags={cliFlags}
  >
    {#if errorMessage}
      <div class="error-message" role="alert" data-testid="error-message">
        {errorMessage}
      </div>
    {/if}

    <div class="controls">
      <div class="control-group">
        <label for="width-input">Width</label>
        <input
          id="width-input"
          type="number"
          bind:value={width}
          min={MIN_DIMENSION}
          max={MAX_DIMENSION}
          on:input={debouncedDraw}
          data-testid="width-input"
          aria-label="Image width in pixels"
        />
      </div>
      <div class="control-group">
        <label for="height-input">Height</label>
        <input
          id="height-input"
          type="number"
          bind:value={height}
          min={MIN_DIMENSION}
          max={MAX_DIMENSION}
          on:input={debouncedDraw}
          data-testid="height-input"
          aria-label="Image height in pixels"
        />
      </div>
      <div class="control-group">
        <label for="bg-color-input">Background</label>
        <input
          id="bg-color-input"
          type="color"
          bind:value={bgColor}
          on:input={debouncedDraw}
          data-testid="bg-color-input"
          aria-label="Background color"
        />
      </div>
      <div class="control-group">
        <label for="text-color-input">Text Color</label>
        <input
          id="text-color-input"
          type="color"
          bind:value={textColor}
          on:input={debouncedDraw}
          data-testid="text-color-input"
          aria-label="Text color"
        />
      </div>
      <div class="control-group wide">
        <label for="custom-text-input">Custom Text</label>
        <input
          id="custom-text-input"
          type="text"
          bind:value={placeholderText}
          on:input={debouncedDraw}
          placeholder="Leave empty for dimensions..."
          maxlength={MAX_TEXT_LENGTH}
          data-testid="custom-text-input"
          aria-label="Custom placeholder text"
        />
      </div>
    </div>

    <Panel label="Preview">
      <div class="preview">
        <canvas bind:this={canvas} width={width} height={height} data-testid="preview-canvas" aria-label="Preview of placeholder image"></canvas>
      </div>
    </Panel>

    <svelte:fragment slot="rail">
      <Button variant="primary" on:click={downloadPNG} data-testid="download-button" aria-label="Download placeholder image as PNG">Download PNG</Button>
      <Button on:click={clear} title="Clear" data-testid="clear-button" aria-label="Clear all settings">clear</Button>
    </svelte:fragment>
  </ToolShell>
</div>

<style>
  .tool { display: flex; flex-direction: column; gap: 0; width: 100%; }
  .controls { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--space-4); padding: var(--space-4); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .control-group { display: flex; flex-direction: column; gap: var(--space-1); }
  .control-group.wide { grid-column: 1 / -1; }
  .control-group label { font-size: var(--text-xs); font-weight: var(--font-medium); text-transform: uppercase; letter-spacing: var(--tracking-wide); color: var(--text-tertiary); }
  .control-group input { padding: var(--space-2); border: 1px solid var(--border-default); border-radius: var(--radius); background: var(--bg-base); color: var(--text-primary); font-size: var(--text-sm); outline: none; }
  .control-group input:focus { border-color: var(--accent); }
  .control-group input[type="color"] { height: 38px; cursor: pointer; }
  .preview { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); padding: var(--space-6); }
  .preview canvas { display: block; max-width: 100%; height: auto; border-radius: var(--radius); }
  .error-message { padding: var(--space-3); background: var(--error-soft); border: 1px solid var(--error); border-radius: var(--radius); color: var(--error-text); font-size: var(--text-sm); }
  @media (max-width: 768px) { .controls { grid-template-columns: 1fr; } }
</style>
