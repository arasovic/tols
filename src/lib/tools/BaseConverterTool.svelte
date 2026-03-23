<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount } from 'svelte'

  let decimal = '255'
  let binary = '11111111'
  let hex = 'FF'
  let octal = '377'
  let activeBase = 'decimal'
  let timeout
  let saveTimeout

  function loadState() {
    try {
      const savedDecimal = localStorage.getItem('devutils-base-decimal')
      if (savedDecimal) {
        decimal = savedDecimal
        convertFromDecimal()
      }
    } catch (e) {}
  }

  function saveState() {
    try {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        localStorage.setItem('devutils-base-decimal', decimal)
      }, 500)
    } catch (e) {}
  }

  onMount(() => {
    loadState()
  })

  function convertFromDecimal() {
    const dec = parseInt(decimal, 10)
    if (isNaN(dec)) return
    binary = dec.toString(2)
    hex = dec.toString(16).toUpperCase()
    octal = dec.toString(8)
  }

  function convertFromBinary() {
    const bin = parseInt(binary, 2)
    if (isNaN(bin)) return
    decimal = bin.toString(10)
    hex = bin.toString(16).toUpperCase()
    octal = bin.toString(8)
  }

  function convertFromHex() {
    const h = parseInt(hex, 16)
    if (isNaN(h)) return
    decimal = h.toString(10)
    binary = h.toString(2)
    octal = h.toString(8)
  }

  function convertFromOctal() {
    const oct = parseInt(octal, 8)
    if (isNaN(oct)) return
    decimal = oct.toString(10)
    binary = oct.toString(2)
    hex = oct.toString(16).toUpperCase()
  }

  function updateFrom(field) {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      if (field === 'decimal') convertFromDecimal()
      else if (field === 'binary') convertFromBinary()
      else if (field === 'hex') convertFromHex()
      else if (field === 'octal') convertFromOctal()
      saveState()
    }, 300)
  }

  function clear() {
    decimal = ''
    binary = ''
    hex = ''
    octal = ''
    try {
      localStorage.removeItem('devutils-base-decimal')
    } catch (e) {}
  }

  function loadExample() {
    decimal = '255'
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
      <button class="icon-btn" on:click={loadExample} title="Load Example">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></svg>
      </button>
      <button class="icon-btn" on:click={clear} title="Clear">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  </div>

  <div class="converter-grid">
    <div class="base-card">
      <div class="base-header">
        <span class="base-name">Decimal</span>
        <span class="base-prefix">Base 10</span>
      </div>
      <input type="text" bind:value={decimal} on:input={() => updateFrom('decimal')} placeholder="0" />
      <CopyButton text={decimal} />
    </div>

    <div class="base-card">
      <div class="base-header">
        <span class="base-name">Binary</span>
        <span class="base-prefix">Base 2</span>
      </div>
      <input type="text" bind:value={binary} on:input={() => updateFrom('binary')} placeholder="0" />
      <CopyButton text={binary} />
    </div>

    <div class="base-card">
      <div class="base-header">
        <span class="base-name">Hexadecimal</span>
        <span class="base-prefix">Base 16</span>
      </div>
      <input type="text" bind:value={hex} on:input={() => updateFrom('hex')} placeholder="0" />
      <CopyButton text={hex} />
    </div>

    <div class="base-card">
      <div class="base-header">
        <span class="base-name">Octal</span>
        <span class="base-prefix">Base 8</span>
      </div>
      <input type="text" bind:value={octal} on:input={() => updateFrom('octal')} placeholder="0" />
      <CopyButton text={octal} />
    </div>
  </div>

  <div class="quick-conversions">
    <h3>Common Conversions</h3>
    <div class="conversion-grid">
      <button class="conv-btn" on:click={() => { decimal = '255'; convertFromDecimal(); saveState(); }}>255</button>
      <button class="conv-btn" on:click={() => { decimal = '1024'; convertFromDecimal(); saveState(); }}>1024</button>
      <button class="conv-btn" on:click={() => { decimal = '4096'; convertFromDecimal(); saveState(); }}>4096</button>
      <button class="conv-btn" on:click={() => { decimal = '65535'; convertFromDecimal(); saveState(); }}>65535</button>
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
  .quick-conversions h3 { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--text-tertiary); margin-bottom: var(--space-3); text-transform: uppercase; letter-spacing: var(--tracking-wide); }
  .conversion-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-2); }
  .conv-btn { padding: var(--space-2) var(--space-3); font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-secondary); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius); cursor: pointer; transition: all var(--transition-fast); }
  .conv-btn:hover { background: var(--accent-soft); color: var(--accent); border-color: var(--accent-dim); }
  @media (max-width: 768px) { .converter-grid { grid-template-columns: 1fr; } .conversion-grid { grid-template-columns: repeat(2, 1fr); } .tool-header { flex-direction: column; align-items: flex-start; } .tool-actions { width: 100%; justify-content: flex-end; } }
</style>
