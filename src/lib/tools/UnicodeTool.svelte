<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount } from 'svelte'

  let searchChar = ''
  let results = []
  let timeout = null

  const COMMON_CHARS = [
    { char: '©', name: 'Copyright Sign', category: 'Symbol', codepoint: 'U+00A9' },
    { char: '®', name: 'Registered Sign', category: 'Symbol', codepoint: 'U+00AE' },
    { char: '™', name: 'Trade Mark Sign', category: 'Symbol', codepoint: 'U+2122' },
    { char: '°', name: 'Degree Sign', category: 'Symbol', codepoint: 'U+00B0' },
    { char: '±', name: 'Plus-Minus Sign', category: 'Symbol', codepoint: 'U+00B1' },
    { char: '×', name: 'Multiplication Sign', category: 'Math', codepoint: 'U+00D7' },
    { char: '÷', name: 'Division Sign', category: 'Math', codepoint: 'U+00F7' },
    { char: '→', name: 'Right Arrow', category: 'Arrow', codepoint: 'U+2192' },
    { char: '←', name: 'Left Arrow', category: 'Arrow', codepoint: 'U+2190' },
    { char: '↑', name: 'Up Arrow', category: 'Arrow', codepoint: 'U+2191' },
    { char: '↓', name: 'Down Arrow', category: 'Arrow', codepoint: 'U+2193' },
    { char: '•', name: 'Bullet', category: 'Punctuation', codepoint: 'U+2022' },
    { char: '…', name: 'Horizontal Ellipsis', category: 'Punctuation', codepoint: 'U+2026' },
    { char: '—', name: 'Em Dash', category: 'Punctuation', codepoint: 'U+2014' },
    { char: '–', name: 'En Dash', category: 'Punctuation', codepoint: 'U+2013' },
    { char: '€', name: 'Euro Sign', category: 'Currency', codepoint: 'U+20AC' },
    { char: '£', name: 'Pound Sign', category: 'Currency', codepoint: 'U+00A3' },
    { char: '¥', name: 'Yen Sign', category: 'Currency', codepoint: 'U+00A5' },
    { char: '√', name: 'Square Root', category: 'Math', codepoint: 'U+221A' },
    { char: '∞', name: 'Infinity', category: 'Math', codepoint: 'U+221E' },
    { char: '≈', name: 'Almost Equal', category: 'Math', codepoint: 'U+2248' },
    { char: '≠', name: 'Not Equal', category: 'Math', codepoint: 'U+2260' },
    { char: '≤', name: 'Less-Equal', category: 'Math', codepoint: 'U+2264' },
    { char: '≥', name: 'Greater-Equal', category: 'Math', codepoint: 'U+2265' },
    { char: '✓', name: 'Check Mark', category: 'Symbol', codepoint: 'U+2713' },
    { char: '✗', name: 'Ballot X', category: 'Symbol', codepoint: 'U+2717' },
    { char: '★', name: 'Black Star', category: 'Symbol', codepoint: 'U+2605' },
    { char: '☆', name: 'White Star', category: 'Symbol', codepoint: 'U+2606' },
    { char: '♥', name: 'Black Heart', category: 'Symbol', codepoint: 'U+2665' },
    { char: '♦', name: 'Black Diamond', category: 'Symbol', codepoint: 'U+2666' },
    { char: '♠', name: 'Black Spade', category: 'Symbol', codepoint: 'U+2660' },
    { char: '♣', name: 'Black Club', category: 'Symbol', codepoint: 'U+2663' },
    { char: 'α', name: 'Greek Alpha', category: 'Greek', codepoint: 'U+03B1' },
    { char: 'β', name: 'Greek Beta', category: 'Greek', codepoint: 'U+03B2' },
    { char: 'π', name: 'Greek Pi', category: 'Greek', codepoint: 'U+03C0' },
    { char: 'Σ', name: 'Greek Sigma', category: 'Greek', codepoint: 'U+03A3' },
    { char: 'Ω', name: 'Greek Omega', category: 'Greek', codepoint: 'U+03A9' },
    { char: 'µ', name: 'Micro Sign', category: 'Symbol', codepoint: 'U+00B5' },
    { char: '§', name: 'Section Sign', category: 'Symbol', codepoint: 'U+00A7' },
    { char: '¶', name: 'Pilcrow Sign', category: 'Symbol', codepoint: 'U+00B6' },
    { char: '†', name: 'Dagger', category: 'Symbol', codepoint: 'U+2020' },
    { char: '‡', name: 'Double Dagger', category: 'Symbol', codepoint: 'U+2021' },
  ]

  function analyzeChar(char) {
    if (!char) return null
    const code = char.codePointAt(0)
    if (code === undefined) return null
    return {
      char,
      name: getCharName(char),
      category: 'Character',
      codepoint: 'U+' + code.toString(16).toUpperCase().padStart(4, '0'),
      decimal: code,
      hex: '0x' + code.toString(16).toUpperCase(),
      html: `&#${code};`,
      css: `\\${code.toString(16).toUpperCase()}`,
      js: `\\u${code.toString(16).toUpperCase().padStart(4, '0')}`
    }
  }

  function getCharName(char) {
    try {
      return char.toUpperCase() + ' Character'
    } catch {
      return 'Unknown Character'
    }
  }

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

    const char = searchChar.charAt(0)
    const analyzed = analyzeChar(char)
    
    const filtered = COMMON_CHARS.filter(c => 
      c.name.toLowerCase().includes(searchChar.toLowerCase()) ||
      c.category.toLowerCase().includes(searchChar.toLowerCase())
    )

    results = analyzed ? [analyzed, ...filtered] : filtered
  }

  function debouncedSearch() {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(search, 300)
  }

  function copyCodepoint(char) {
    const code = char.codePointAt(0)
    return 'U+' + code.toString(16).toUpperCase().padStart(4, '0')
  }
</script>

<div class="tool">
  <div class="tool-header">
    <div class="tool-meta">
      <h1 class="tool-name">Unicode Inspector</h1>
      <p class="tool-desc">Explore Unicode characters and their properties</p>
    </div>
  </div>

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
            {#if char.decimal}
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
        <button class="char-btn" on:click={() => { searchChar = char.char; search(); }} title="{char.name}">
          {char.char}
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
  .char-btn { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; font-size: var(--text-xl); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius); cursor: pointer; transition: all var(--transition-fast); color: var(--text-primary); }
  .char-btn:hover { background: var(--accent-soft); border-color: var(--accent-dim); }
  @media (max-width: 768px) { .char-card { flex-direction: column; text-align: center; } .char-actions { flex-direction: row; } }
</style>
