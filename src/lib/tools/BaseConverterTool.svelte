<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount, onDestroy } from 'svelte'

  const DEFAULT_DECIMAL = '255'
  const DEFAULT_BINARY = '11111111'
  const DEFAULT_HEX = 'FF'
  const DEFAULT_OCTAL = '377'
  const DEBOUNCE_MS = 300
  const SAVE_DEBOUNCE_MS = 500
  const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER

  const STORAGE_KEY = 'devutils-base-decimal'

  const CONVERSION_EXAMPLES = [
    { value: '255', label: '255' },
    { value: '1024', label: '1024' },
    { value: '4096', label: '4096' },
    { value: '65535', label: '65535' }
  ]

  let decimal = ''
  let binary = ''
  let hex = ''
  let octal = ''
  let activeBase = 'decimal'
  let error = ''
  let timeout
  let saveTimeout

  const baseConverters = {
    decimal: { convert: convertFromDecimal, validate: validateDecimal },
    binary: { convert: convertFromBinary, validate: validateBinary },
    hex: { convert: convertFromHex, validate: validateHex },
    octal: { convert: convertFromOctal, validate: validateOctal }
  }

  function validateDecimal(value) {
    if (!value || value === '-') return { valid: true, error: '' }
    const num = parseInt(value, 10)
    if (isNaN(num)) return { valid: false, error: 'Invalid decimal number' }
    if (num > MAX_SAFE_INTEGER) return { valid: false, error: `Number exceeds maximum safe integer (${MAX_SAFE_INTEGER})` }
    return { valid: true, error: '' }
  }

  function validateBinary(value) {
    if (!value) return { valid: true, error: '' }
    if (!/^[01]*-?[01]*$/.test(value)) return { valid: false, error: 'Binary can only contain 0 and 1' }
    return { valid: true, error: '' }
  }

  function validateHex(value) {
    if (!value) return { valid: true, error: '' }
    if (!/^[0-9A-Fa-f]*-?[0-9A-Fa-f]*$/.test(value)) return { valid: false, error: 'Hex can only contain 0-9 and A-F' }
    return { valid: true, error: '' }
  }

  function validateOctal(value) {
    if (!value) return { valid: true, error: '' }
    if (!/^[0-7]*-?[0-7]*$/.test(value)) return { valid: false, error: 'Octal can only contain 0-7' }
    return { valid: true, error: '' }
  }

  function loadState() {
    try {
      const savedDecimal = localStorage.getItem(STORAGE_KEY)
      if (savedDecimal && savedDecimal.trim() !== '') {
        const validation = validateDecimal(savedDecimal.trim())
        if (validation.valid) {
          decimal = savedDecimal.trim()
          convertFromDecimal()
        }
      } else {
        setDefaults()
      }
    } catch (e) {
      setDefaults()
    }
  }

  function setDefaults() {
    decimal = DEFAULT_DECIMAL
    binary = DEFAULT_BINARY
    hex = DEFAULT_HEX
    octal = DEFAULT_OCTAL
  }

  function saveState() {
    try {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        if (decimal !== '') {
          localStorage.setItem(STORAGE_KEY, decimal)
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      }, SAVE_DEBOUNCE_MS)
    } catch (e) {}
  }

  onMount(() => {
    loadState()
  })

  onDestroy(() => {
    clearTimeout(timeout)
    clearTimeout(saveTimeout)
  })

  loadState()

  function convertFromDecimal() {
    const trimmed = decimal.trim()
    if (trimmed === '' || trimmed === '-') {
      clearOtherFields('decimal')
      return
    }
    const dec = parseInt(trimmed, 10)
    if (isNaN(dec)) {
      error = 'Invalid decimal number'
      return
    }
    if (dec > MAX_SAFE_INTEGER) {
      error = `Number exceeds maximum safe integer (${MAX_SAFE_INTEGER})`
      return
    }
    error = ''
    binary = dec.toString(2)
    hex = dec.toString(16).toUpperCase()
    octal = dec.toString(8)
  }

  function convertFromBinary() {
    const trimmed = binary.trim()
    if (trimmed === '') {
      clearOtherFields('binary')
      return
    }
    const bin = parseInt(trimmed, 2)
    if (isNaN(bin)) {
      error = 'Invalid binary number'
      return
    }
    if (bin > MAX_SAFE_INTEGER) {
      error = `Number exceeds maximum safe integer (${MAX_SAFE_INTEGER})`
      return
    }
    error = ''
    decimal = bin.toString(10)
    hex = bin.toString(16).toUpperCase()
    octal = bin.toString(8)
  }

  function convertFromHex() {
    const trimmed = hex.trim()
    if (trimmed === '') {
      clearOtherFields('hex')
      return
    }
    const h = parseInt(trimmed, 16)
    if (isNaN(h)) {
      error = 'Invalid hexadecimal number'
      return
    }
    if (h > MAX_SAFE_INTEGER) {
      error = `Number exceeds maximum safe integer (${MAX_SAFE_INTEGER})`
      return
    }
    error = ''
    decimal = h.toString(10)
    binary = h.toString(2)
    octal = h.toString(8)
  }

  function convertFromOctal() {
    const trimmed = octal.trim()
    if (trimmed === '') {
      clearOtherFields('octal')
      return
    }
    const oct = parseInt(trimmed, 8)
    if (isNaN(oct)) {
      error = 'Invalid octal number'
      return
    }
    if (oct > MAX_SAFE_INTEGER) {
      error = `Number exceeds maximum safe integer (${MAX_SAFE_INTEGER})`
      return
    }
    error = ''
    decimal = oct.toString(10)
    binary = oct.toString(2)
    hex = oct.toString(16).toUpperCase()
  }

  function clearOtherFields(sourceField) {
    error = ''
    if (sourceField !== 'decimal') decimal = ''
    if (sourceField !== 'binary') binary = ''
    if (sourceField !== 'hex') hex = ''
    if (sourceField !== 'octal') octal = ''
  }

  function updateFrom(field) {
    activeBase = field
    error = ''
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      const baseHandler = baseConverters[field]
      if (baseHandler) {
        const value = getFieldValue(field)
        const validation = baseHandler.validate(value)
        if (!validation.valid) {
          error = validation.error
          return
        }
        baseHandler.convert()
        saveState()
      }
    }, DEBOUNCE_MS)
  }

  function getFieldValue(field) {
    switch (field) {
      case 'decimal': return decimal
      case 'binary': return binary
      case 'hex': return hex
      case 'octal': return octal
      default: return ''
    }
  }

  function clear() {
    decimal = ''
    binary = ''
    hex = ''
    octal = ''
    error = ''
    activeBase = 'decimal'
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {}
  }

  function loadExample() {
    decimal = DEFAULT_DECIMAL
    convertFromDecimal()
    saveState()
  }

  function loadQuickConversion(value) {
    decimal = value
    convertFromDecimal()
    saveState()
  }
