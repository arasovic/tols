<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import ToolHeader from '$lib/ui/ToolHeader.svelte'
  import ToolShell from '$lib/ui/ToolShell.svelte'
  import { onMount } from 'svelte'
  import { COMMON_CHARS, analyzeChar, searchCommon } from 'tols-cli/core/unicode'

  const INPUT_STORAGE_KEY = 'devutils-unicode-search'
  const MODE_STORAGE_KEY = 'devutils-unicode-mode'

  /**
   * @typedef {{
   *   char: string,
   *   name: string,
   *   category: string,
   *   codepoint: string,
   *   decimal?: number,
   *   hex?: string,
   *   html?: string,
   *   css?: string,
   *   js?: string
   * }} UnicodeResult
   */

  let mode = 'info'
  let input = ''
  /** @type {ReturnType<typeof analyzeChar>} */
  let inspectResult = null
  /** @type {typeof COMMON_CHARS} */
  let searchResults = []

  /** @type {UnicodeResult[]} */
  let results = []

  $: results = mode === 'info' ? (inspectResult ? [inspectResult] : []) : searchResults

  function process() {
    inspectResult = null
    searchResults = []
    if (input === '') return
    if (mode === 'info') inspectResult = analyzeChar(input)
    else searchResults = searchCommon(input)
  }

  function saveState() {
    try {
      localStorage.setItem(INPUT_STORAGE_KEY, input)
      localStorage.setItem(MODE_STORAGE_KEY, mode)
    } catch (/** @type {any} */ e) {
      console.warn('Failed to save Unicode state to localStorage:', e)
    }
  }

  /** @param {string} value */
  function firstCodePoint(value) {
    return analyzeChar(value)?.char ?? ''
  }

  /** @param {Event} event */
  function handleInput(event) {
    const value = /** @type {HTMLInputElement} */ (event.currentTarget).value
    input = mode === 'info' ? firstCodePoint(value) : value
    process()
    saveState()
  }

  /** @param {'info' | 'search'} nextMode */
  function setMode(nextMode) {
    mode = nextMode
    if (mode === 'info') input = firstCodePoint(input)
    process()
    saveState()
  }

  /** @param {string} char */
  function selectCommon(char) {
    mode = 'info'
    input = char
    process()
    saveState()
  }

  onMount(() => {
    try {
      const savedMode = localStorage.getItem(MODE_STORAGE_KEY)
      const savedInput = localStorage.getItem(INPUT_STORAGE_KEY)
      if (savedMode === 'info' || savedMode === 'search') mode = savedMode
      if (savedInput) input = mode === 'info' ? firstCodePoint(savedInput) : savedInput
      process()
    } catch (/** @type {any} */ e) {
      console.warn('Failed to load Unicode state from localStorage:', e)
    }
  })

  /**
   * @param {string} char
   */
  function copyCodepoint(char) {
    const code = char.codePointAt(0)
    if (code === undefined) return ''
    return 'U+' + code.toString(16).toUpperCase().padStart(4, '0')
  }
</script>

