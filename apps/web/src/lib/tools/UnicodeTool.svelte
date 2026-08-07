<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import ToolHeader from '$lib/ui/ToolHeader.svelte'
  import ToolShell from '$lib/ui/ToolShell.svelte'
  import { onMount } from 'svelte'
  import { COMMON_CHARS, analyzeChar, searchCommon } from 'tols-cli/core/unicode'

  const STORAGE_KEY = 'devutils-unicode-search'

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

  let searchChar = ''
  /** @type {UnicodeResult[]} */
  let results = []
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timeout = null

  /**
   * @param {string} text
   */
  function escapeHtml(text) {
    if (!text) return ''
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  function search() {
    if (!searchChar) {
      results = []
      return
    }

    const analyzed = analyzeChar(searchChar)
    const filtered = searchCommon(searchChar)

    results = analyzed ? [analyzed, ...filtered] : filtered
  }

  function debouncedSearch() {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      search()
      try {
        localStorage.setItem(STORAGE_KEY, searchChar)
      } catch (/** @type {any} */ e) {
        console.warn('Failed to save search to localStorage:', e)
      }
    }, 300)
  }

  onMount(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        searchChar = saved
        search()
      }
    } catch (/** @type {any} */ e) {
      console.warn('Failed to load search from localStorage:', e)
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
  <!-- toolId is deliberately empty: this tool escapes and unescapes text, while
       the CLI's `unicode info`/`unicode search` inspect a codepoint or query a
       character table — a different tool, so no command is the honest mirror
       (see BRIEF.md). -->
  <ToolHeader toolId="unicode" />

  <ToolShell toolId="">
    <div class="search-section">
      <input type="text" bind:value={searchChar} on:input={debouncedSearch} placeholder="Type a character or search..." class="search-input" maxlength="10" />
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
              {#if char.decimal && char.html && char.js}
                <div class="char-codes">
                  <span>Dec: {char.decimal}</span>
                  <span>HTML: {escapeHtml(char.html)}</span>
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
    {:else if searchChar}
      <div class="empty">No characters found</div>
    {/if}

    <div class="common-section">
      <h3>Common Characters</h3>
      <div class="char-grid">
        {#each COMMON_CHARS.slice(0, 24) as char}
          <button type="button" class="char-btn" on:click={() => { searchChar = char.char; search(); }} title="{char.name}">
            {char.char}
          </button>
        {/each}
      </div>
    </div>
  </ToolShell>
</div>

<style>
  .tool { display: flex; flex-direction: column; gap: var(--space-4); width: 100%; }
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
