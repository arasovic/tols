<script>
  import { onMount, onDestroy, tick } from 'svelte'

  let barcodeText = 'CODE128'
  let barcodeType = 'CODE128'
  let canvas
  let error = ''
  let saveTimeout = null
  let debounceTimeout = null
  let isMounted = false

  const DEBOUNCE_DELAY = 150
  const SAVE_DELAY = 500
  const MAX_INPUT_LENGTH = 100
  const MAX_CANVAS_WIDTH = 10000
  const MODULE_WIDTH = 2
  const MODULE_HEIGHT = 100
  const QUIET_ZONE = 10

  const INVALID_CHARS_MESSAGE = 'Invalid characters detected. Only printable ASCII characters (32-127) are supported for Code128.'
  const EMPTY_INPUT_MESSAGE = 'Please enter text to encode'
  const TOO_LONG_MESSAGE = `Input too long. Maximum ${MAX_INPUT_LENGTH} characters allowed.`

  // Code 128 character set
  const CODE128 = {
    START_A: 103,
    START_B: 104,
    START_C: 105,
    STOP: 106,

    patterns: [
      '11011001100', '11001101100', '11001100110', '10010011000', '10010001100',
      '10001001100', '10011001000', '10011000100', '10001100100', '11001001000',
      '11001000100', '11000100100', '10110011100', '10011011100', '10011001110',
      '10111001100', '10011101100', '10011100110', '11001110010', '11001011100',
      '11001001110', '11011100100', '11001110100', '11101101110', '11101001100',
      '11100101100', '11100100110', '11101100100', '11100110100', '11100110010',
      '11011011000', '11011000110', '11000110110', '10100011000', '10001011000',
      '10001000110', '10110001000', '10001101000', '10001100010', '11010001000',
      '11000101000', '11000100010', '10110111000', '10110001110', '10001101110',
      '10111011000', '10111000110', '10001110110', '11101110110', '11010001110',
      '11000101110', '11011101000', '11011100010', '11011101110', '11101011000',
      '11101000110', '11100010110', '11101101000', '11101100010', '11100011010',
      '11101111010', '11001000010', '11110001010', '10100110000', '10100001100',
      '10010110000', '10010000110', '10000101100', '10000100110', '10110010000',
      '10110000100', '10011010000', '10011000010', '10000110100', '10000110010',
      '11000010010', '11001010000', '11110111010', '11000010100', '10001111010',
      '10100111100', '10010111100', '10010011110', '10111100100', '10011110100',
      '10011110010', '11110100100', '11110010100', '11110010010', '11011011110',
      '11011110110', '11110110110', '10101111000', '10100011110', '10001011110',
      '10111101000', '10111100010', '11110101000', '11110100010', '10111011110',
      '10111101110', '11101011110', '11110101110', '11010000100', '11010010000',
      '11010011100', '11000111010'
    ]
  }

  function getCode128Value(char, set) {
    const code = char.charCodeAt(0)

    if (set === 'A') {
      if (code >= 0 && code <= 31) return code + 64
      if (code >= 32 && code <= 95) return code - 32
      return -1
    }

    if (set === 'B') {
      if (code >= 32 && code <= 127) return code - 32
      return -1
    }

    if (set === 'C') {
      return -1
    }

    return -1
  }

  function determineSet(text) {
    if (!text || text.length === 0) {
      return 'B'
    }

    const hasOnlyDigits = /^\d+$/.test(text)
    const hasLowercase = /[a-z]/.test(text)
    const hasUppercase = /[A-Z]/.test(text)
    const hasControlChars = /[\x00-\x1F]/.test(text)
    const hasExtendedAscii = /[\x80-\xFF]/.test(text)

    if (hasControlChars) {
      return 'A'
    }

    if (hasOnlyDigits && text.length >= 4) {
      return 'C'
    }

    if (hasLowercase || hasUppercase || !hasExtendedAscii) {
      return 'B'
    }

    return 'B'
  }

  function validateInput(text) {
    if (!text || text.trim().length === 0) {
      return { valid: false, message: EMPTY_INPUT_MESSAGE }
    }

    if (text.length > MAX_INPUT_LENGTH) {
      return { valid: false, message: TOO_LONG_MESSAGE }
    }

    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i)
      if (code < 32 || code > 127) {
        return { valid: false, message: INVALID_CHARS_MESSAGE }
      }
    }

    return { valid: true, message: '' }
  }

  function findInvalidCharacters(text) {
    const invalid = []
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i)
      if (code < 32 || code > 127) {
        invalid.push({ char: text[i], index: i, code })
      }
    }
    return invalid
  }

  function encodeCode128(text) {
    const set = determineSet(text)
    const values = []

    if (set === 'A') values.push(CODE128.START_A)
    else if (set === 'B') values.push(CODE128.START_B)
    else values.push(CODE128.START_C)

    if (set === 'C') {
      for (let i = 0; i < text.length; i += 2) {
        const pair = parseInt(text.substring(i, i + 2), 10)
        values.push(pair)
      }
    } else {
      for (let i = 0; i < text.length; i++) {
        const val = getCode128Value(text[i], set)
        if (val >= 0) {
          values.push(val)
        }
      }
    }

    let checksum = values[0]
    for (let i = 1; i < values.length; i++) {
      checksum += values[i] * i
    }
    checksum = checksum % 103
    values.push(checksum)

    values.push(CODE128.STOP)

    return values
  }

  function loadState() {
    try {
      const savedText = localStorage.getItem('devutils-barcode-text')
      const savedType = localStorage.getItem('devutils-barcode-type')
      if (savedText !== null) barcodeText = savedText
      if (savedType !== null) barcodeType = savedType
    } catch (e) {
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
    } catch (e) {
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

      const totalWidth = values.reduce((sum) => sum + 11, 0) * MODULE_WIDTH + QUIET_ZONE * 2

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
    } catch (e) {
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
    } catch (e) {
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
    } catch (e) {
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
  <div class="tool-header">
    <div class="tool-meta">
      <h1 class="tool-name">Barcode Generator</h1>
      <p class="tool-desc">Generate Code128 barcodes</p>
    </div>
    <div class="tool-actions">
      <button
        class="icon-btn"
        on:click={loadExample}
        title="Load Example"
        aria-label="Load example barcode text"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/>
        </svg>
      </button>
      <button
        class="icon-btn"
        on:click={clear}
        title="Clear"
        aria-label="Clear barcode input"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
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

  <div class="barcode-preview">
    <canvas
      bind:this={canvas}
      aria-label={barcodeText ? `Barcode representing: ${barcodeText}` : 'Barcode preview area'}
    ></canvas>
    {#if barcodeText}
      <button class="download-btn" on:click={downloadPNG}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Download PNG
      </button>
    {/if}
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
  .error-display { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4); background: var(--error-soft); color: var(--error-text); border-radius: var(--radius-md); }
  .barcode-input { display: flex; gap: var(--space-4); padding: var(--space-4); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .input-group { display: flex; flex-direction: column; gap: var(--space-1); }
  .input-group label { font-size: var(--text-xs); font-weight: var(--font-medium); text-transform: uppercase; letter-spacing: var(--tracking-wide); color: var(--text-tertiary); }
  .input-group input, .input-group select { padding: var(--space-3); border: 1px solid var(--border-default); border-radius: var(--radius); background: var(--bg-base); color: var(--text-primary); font-size: var(--text-base); outline: none; }
  .input-group input:focus, .input-group select:focus { border-color: var(--accent); box-shadow: var(--glow-focus); }
  .type-group { width: 120px; }
  .barcode-preview { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); padding: var(--space-6); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .barcode-preview canvas { background: white; border-radius: var(--radius); box-shadow: var(--shadow-sm); }
  .download-btn { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); font-size: var(--text-sm); font-weight: var(--font-medium); color: white; background: var(--accent); border: none; border-radius: var(--radius); cursor: pointer; transition: all var(--transition-fast); }
  .download-btn:hover { background: var(--accent-hover); }
  @media (max-width: 768px) { .barcode-input { flex-direction: column; } .type-group { width: 100%; } .tool-header { flex-direction: column; align-items: flex-start; } .tool-actions { width: 100%; justify-content: flex-end; } }
</style>
