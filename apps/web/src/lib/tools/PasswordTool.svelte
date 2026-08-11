<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import ToolHeader from '$lib/ui/ToolHeader.svelte'
  import ToolShell from '$lib/ui/ToolShell.svelte'
  import Button from '$lib/ui/Button.svelte'
  import { onMount, onDestroy } from 'svelte'
  import {
    generate as generatePassword,
    entropyLabel as entropyLabelText,
    MIN_LENGTH,
    MAX_LENGTH,
    DEFAULT_LENGTH
  } from 'tols-cli/core/password'

  let length = DEFAULT_LENGTH
  let includeUppercase = true
  let includeLowercase = true
  let includeNumbers = true
  let includeSymbols = false
  let generatedPassword = ''
  let entropy = 0
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let saveTimeout
  let errorMessage = ''

  // The CLI defaults upper/lower/numbers ON and symbols OFF, and buildCommand
  // drops a `false` value entirely — so a disabled class has to be the string
  // 'false' to survive as --lower=false. The generated password is never the
  // command's input; it is a secret, and the command has none.
  $: cliFlags = {
    length,
    upper: includeUppercase || 'false',
    lower: includeLowercase || 'false',
    numbers: includeNumbers || 'false',
    symbols: includeSymbols
  }

  function loadState() {
    try {
      const savedLength = localStorage.getItem('devutils-password-length')
      const savedUpper = localStorage.getItem('devutils-password-upper')
      const savedLower = localStorage.getItem('devutils-password-lower')
      const savedNumbers = localStorage.getItem('devutils-password-numbers')
      const savedSymbols = localStorage.getItem('devutils-password-symbols')
      if (savedLength) length = parseInt(savedLength, 10)
      if (savedUpper) includeUppercase = savedUpper === 'true'
      if (savedLower) includeLowercase = savedLower === 'true'
      if (savedNumbers) includeNumbers = savedNumbers === 'true'
      if (savedSymbols) includeSymbols = savedSymbols === 'true'
    } catch (/** @type {any} */ e) {
      console.error('Failed to load password generator state:', e)
    }
  }

  function saveState() {
    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem('devutils-password-length', length.toString())
        localStorage.setItem('devutils-password-upper', includeUppercase.toString())
        localStorage.setItem('devutils-password-lower', includeLowercase.toString())
        localStorage.setItem('devutils-password-numbers', includeNumbers.toString())
        localStorage.setItem('devutils-password-symbols', includeSymbols.toString())
      } catch (/** @type {any} */ e) {
        console.error('Failed to save password generator state:', e)
      }
    }, 500)
  }

  function generate() {
    // The core throws on an empty charset (cleaner library contract); map
    // that to the existing UI error state.
    try {
      const result = generatePassword(length, {
        upper: includeUppercase,
        lower: includeLowercase,
        numbers: includeNumbers,
        symbols: includeSymbols
      })
      generatedPassword = result.password
      entropy = result.entropy
      errorMessage = ''
    } catch (/** @type {any} */ e) {
      generatedPassword = ''
      entropy = 0
      errorMessage = e.message || 'Please select at least one character type'
    }
  }

  const STRENGTH_COLORS = {
    Weak: 'var(--error)',
    Fair: 'var(--warning)',
    Strong: 'var(--success)',
    'Very Strong': 'var(--success)'
  }
  // Reactive (the web computed this once at init, so the label never moved
  // off 'Weak' after generation).
  $: entropyLabel = { text: entropyLabelText(entropy), color: STRENGTH_COLORS[/** @type {keyof typeof STRENGTH_COLORS} */ (entropyLabelText(entropy))] }

  function handleRegenerate() {
    generate()
    saveState()
  }

  function handleClear() {
    length = DEFAULT_LENGTH
    includeUppercase = true
    includeLowercase = true
    includeNumbers = true
    includeSymbols = false
    generatedPassword = ''
    entropy = 0
    errorMessage = ''
    try {
      localStorage.removeItem('devutils-password-length')
      localStorage.removeItem('devutils-password-upper')
      localStorage.removeItem('devutils-password-lower')
      localStorage.removeItem('devutils-password-numbers')
      localStorage.removeItem('devutils-password-symbols')
    } catch (/** @type {any} */ e) {
      console.error('Failed to clear password generator state:', e)
    }
  }

  /**
   * @param {Event & { currentTarget: HTMLInputElement }} event
   */
  function handleLengthInput(event) {
    length = parseInt(event.currentTarget.value, 10)
    generate()
    saveState()
  }

  function handleLowercaseChange() {
    includeLowercase = !includeLowercase
    generate()
    saveState()
  }

  function handleUppercaseChange() {
    includeUppercase = !includeUppercase
    generate()
    saveState()
  }

  function handleNumbersChange() {
    includeNumbers = !includeNumbers
    generate()
    saveState()
  }

  function handleSymbolsChange() {
    includeSymbols = !includeSymbols
    generate()
    saveState()
  }

  onMount(() => {
    loadState()
    generate()
  })

  onDestroy(() => {
    clearTimeout(saveTimeout)
  })