<div class="tool">
  <ToolHeader toolId="unicode" />

  <ToolShell toolId="unicode" action={mode} {input} onRun={process}>
    <div class="mode-toggle" role="tablist" aria-label="Unicode mode">
      <button
        type="button"
        class="mode-btn"
        class:active={mode === 'info'}
        role="tab"
        aria-selected={mode === 'info'}
        on:click={() => setMode('info')}
      >
        Inspect
      </button>
      <button
        type="button"
        class="mode-btn"
        class:active={mode === 'search'}
        role="tab"
        aria-selected={mode === 'search'}
        on:click={() => setMode('search')}
      >
        Search
      </button>
    </div>

    <div class="search-section">
      <input
        type="text"
        value={input}
        on:input={handleInput}
        placeholder={mode === 'info' ? 'Enter a Unicode code point...' : 'Search common characters by name or category...'}
        aria-label={mode === 'info' ? 'Unicode code point' : 'Common character search'}
        class="search-input"
      />
    </div>

    {#if results.length > 0}
      <div class="results">
        {#each results as char}
          <div class="char-card">
            <div class="char-display">{char.char}</div>
            <div class="char-info">
              <div class="char-name">{char.name}</div>
              <div class="char-meta">
                <span class="category">{char.category}</span>
                <span class="codepoint">{char.codepoint}</span>
              </div>
              {#if mode === 'info' && char.decimal !== undefined}
                <div class="char-codes">
                  <span>Dec: {char.decimal}</span>
                  <span>Hex: {char.hex}</span>
                  <span>HTML: {char.html}</span>
                  <span>CSS: {char.css}</span>
                  <span>JS: {char.js}</span>
                </div>
              {/if}
            </div>
            <div class="char-actions">
              <CopyButton text={char.char} size="sm" />
              <CopyButton text={char.codepoint} size="sm" />
            </div>
          </div>
        {/each}
      </div>
    {:else if mode === 'search' && input}
      <div class="empty">No matching common characters</div>
    {/if}

    <div class="common-section">
      <h3>Common Characters</h3>
      <div class="char-grid">
        {#each COMMON_CHARS.slice(0, 24) as char}
          <button type="button" class="char-btn" on:click={() => selectCommon(char.char)} title="{char.name}">
            {char.char}
          </button>
        {/each}
      </div>
    </div>
  </ToolShell>
</div>

<style>
  .tool { display: flex; flex-direction: column; gap: var(--space-4); width: 100%; }
  .mode-toggle { display: flex; background: var(--bg-elevated); border-radius: var(--radius); padding: 3px; border: 1px solid var(--border-subtle); }
  .mode-btn { padding: var(--space-1) var(--space-3); border-radius: var(--radius-sm); font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-secondary); background: transparent; transition: all var(--transition) var(--ease-out); border: none; cursor: pointer; }
  .mode-btn:hover { color: var(--text-primary); }
  .mode-btn.active { background: var(--accent); color: var(--bg-base); box-shadow: var(--shadow-accent-sm); }
  .search-section { padding: var(--space-4); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .search-input { width: 100%; padding: var(--space-3); font-size: var(--text-lg); text-align: center; border: 1px solid var(--border-default); border-radius: var(--radius); background: var(--bg-base); color: var(--text-primary); outline: none; }
  .search-input:focus { border-color: var(--accent); box-shadow: var(--glow-focus); }
  .results { display: flex; flex-direction: column; gap: var(--space-2); }
  .char-card { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .char-display { width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; font-size: var(--text-3xl); background: var(--bg-elevated); border-radius: var(--radius); color: var(--text-primary); }
  .char-info { flex: 1; }
  .char-name { font-size: var(--text-base); font-weight: var(--font-semibold); color: var(--text-primary); }
  .char-meta { display: flex; gap: var(--space-2); margin-top: var(--space-1); }
  .category, .codepoint { font-size: var(--text-xs); padding: 2px 6px; background: var(--accent-soft); color: var(--accent); border-radius: var(--radius-sm); }
  .char-codes { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-2); font-size: var(--text-xs); color: var(--text-secondary); font-family: var(--font-mono); }
  .char-actions { display: flex; flex-direction: column; gap: var(--space-2); }
  .empty { text-align: center; padding: var(--space-8); color: var(--text-muted); }
  .common-section h3 { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--text-tertiary); margin-bottom: var(--space-3); text-transform: uppercase; letter-spacing: var(--tracking-wide); }
  .char-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(48px, 1fr)); gap: var(--space-2); }
  .char-btn { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; font-size: var(--text-xl); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius); cursor: pointer; transition: all var(--transition-fast) var(--ease-out); color: var(--text-primary); }
  .char-btn:hover { background: var(--accent-soft); border-color: var(--accent-dim); }
  @media (max-width: 768px) { .char-card { flex-direction: column; text-align: center; } .char-actions { flex-direction: row; } }
</style>
