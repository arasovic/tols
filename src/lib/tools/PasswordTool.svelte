<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount } from 'svelte'

  let length = 16
  let includeUppercase = true
  let includeLowercase = true
  let includeNumbers = true
  let includeSymbols = false
  let generatedPassword = ''
  let entropy = 0
  let saveTimeout

  const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
  const NUMBERS = '0123456789'
  const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  function loadState() {
    try {
      const savedLength = localStorage.getItem('devutils-password-length')
      const savedUpper = localStorage.getItem('devutils-password-upper')
      const savedLower = localStorage.getItem('devutils-password-lower')
      const savedNumbers = localStorage.getItem('devutils-password-numbers')
      const savedSymbols = localStorage.getItem('devutils-password-symbols')
      if (savedLength) length = parseInt(savedLength)
      if (savedUpper) includeUppercase = savedUpper === 'true'
      if (savedLower) includeLowercase = savedLower === 'true'
      if (savedNumbers) includeNumbers = savedNumbers === 'true'
      if (savedSymbols) includeSymbols = savedSymbols === 'true'
    } catch (e) {}
  }

  function saveState() {
    try {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        localStorage.setItem('devutils-password-length', length.toString())
        localStorage.setItem('devutils-password-upper', includeUppercase.toString())
        localStorage.setItem('devutils-password-lower', includeLowercase.toString())
        localStorage.setItem('devutils-password-numbers', includeNumbers.toString())
        localStorage.setItem('devutils-password-symbols', includeSymbols.toString())
      }, 500)
    } catch (e) {}
  }

  onMount(() => {
    loadState()
    generate()
  })

  function generate() {
    let charset = ''
    if (includeLowercase) charset += LOWERCASE
    if (includeUppercase) charset += UPPERCASE
    if (includeNumbers) charset += NUMBERS
    if (includeSymbols) charset += SYMBOLS

    if (charset === '') {
      generatedPassword = ''
      entropy = 0
      return
    }

    let password = ''
    const array = new Uint32Array(length)
    crypto.getRandomValues(array)
    
    for (let i = 0; i < length; i++) {
      password += charset[array[i] % charset.length]
    }

    generatedPassword = password
    entropy = Math.log2(Math.pow(charset.length, length))
  }

  function getEntropyLabel() {
    if (entropy < 50) return { text: 'Weak', color: 'var(--error)' }
    if (entropy < 80) return { text: 'Fair', color: 'var(--warning)' }
    if (entropy < 120) return { text: 'Strong', color: 'var(--success)' }
    return { text: 'Very Strong', color: 'var(--success)' }
  }

  function regenerate() {
    generate()
    saveState()
  }

  function clear() {
    length = 16
    includeUppercase = true
    includeLowercase = true
    includeNumbers = true
    includeSymbols = false
    generatedPassword = ''
    entropy = 0
    try {
      localStorage.removeItem('devutils-password-length')
      localStorage.removeItem('devutils-password-upper')
      localStorage.removeItem('devutils-password-lower')
      localStorage.removeItem('devutils-password-numbers')
      localStorage.removeItem('devutils-password-symbols')
    } catch (e) {}
  }
</script>

<div class="tool">
  <div class="tool-header">
    <div class="tool-meta">
      <h1 class="tool-name">Password Generator</h1>
      <p class="tool-desc">Generate secure random passwords</p>
    </div>
    <div class="tool-actions">
      <button class="icon-btn" on:click={regenerate} title="Regenerate">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
      </button>
      <button class="icon-btn" on:click={clear} title="Clear">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  </div>

  <div class="options-section">
    <div class="option-row">
      <label>Length: {length}</label>
      <input type="range" bind:value={length} min="8" max="64" on:input={() => { generate(); saveState(); }} />
    </div>
    
    <div class="checkboxes">
      <label class="checkbox">
        <input type="checkbox" bind:checked={includeLowercase} on:change={() => { generate(); saveState(); }} />
        <span>Lowercase (a-z)</span>
      </label>
      <label class="checkbox">
        <input type="checkbox" bind:checked={includeUppercase} on:change={() => { generate(); saveState(); }} />
        <span>Uppercase (A-Z)</span>
      </label>
      <label class="checkbox">
        <input type="checkbox" bind:checked={includeNumbers} on:change={() => { generate(); saveState(); }} />
        <span>Numbers (0-9)</span>
      </label>
      <label class="checkbox">
        <input type="checkbox" bind:checked={includeSymbols} on:change={() => { generate(); saveState(); }} />
        <span>Symbols (!@#$...)</span>
      </label>
    </div>
  </div>

  {#if generatedPassword}
    <div class="password-display">
      <div class="password-value">{generatedPassword}</div>
      <div class="password-meta">
        <span class="strength" style="color: {getEntropyLabel().color}">{getEntropyLabel().text}</span>
        <span class="entropy">{Math.round(entropy)} bits</span>
      </div>
      <CopyButton text={generatedPassword} />
    </div>
  {/if}
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
  .options-section { display: flex; flex-direction: column; gap: var(--space-4); padding: var(--space-4); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .option-row { display: flex; flex-direction: column; gap: var(--space-2); }
  .option-row label { font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-secondary); }
  .option-row input[type="range"] { width: 100%; }
  .checkboxes { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3); }
  .checkbox { display: flex; align-items: center; gap: var(--space-2); cursor: pointer; }
  .checkbox input { cursor: pointer; }
  .checkbox span { font-size: var(--text-sm); color: var(--text-secondary); }
  .password-display { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-6); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .password-value { font-family: var(--font-mono); font-size: var(--text-xl); font-weight: var(--font-semibold); color: var(--text-primary); word-break: break-all; text-align: center; }
  .password-meta { display: flex; gap: var(--space-3); font-size: var(--text-sm); }
  .strength { font-weight: var(--font-semibold); }
  .entropy { color: var(--text-secondary); }
  @media (max-width: 768px) { .checkboxes { grid-template-columns: 1fr; } .tool-header { flex-direction: column; align-items: flex-start; } .tool-actions { width: 100%; justify-content: flex-end; } }
</style>
