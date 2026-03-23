<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount } from 'svelte'

  let paragraphs = 3
  let words = 50
  let startWithLorem = true
  let output = ''
  let timeout
  let saveTimeout

  const loremWords = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
    'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
    'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
    'exercitation', 'ullamco', 'laboris', 'nisi', 'ut', 'aliquip', 'ex', 'ea',
    'commodo', 'consequat', 'duis', 'aute', 'irure', 'dolor', 'in', 'reprehenderit',
    'in', 'voluptate', 'velit', 'esse', 'cillum', 'dolore', 'eu', 'fugiat',
    'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'non',
    'proident', 'sunt', 'in', 'culpa', 'qui', 'officia', 'deserunt', 'mollit',
    'anim', 'id', 'est', 'laborum'
  ]

  function loadState() {
    try {
      const savedParagraphs = localStorage.getItem('devutils-lorem-paragraphs')
      const savedWords = localStorage.getItem('devutils-lorem-words')
      const savedStartWithLorem = localStorage.getItem('devutils-lorem-startwith')
      if (savedParagraphs) paragraphs = parseInt(savedParagraphs, 10) || 3
      if (savedWords) words = parseInt(savedWords, 10) || 50
      if (savedStartWithLorem) startWithLorem = savedStartWithLorem === 'true'
    } catch (e) {
      console.warn('Failed to load from localStorage:', e)
    }
  }

  function saveState() {
    try {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        localStorage.setItem('devutils-lorem-paragraphs', paragraphs.toString())
        localStorage.setItem('devutils-lorem-words', words.toString())
        localStorage.setItem('devutils-lorem-startwith', startWithLorem.toString())
      }, 500)
    } catch (e) {
      console.warn('Failed to save to localStorage:', e)
    }
  }

  onMount(() => {
    loadState()
    generate()
  })

  function generate() {
    output = ''

    if (paragraphs < 1) {
      return
    }

    const paragraphTexts = []

    for (let p = 0; p < paragraphs; p++) {
      const paragraphWords = []
      const wordCount = words || Math.floor(Math.random() * 20) + 10

      for (let i = 0; i < wordCount; i++) {
        const wordIndex = (i + p * wordCount) % loremWords.length
        paragraphWords.push(loremWords[wordIndex])
      }

      const text = paragraphWords.join(' ')
      paragraphTexts.push(startWithLorem ? text.charAt(0).toUpperCase() + text.slice(1) + '.' : text)
    }

    output = paragraphTexts.join('\n\n')
    saveState()
  }

  function debouncedGenerate() {
    clearTimeout(timeout)
    timeout = setTimeout(generate, 150)
  }

  function clear() {
    output = ''
    paragraphs = 3
    words = 50
    startWithLorem = true
    try {
      localStorage.removeItem('devutils-lorem-paragraphs')
      localStorage.removeItem('devutils-lorem-words')
      localStorage.removeItem('devutils-lorem-startwith')
    } catch (e) {
      console.warn('Failed to clear localStorage:', e)
    }
  }

  function loadExample() {
    paragraphs = 3
    words = 50
    startWithLorem = true
    generate()
    saveState()
  }

  function incrementParagraphs() {
    if (paragraphs < 50) {
      paragraphs++
      generate()
    }
  }

  function decrementParagraphs() {
    if (paragraphs > 1) {
      paragraphs--
      generate()
    }
  }
</script>

