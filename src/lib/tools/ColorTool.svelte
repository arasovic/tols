<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount, onDestroy } from 'svelte'

  const STORAGE_KEY = 'devutils:color-tool:hex'
  const EXAMPLE_HEX = '3B82F6'

  let hex = ''
  let rgb = ''
  let hsl = ''
  let colorPreview = '#0a0a0c'
  let saveTimeout = null
  let isMounted = false
  let errorMessage = ''

  function waitForDebounce(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  function hexToRgb(hexInput) {
    let clean = hexInput.replace(/[^0-9A-Fa-f]/g, '')
    if (clean.length === 3) {
      clean = clean.split('').map(c => c + c).join('')
    }
    if (clean.length !== 6) return null

    const r = parseInt(clean.substring(0, 2), 16)
    const g = parseInt(clean.substring(2, 4), 16)
    const b = parseInt(clean.substring(4, 6), 16)

    if (isNaN(r) || isNaN(g) || isNaN(b)) return null

    return { r, g, b }
  }

  function rgbToHsl(r, g, b) {
    r /= 255
    g /= 255
    b /= 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (max === min) {
      h = s = 0
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    }
  }

  function hslToRgb(h, s, l) {
    s /= 100
    l /= 100
    const k = n => (n + h / 30) % 12
    const a = s * Math.min(l, 1 - l)
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
    const r = Math.round(255 * f(0))
    const g = Math.round(255 * f(8))
    const b = Math.round(255 * f(4))
    return { r, g, b }
  }

  function updateColor() {
    if (!hex) {
      rgb = ''
      hsl = ''
      colorPreview = '#0a0a0c'
      errorMessage = ''
      return
    }

    const rgbObj = hexToRgb(hex)
    if (!rgbObj) {
      rgb = ''
      hsl = ''
      colorPreview = '#0a0a0c'
      errorMessage = 'Invalid color format'
      return
    }

    rgb = `rgb(${rgbObj.r}, ${rgbObj.g}, ${rgbObj.b})`
    const hslObj = rgbToHsl(rgbObj.r, rgbObj.g, rgbObj.b)
    hsl = `hsl(${hslObj.h}, ${hslObj.s}%, ${hslObj.l}%)`

    const properHex = [rgbObj.r, rgbObj.g, rgbObj.b].map(v => v.toString(16).padStart(2, '0')).join('')
    colorPreview = `#${properHex}`
    errorMessage = ''
  }

  function saveState() {
    try {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, hex)
        } catch (e) {
          console.warn('Failed to save to localStorage:', e)
        }
      }, 500)
    } catch (e) {
      console.warn('Failed to schedule save:', e)
    }
  }

  function loadState() {
    try {
      const savedHex = localStorage.getItem(STORAGE_KEY)
      if (savedHex) {
        hex = savedHex
        updateColor()
      } else {
        hex = EXAMPLE_HEX
        updateColor()
      }
    } catch (e) {
      hex = EXAMPLE_HEX
      console.warn('Failed to load from localStorage:', e)
    }
  }

  function clear() {
    hex = ''
    rgb = ''
    hsl = ''
    colorPreview = '#0a0a0c'
    errorMessage = ''
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.warn('Failed to clear localStorage:', e)
    }
  }

  function loadExample() {
    hex = EXAMPLE_HEX
    updateColor()
    saveState()
  }

  function handleHexInput(e) {
    let value = e.target.value.replace(/^#/, '').replace(/[^0-9A-Fa-f]/g, '').substring(0, 6)
    hex = value
    updateColor()
    saveState()
  }

  function parseRgbInput(value) {
    const rgbaMatch = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/)
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1])
      const g = parseInt(rgbaMatch[2])
      const b = parseInt(rgbaMatch[3])
      if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
        return { r, g, b }
      }
    }
    return null
  }

  function handleRgbInput(e) {
    const value = e.target.value.trim()
    if (!value) {
      errorMessage = ''
      return
    }
    const rgbObj = parseRgbInput(value)
    if (rgbObj) {
      hex = [rgbObj.r, rgbObj.g, rgbObj.b].map(v => v.toString(16).padStart(2, '0')).join('')
      updateColor()
      saveState()
    } else {
      errorMessage = 'Invalid RGB format. Expected: rgb(255, 0, 0)'
    }
  }

  function parseHslInput(value) {
    const hslaMatch = value.match(/^hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*[\d.]+)?\)$/)
    if (hslaMatch) {
      let h = parseInt(hslaMatch[1])
      const s = parseInt(hslaMatch[2])
      const l = parseInt(hslaMatch[3])
      if (h === 360) h = 0
      if (h >= 0 && h < 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100) {
        return { h, s, l }
      }
    }
    return null
  }

  function handleHslInput(e) {
    const value = e.target.value.trim()
    if (!value) {
      errorMessage = ''
      return
    }
    const hslObj = parseHslInput(value)
    if (hslObj) {
      const rgbObj = hslToRgb(hslObj.h, hslObj.s, hslObj.l)
      hex = [rgbObj.r, rgbObj.g, rgbObj.b].map(v => v.toString(16).padStart(2, '0')).join('')
      updateColor()
      saveState()
    } else {
      errorMessage = 'Invalid HSL format. Expected: hsl(0, 100%, 50%)'
    }
  }

  onMount(() => {
    isMounted = true
    loadState()
  })

  onDestroy(() => {
    isMounted = false
    if (saveTimeout) {
      clearTimeout(saveTimeout)
      saveTimeout = null
    }
  })
</script>