</script>

<div class="tool">
  <div class="tool-header">
    <div class="tool-meta">
      <h1 class="tool-name">Number Base Converter</h1>
      <p class="tool-desc">Convert between decimal, binary, hexadecimal, and octal</p>
    </div>
    <div class="tool-actions">
      <button class="icon-btn" on:click={loadExample} title="Load Example" aria-label="Load example value">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></svg>
      </button>
      <button class="icon-btn" on:click={clear} title="Clear" aria-label="Clear all fields">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  </div>

  {#if error}
    <div class="error-state" role="alert" aria-live="polite">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
      <span>{error}</span>
    </div>
  {/if}

  <div class="converter-grid">
    <div class="base-card">
      <div class="base-header">
        <span class="base-name">Decimal</span>
        <span class="base-prefix">Base 10</span>
      </div>
      <input
        type="text"
        bind:value={decimal}
        on:input={() => updateFrom('decimal')}
        placeholder="0"
        aria-label="Decimal number input"
        inputmode="numeric"
        pattern="[0-9-]*"
      />
      <CopyButton text={decimal} />
    </div>

    <div class="base-card">
      <div class="base-header">
        <span class="base-name">Binary</span>
        <span class="base-prefix">Base 2</span>
      </div>
      <input
        type="text"
        bind:value={binary}
        on:input={() => updateFrom('binary')}
        placeholder="0"
        aria-label="Binary number input"
        inputmode="numeric"
        pattern="[01]*"
      />
      <CopyButton text={binary} />
    </div>

    <div class="base-card">
      <div class="base-header">
        <span class="base-name">Hexadecimal</span>
        <span class="base-prefix">Base 16</span>
      </div>
      <input
        type="text"
        bind:value={hex}
        on:input={() => updateFrom('hex')}
        placeholder="0"
        aria-label="Hexadecimal number input"
        inputmode="text"
        pattern="[0-9A-Fa-f]*"
      />
      <CopyButton text={hex} />
    </div>

    <div class="base-card">
      <div class="base-header">
        <span class="base-name">Octal</span>
        <span class="base-prefix">Base 8</span>
      </div>
      <input
        type="text"
        bind:value={octal}
        on:input={() => updateFrom('octal')}
        placeholder="0"
        aria-label="Octal number input"
        inputmode="numeric"
        pattern="[0-7]*"
      />
      <CopyButton text={octal} />
    </div>
  </div>

  <div class="quick-conversions">
    <h3>Common Conversions</h3>
    <div class="conversion-grid">
      {#each CONVERSION_EXAMPLES as example}
        <button
          class="conv-btn"
          on:click={() => loadQuickConversion(example.value)}
          aria-label={`Load ${example.label} as decimal value`}
        >
          {example.label}
        </button>
      {/each}
    </div>
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
  .converter-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-4); }
  .base-card { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-4); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .base-header { display: flex; justify-content: space-between; align-items: center; }
  .base-name { font-size: var(--text-base); font-weight: var(--font-semibold); color: var(--text-primary); }
  .base-prefix { font-size: var(--text-xs); color: var(--text-tertiary); }
  .base-card input { padding: var(--space-3); border: 1px solid var(--border-default); border-radius: var(--radius); background: var(--bg-base); color: var(--text-primary); font-family: var(--font-mono); font-size: var(--text-lg); outline: none; }
  .base-card input:focus { border-color: var(--accent); box-shadow: var(--glow-focus); }
  .base-card input:invalid { border-color: var(--error); }
  .quick-conversions h3 { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--text-tertiary); margin-bottom: var(--space-3); text-transform: uppercase; letter-spacing: var(--tracking-wide); }
  .conversion-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-2); }
  .conv-btn { padding: var(--space-2) var(--space-3); font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-secondary); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius); cursor: pointer; transition: all var(--transition-fast); }
  .conv-btn:hover { background: var(--accent-soft); color: var(--accent); border-color: var(--accent-dim); }
  .error-state { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4); background: var(--error-soft, rgba(239, 68, 68, 0.1)); border: 1px solid var(--error, #EF4444); border-radius: var(--radius); color: var(--error); font-size: var(--text-sm); }
  @media (max-width: 768px) { .converter-grid { grid-template-columns: 1fr; } .conversion-grid { grid-template-columns: repeat(2, 1fr); } .tool-header { flex-direction: column; align-items: flex-start; } .tool-actions { width: 100%; justify-content: flex-end; } }
</style>