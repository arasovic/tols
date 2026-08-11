<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import ShareButton from '$lib/components/ShareButton.svelte'
  import PasteButton from '$lib/components/PasteButton.svelte'
  import ToolHeader from '$lib/ui/ToolHeader.svelte'
  import FactStrip from '$lib/ui/FactStrip.svelte'
  import ToolShell from '$lib/ui/ToolShell.svelte'
  import Button from '$lib/ui/Button.svelte'
  import { readShareFragment } from '$lib/utils/share.js'
  import { hexToRgb, rgbToHsl, hslToRgb, parseRgbInput, parseHslInput, rgbToHex } from 'tols-cli/core/color'
  import { onMount, onDestroy } from 'svelte'

  const STORAGE_KEY = 'devutils:color-tool:hex'
  const EXAMPLE_HEX = '3B82F6'

  let hex = ''
  let rgb = ''
  let hsl = ''
  let colorPreview = '#0a0a0c'
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let saveTimeout
  let isMounted = false
  let errorMessage = ''

  // The canonical result shown in the preview; feeds ⌘⇧O. The CLI takes the
  // bare hex as positional input (packages/tols/src/tools/color.js).
  $: cliOutput = hex ? '#' + hex.toUpperCase() : ''

  /**
   * @param {number} ms
   */
  function waitForDebounce(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
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

    const properHex = rgbToHex(rgbObj)
    colorPreview = `#${properHex}`
    errorMessage = ''
  }

  function saveState() {
    try {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, hex)
        } catch (/** @type {any} */ e) {
          console.warn('Failed to save to localStorage:', e)
        }
      }, 500)
    } catch (/** @type {any} */ e) {
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
    } catch (/** @type {any} */ e) {
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
    } catch (/** @type {any} */ e) {
      console.warn('Failed to clear localStorage:', e)
    }
  }

  function loadExample() {
    hex = EXAMPLE_HEX
    updateColor()
    saveState()
  }

  /**
   * @param {{ currentTarget: { value: string } }} e
   */
  function handleHexInput(e) {
    let value = e.currentTarget.value.replace(/^#/, '').replace(/[^0-9A-Fa-f]/g, '').substring(0, 6)
    hex = value
    updateColor()
    saveState()
  }

  /**
   * @param {{ currentTarget: { value: string } }} e
   */
  function handleRgbInput(e) {
    const value = e.currentTarget.value.trim()
    if (!value) {
      errorMessage = ''
      return
    }
    const rgbObj = parseRgbInput(value)
    if (rgbObj) {
      hex = rgbToHex(rgbObj)
      updateColor()
      saveState()
    } else {
      errorMessage = 'Invalid RGB format. Expected: rgb(255, 0, 0)'
    }
  }

  /**
   * @param {{ currentTarget: { value: string } }} e
   */
  function handleHslInput(e) {
    const value = e.currentTarget.value.trim()
    if (!value) {
      errorMessage = ''
      return
    }
    const hslObj = parseHslInput(value)
    if (hslObj) {
      const rgbObj = hslToRgb(hslObj.h, hslObj.s, hslObj.l)
      hex = rgbToHex(rgbObj)
      updateColor()
      saveState()
    } else {
      errorMessage = 'Invalid HSL format. Expected: hsl(0, 100%, 50%)'
    }
  }

  onMount(() => {
    isMounted = true
    // A shared link takes precedence over locally saved state
    const shared = readShareFragment()
    if (shared && typeof shared.hex === 'string') {
      hex = shared.hex.replace(/^#/, '').replace(/[^0-9A-Fa-f]/g, '').substring(0, 6)
      updateColor()
    } else {
      loadState()
    }
  })

  onDestroy(() => {
    isMounted = false
    if (saveTimeout) {
      clearTimeout(saveTimeout)
      saveTimeout = undefined
    }
  })
</script>

<div class="tool">
  <ToolHeader toolId="color" />

  <ToolShell
    toolId="color"
    action="conv"
    input={hex}
    output={cliOutput}
  >
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

    <FactStrip
      facts={[
        { label: 'Format', value: 'HEX, RGB, HSL' },
        { label: 'Input', value: 'Type any format', presentation: 'accent' }
      ]}
    />

    <svelte:fragment slot="rail">
      <Button on:click={loadExample} title="Load Example" aria-label="Load example color">example</Button>
      <Button on:click={clear} title="Clear" aria-label="Clear all fields">clear</Button>
    </svelte:fragment>

    <svelte:fragment slot="rail-end">
      <PasteButton on:text={(e) => handleHexInput({ currentTarget: { value: e.detail.text } })} />
      <ShareButton getState={() => ({ hex })} />
    </svelte:fragment>
  </ToolShell>
</div>

<style>
  .tool {
    display: flex;
    flex-direction: column;
    gap: 0;
    width: 100%;
  }

  .preview-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    overflow: hidden;
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
    transition: all var(--transition) var(--ease-out);
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

  @media (max-width: 768px) {
    .formats-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
