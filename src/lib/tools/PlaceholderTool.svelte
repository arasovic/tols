<script>
  import { onMount, onDestroy } from 'svelte'

  let width = 400
  let height = 300
  let bgColor = '#E5E7EB'
  let textColor = '#374151'
  let placeholderText = ''
  let canvas
  let timeout
  let saveTimeout
  let canvasReady = false
  let errorMessage = ''
  const MAX_TEXT_LENGTH = 100
  const MIN_DIMENSION = 50
  const MAX_DIMENSION = 2000

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
  }

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
    } catch (e) {
      console.error('Failed to load placeholder state from localStorage:', e)
      errorMessage = 'Failed to load saved settings'
      setTimeout(() => { errorMessage = '' }, 3000)
    }
  }

  function saveState() {
    try {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        localStorage.setItem('devutils-placeholder-width', width.toString())
        localStorage.setItem('devutils-placeholder-height', height.toString())
        localStorage.setItem('devutils-placeholder-bg', bgColor)
        localStorage.setItem('devutils-placeholder-textcolor', textColor)
        localStorage.setItem('devutils-placeholder-text', placeholderText)
      }, 500)
    } catch (e) {
      console.error('Failed to save placeholder state to localStorage:', e)
      errorMessage = 'Failed to save settings'
      setTimeout(() => { errorMessage = '' }, 3000)
    }
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

  function getLuminance(hexColor) {
    const r = parseInt(hexColor.slice(1, 3), 16) / 255
    const g = parseInt(hexColor.slice(3, 5), 16) / 255
    const b = parseInt(hexColor.slice(5, 7), 16) / 255
    const gammaCorrect = (c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    return 0.2126 * gammaCorrect(r) + 0.7152 * gammaCorrect(g) + 0.0722 * gammaCorrect(b)
  }

  function getContrastRatio(color1, color2) {
    const lum1 = getLuminance(color1)
    const lum2 = getLuminance(color2)
    const brightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)
    return (brightest + 0.05) / (darkest + 0.05)
  }

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

    let fontSize = 24
    if (width < 150 || height < 100) {
      fontSize = 12
    } else if (width < 250 || height < 150) {
      fontSize = 16
    } else if (width > 800 || height > 600) {
      fontSize = 32
    }

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
    } catch (e) {
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
    } catch (e) {
      console.error('Failed to clear localStorage:', e)
    }
    drawPlaceholder()
  }
</script>

<div class="tool">
  <div class="tool-header">
    <div class="tool-meta">
      <h1 class="tool-name">Image Placeholder</h1>
      <p class="tool-desc">Generate colored placeholder images</p>
    </div>
    <div class="tool-actions">
      <button class="icon-btn" on:click={clear} title="Clear" data-testid="clear-button" aria-label="Clear all settings">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  </div>

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

  <div class="preview">
    <canvas bind:this={canvas} width={width} height={height} data-testid="preview-canvas" aria-label="Preview of placeholder image"></canvas>
    <button class="download-btn" on:click={downloadPNG} data-testid="download-button" aria-label="Download placeholder image as PNG">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Download PNG
    </button>
  </div>
</div>

<style>
  .tool { display: flex; flex-direction: column; gap: var(--space-5); width: 100%; animation: fadeIn var(--transition) var(--ease-out); }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  .tool-header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); padding-bottom: var(--space-4); border-bottom: 1px solid var(--border-subtle); }
  .tool-meta { display: flex; flex-direction: column; gap: var(--space-1); }
  .tool-name { font-size: var(--text-xl); font-weight: var(--font-semibold); color: var(--text-primary); letter-spacing: var(--tracking-tight); margin: 0; }
  .tool-desc { font-size: var(--text-sm); color: var(--text-tertiary); margin: 0; }
  .tool-actions { display: flex; align-items: center; gap: var(--space-2); }
  .icon-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: var(--radius); background: transparent; color: var(--text-tertiary); border: none; cursor: pointer; transition: all var(--transition-fast); }
  .icon-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
  .icon-btn:focus { outline: 2px solid var(--accent); outline-offset: 2px; }
  .controls { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--space-4); padding: var(--space-4); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .control-group { display: flex; flex-direction: column; gap: var(--space-1); }
  .control-group.wide { grid-column: 1 / -1; }
  .control-group label { font-size: var(--text-xs); font-weight: var(--font-medium); text-transform: uppercase; letter-spacing: var(--tracking-wide); color: var(--text-tertiary); }
  .control-group input { padding: var(--space-2); border: 1px solid var(--border-default); border-radius: var(--radius); background: var(--bg-base); color: var(--text-primary); font-size: var(--text-sm); outline: none; }
  .control-group input:focus { border-color: var(--accent); }
  .control-group input[type="color"] { height: 38px; cursor: pointer; }
  .preview { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); padding: var(--space-6); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .preview canvas { border-radius: var(--radius); box-shadow: var(--shadow-sm); }
  .download-btn { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); font-size: var(--text-sm); font-weight: var(--font-medium); color: white; background: var(--accent); border: none; border-radius: var(--radius); cursor: pointer; transition: all var(--transition-fast); }
  .download-btn:hover { background: var(--accent-hover); }
  .download-btn:focus { outline: 2px solid var(--accent); outline-offset: 2px; }
  .error-message { padding: var(--space-3); background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--radius); color: #dc2626; font-size: var(--text-sm); }
  @media (max-width: 768px) { .controls { grid-template-columns: 1fr; } .tool-header { flex-direction: column; align-items: flex-start; } .tool-actions { width: 100%; justify-content: flex-end; } }
</style>