<div class="tool">
  <div class="tool-bar">
    <div class="tool-title">
      <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="13.5" cy="6.5" r="2.5"></circle>
        <circle cx="19" cy="17" r="2"></circle>
        <circle cx="6" cy="12" r="3"></circle>
        <path d="M13.5 9v4l3 3"></path>
        <path d="M9 6h.01"></path>
        <path d="M15 12h.01"></path>
        <path d="M18 15h.01"></path>
      </svg>
      <h1 class="tool-title-text">Color Converter</h1>
    </div>

    <div class="tool-actions">
      <button
        class="btn-ghost"
        on:click={loadExample}
        title="Load Example"
        aria-label="Load example color"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M12 6v6l4 2"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
      </button>
      <button
        class="btn-ghost"
        on:click={clear}
        title="Clear"
        aria-label="Clear all fields"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  </div>

  <div class="preview-card">
    <div
      class="color-swatch"
      style="background-color: {colorPreview};"
      role="img"
      aria-label="Color preview: {hex ? '#' + hex.toUpperCase() : 'None'}"
    >
      <div class="swatch-overlay"></div>
    </div>
    <div class="preview-info">
      <span class="preview-label">Preview</span>
      <span class="preview-hex mono">{hex ? '#' + hex.toUpperCase() : '#000000'}</span>
    </div>
  </div>

  {#if errorMessage}
    <div class="error-bar" role="alert" aria-live="polite">
      <span class="error-message">{errorMessage}</span>
    </div>
  {/if}

  <div class="formats-grid">
    <div class="format-card">
      <div class="format-header">
        <span class="format-label">HEX</span>
        <div class="format-actions">
          {#if hex}
            <CopyButton text={'#' + hex.toUpperCase()} />
          {/if}
        </div>
      </div>
      <input
        type="text"
        value="#{hex}"
        on:input={handleHexInput}
        placeholder="#000000"
        class="format-input mono"
        maxlength="7"
        aria-label="HEX color value"
        aria-describedby="hex-desc"
      />
      <span id="hex-desc" class="sr-only">Enter a HEX color value without the hash symbol</span>
    </div>

    <div class="format-card">
      <div class="format-header">
        <span class="format-label">RGB</span>
        <div class="format-actions">
          {#if rgb}
            <CopyButton text={rgb} />
          {/if}
        </div>
      </div>
      <input
        type="text"
        value={rgb}
        on:input={handleRgbInput}
        placeholder="rgb(0, 0, 0)"
        class="format-input mono"
        aria-label="RGB color value"
        aria-describedby="rgb-desc"
      />
      <span id="rgb-desc" class="sr-only">Enter an RGB or RGBA color value</span>
    </div>

    <div class="format-card">
      <div class="format-header">
        <span class="format-label">HSL</span>
        <div class="format-actions">
          {#if hsl}
            <CopyButton text={hsl} />
          {/if}
        </div>
      </div>
      <input
        type="text"
        value={hsl}
        on:input={handleHslInput}
        placeholder="hsl(0, 0%, 0%)"
        class="format-input mono"
        aria-label="HSL color value"
        aria-describedby="hsl-desc"
      />
      <span id="hsl-desc" class="sr-only">Enter an HSL or HSLA color value</span>
    </div>
  </div>

  <div class="info-bar">
    <div class="info-item">
      <span class="info-label">Format:</span>
      <span class="info-value">HEX, RGB, HSL</span>
    </div>
    <div class="info-item">
      <span class="info-label">Input:</span>
      <span class="badge badge-accent">Type any format</span>
    </div>
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
    gap: var(--space-2);
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

  .preview-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    overflow: hidden;
    box-shadow: var(--shadow);
  }

  .color-swatch {
    height: 160px;
    position: relative;
    background-image: linear-gradient(45deg, #808080 25%, transparent 25%),
                      linear-gradient(-45deg, #808080 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #808080 75%),
                      linear-gradient(-45deg, transparent 75%, #808080 75%);
    background-size: 16px 16px;
    background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
    border: 3px solid transparent;
    border-radius: var(--radius-md) var(--radius-md) 0 0;
    background-clip: padding-box;
  }

  .color-swatch::after {
    content: '';
    position: absolute;
    inset: 0;
    border: 3px solid var(--border-subtle);
    border-radius: var(--radius-md) var(--radius-md) 0 0;
    pointer-events: none;
  }

  .color-swatch::before {
    content: '';
    position: absolute;
    inset: 3px;
    background: inherit;
    border-radius: var(--radius-sm);
  }

  .preview-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-3) var(--space-4);
    background: var(--bg-elevated);
    border-top: 1px solid var(--border-subtle);
  }

  .preview-label {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
  }

  .preview-hex {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    letter-spacing: 0.05em;
  }

  .error-bar {
    padding: var(--space-3) var(--space-4);
    background: var(--bg-error);
    border: 1px solid var(--border-error);
    border-radius: var(--radius-md);
  }

  .error-message {
    font-size: var(--text-sm);
    color: var(--text-error);
  }

  .formats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-3);
  }

  .format-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-3);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
  }

  .format-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .format-label {
    font-size: var(--text-sm);
    font-weight: var(--font-semibold);
    color: var(--accent);
  }

  .format-actions {
    display: flex;
    gap: var(--space-1);
  }

  .format-input {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    background: var(--bg-base);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius);
    color: var(--text-primary);
    font-size: var(--text-sm);
    transition: all var(--transition);
  }

  .format-input:hover {
    border-color: var(--border-default);
  }

  .format-input:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-muted);
  }

  .format-input::placeholder {
    color: var(--text-disabled);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .info-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-4);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    flex-wrap: wrap;
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

  @media (max-width: 768px) {
    .tool-bar {
      flex-direction: column;
      gap: var(--space-3);
      align-items: flex-start;
    }

    .tool-actions {
      width: 100%;
      justify-content: flex-end;
    }

    .formats-grid {
      grid-template-columns: 1fr;
    }

    .info-bar {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