</script>

<div class="tool">
  <ToolHeader toolId="password" />

  <ToolShell
    toolId="password"
    action="gen"
    flags={cliFlags}
    output={generatedPassword}
    onRun={handleRegenerate}
  >
    <div class="options-section">
      <div class="option-row">
        <label for="length-slider">Length: {length}</label>
        <input
          id="length-slider"
          type="range"
          bind:value={length}
          min={MIN_LENGTH}
          max={MAX_LENGTH}
          aria-label="Password length"
          on:input={handleLengthInput}
        />
      </div>

      {#if errorMessage}
        <div class="error-message" role="alert">{errorMessage}</div>
      {/if}

      <div class="checkboxes">
        <label class="checkbox" for="check-lowercase">
          <input id="check-lowercase" type="checkbox" bind:checked={includeLowercase} on:change={handleLowercaseChange} />
          <span>Lowercase (a-z)</span>
        </label>
        <label class="checkbox" for="check-uppercase">
          <input id="check-uppercase" type="checkbox" bind:checked={includeUppercase} on:change={handleUppercaseChange} />
          <span>Uppercase (A-Z)</span>
        </label>
        <label class="checkbox" for="check-numbers">
          <input id="check-numbers" type="checkbox" bind:checked={includeNumbers} on:change={handleNumbersChange} />
          <span>Numbers (0-9)</span>
        </label>
        <label class="checkbox" for="check-symbols">
          <input id="check-symbols" type="checkbox" bind:checked={includeSymbols} on:change={handleSymbolsChange} />
          <span>Symbols (!@#$...)</span>
        </label>
      </div>
    </div>

    {#if generatedPassword}
      <div class="password-display" role="status" aria-live="polite">
        <div class="password-value">{generatedPassword}</div>
        <div class="password-meta">
          <span class="strength" style="color: {entropyLabel.color}">{entropyLabel.text}</span>
          <span class="entropy">{Math.round(entropy)} bits</span>
        </div>
        <CopyButton text={generatedPassword} />
      </div>
    {:else}
      <div class="password-placeholder" role="status" aria-live="polite">
        <span>Click regenerate to create a password</span>
      </div>
    {/if}

    <svelte:fragment slot="rail">
      <Button variant="primary" on:click={handleRegenerate} aria-label="Regenerate password">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true">
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
        regenerate
      </Button>
      <Button on:click={handleClear} aria-label="Clear password">clear</Button>
    </svelte:fragment>
  </ToolShell>
</div>

<style>
  .tool { display: flex; flex-direction: column; gap: 0; width: 100%; }
  .options-section { display: flex; flex-direction: column; gap: var(--space-4); padding: var(--space-4); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .option-row { display: flex; flex-direction: column; gap: var(--space-2); }
  .option-row label { font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-secondary); }
  .option-row input[type="range"] { width: 100%; }
  .error-message { padding: var(--space-3); background: var(--error-bg); border: 1px solid var(--error); border-radius: var(--radius); color: var(--error); font-size: var(--text-sm); }
  .checkboxes { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3); }
  .checkbox { display: flex; align-items: center; gap: var(--space-2); cursor: pointer; padding: var(--space-2); border-radius: var(--radius); transition: background var(--transition-fast) var(--ease-out); }
  .checkbox:hover { background: var(--bg-hover); }
  .checkbox input { cursor: pointer; }
  .checkbox span { font-size: var(--text-sm); color: var(--text-secondary); }
  .password-display { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-6); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .password-placeholder { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-6); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); color: var(--text-tertiary); font-size: var(--text-sm); }
  .password-value { font-family: var(--font-mono); font-size: var(--text-xl); font-weight: var(--font-semibold); color: var(--text-primary); word-break: break-all; text-align: center; }
  .password-meta { display: flex; gap: var(--space-3); font-size: var(--text-sm); }
  .strength { font-weight: var(--font-semibold); }
  .entropy { color: var(--text-secondary); }

  @media (max-width: 768px) {
    .checkboxes { grid-template-columns: 1fr; }
  }
</style>