<div class="tool">
  <div class="tool-bar">
    <div class="tool-title">
      <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
      <h1 class="tool-title-text">Lorem Ipsum Generator</h1>
    </div>
    
    <div class="tool-actions">
      <button class="btn-ghost" on:click={loadExample} title="Load Example">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M12 6v6l4 2"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
      </button>
      <button class="btn-ghost" on:click={clear} title="Clear">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  </div>

  <div class="controls-card">
    <div class="controls-grid">
      <div class="control-group">
        <span class="control-label">Paragraphs</span>
        <div class="counter">
          <button class="counter-btn" on:click={decrementParagraphs} disabled={paragraphs <= 1}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <input
            type="number"
            bind:value={paragraphs}
            on:input={debouncedGenerate}
            min="1"
            max="50"
            class="counter-input"
          />
          <button class="counter-btn" on:click={incrementParagraphs} disabled={paragraphs >= 50}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>

      <div class="control-group">
        <span class="control-label">Words per Paragraph</span>
        <input
          type="number"
          bind:value={words}
          on:input={debouncedGenerate}
          min="1"
          max="500"
          class="words-input"
        />
      </div>

      <div class="control-group toggle-group">
        <span class="control-label">Start with Lorem</span>
        <label class="toggle">
          <input
            type="checkbox"
            bind:checked={startWithLorem}
            on:change={debouncedGenerate}
          />
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-header">
      <span class="panel-title">Generated Text</span>
      <div class="header-actions">
        <span class="panel-badge">{paragraphs} paragraphs</span>
        {#if output}
          <CopyButton text={output} />
        {/if}
      </div>
    </div>
    {#if output}
      <div class="output-content">
        {output}
      </div>
    {:else}
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        <span>Click generate to create lorem ipsum</span>
      </div>
    {/if}
  </div>

  <div class="info-bar">
    <div class="info-item">
      <span class="info-label">Format:</span>
      <span class="info-value">Plain Text</span>
    </div>
    <div class="info-item">
      <span class="info-label">Starting:</span>
      <span class="badge badge-accent">{startWithLorem ? 'Lorem ipsum...' : 'Random words'}</span>
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

  .controls-card {
    padding: var(--space-4);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
  }

  .controls-grid {
    display: flex;
    align-items: flex-end;
    gap: var(--space-6);
    flex-wrap: wrap;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .control-label {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
  }

  .counter {
    display: flex;
    align-items: center;
    gap: 0;
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .counter-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--bg-surface);
    color: var(--text-secondary);
    border: none;
    transition: all var(--transition);
  }

  .counter-btn:hover:not(:disabled) {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .counter-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .counter-btn:first-child {
    border-right: 1px solid var(--border-subtle);
  }

  .counter-btn:last-child {
    border-left: 1px solid var(--border-subtle);
  }

  .counter-input {
    width: 60px;
    padding: var(--space-2);
    text-align: center;
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    font-family: var(--font-mono);
    background: var(--bg-surface);
    border: none;
    color: var(--text-primary);
  }

  .counter-input:focus {
    outline: none;
  }

  .counter-input::-webkit-inner-spin-button,
  .counter-input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .words-input {
    width: 100px;
    padding: var(--space-2) var(--space-3);
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius);
    color: var(--text-primary);
    font-size: var(--text-sm);
    font-family: var(--font-mono);
    text-align: center;
    transition: all var(--transition);
  }

  .words-input:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-muted);
  }

  .toggle-group {
    flex-direction: row;
    align-items: center;
    gap: var(--space-3);
    margin-left: auto;
  }

  .toggle {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 26px;
    cursor: pointer;
  }

  .toggle input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    inset: 0;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-full);
    transition: all var(--transition);
  }

  .toggle-slider::before {
    content: '';
    position: absolute;
    height: 20px;
    width: 20px;
    left: 2px;
    bottom: 2px;
    background: var(--text-tertiary);
    border-radius: 50%;
    transition: all var(--transition);
  }

  .toggle input:checked + .toggle-slider {
    background: var(--accent);
    border-color: var(--accent);
  }

  .toggle input:checked + .toggle-slider::before {
    transform: translateX(22px);
    background: white;
  }

  .toggle input:focus + .toggle-slider {
    box-shadow: 0 0 0 3px var(--accent-muted);
  }

  .panel {
    display: flex;
    flex-direction: column;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: var(--bg-elevated);
    border-bottom: 1px solid var(--border-subtle);
  }

  .panel-title {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-left: auto;
  }

  .panel-badge {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    padding: 2px 6px;
    background: var(--bg-surface);
    border-radius: var(--radius-sm);
  }

  .output-content {
    padding: var(--space-5);
    background: var(--bg-base);
    font-size: var(--text-base);
    line-height: 1.8;
    white-space: pre-wrap;
    color: var(--text-primary);
    min-height: 200px;
    max-height: 500px;
    overflow-y: auto;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-8);
    color: var(--text-tertiary);
    font-size: var(--text-sm);
    min-height: 200px;
  }

  .empty-icon {
    width: 32px;
    height: 32px;
    opacity: 0.5;
  }

  .info-bar {
    display: flex;
    align-items: center;
    gap: var(--space-6);
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

    .controls-grid {
      flex-direction: column;
      align-items: flex-start;
    }

    .toggle-group {
      margin-left: 0;
      width: 100%;
      justify-content: space-between;
    }

    .info-bar {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>