<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import ToolHeader from '$lib/ui/ToolHeader.svelte'
  import FactStrip from '$lib/ui/FactStrip.svelte'
  import ToolShell from '$lib/ui/ToolShell.svelte'
  import PanelGroup from '$lib/ui/PanelGroup.svelte'
  import Panel from '$lib/ui/Panel.svelte'
  import Button from '$lib/ui/Button.svelte'
  import { onMount, onDestroy } from 'svelte'
  import { generate as generateLorem } from 'tols-cli/core/lorem'

  let paragraphs = 3
  let words = 50
  let startWithLorem = true
  let output = ''
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeout
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let saveTimeout

  // Declared once so the strip and the ⌘⇧C payload cannot drift. The CLI starts
  // with the classic opener by default and opens with `--random-start` when the
  // toggle is off (packages/tols/src/tools/lorem.js).
  $: cliFlags = startWithLorem
    ? { paragraphs, words }
    : { paragraphs, words, 'random-start': true }

  function loadState() {
    try {
      const savedParagraphs = localStorage.getItem('devutils-lorem-paragraphs')
      const savedWords = localStorage.getItem('devutils-lorem-words')
      const savedStartWithLorem = localStorage.getItem('devutils-lorem-startwith')
      if (savedParagraphs) paragraphs = parseInt(savedParagraphs, 10) || 3
      if (savedWords) words = parseInt(savedWords, 10) || 50
      if (savedStartWithLorem) startWithLorem = savedStartWithLorem === 'true'
    } catch (/** @type {any} */ e) {
      console.warn('Failed to load from localStorage:', e)
    }
  }

  function saveState() {
    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem('devutils-lorem-paragraphs', paragraphs.toString())
        localStorage.setItem('devutils-lorem-words', words.toString())
        localStorage.setItem('devutils-lorem-startwith', startWithLorem.toString())
      } catch (/** @type {any} */ e) {
        console.warn('Failed to save to localStorage:', e)
      }
    }, 500)
  }

  onMount(() => {
    loadState()
    generate()
  })

  function generate() {
    output = generateLorem({ paragraphs, words, startWithLorem })
  }

  function debouncedGenerate() {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      generate()
      saveState()
    }, 150)
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
    } catch (/** @type {any} */ e) {
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

  onDestroy(() => {
    clearTimeout(timeout)
    clearTimeout(saveTimeout)
  })
</script>

<div class="tool">
  <ToolHeader toolId="lorem" />

  <ToolShell
    toolId="lorem"
    action="gen"
    flags={cliFlags}
    output={output}
    onRun={generate}
    let:copyNotice
  >
    <div class="controls-card">
      <div class="controls-grid">
        <div class="control-group">
          <span class="control-label">Paragraphs</span>
          <div class="counter">
            <button type="button" class="counter-btn" on:click={decrementParagraphs} disabled={paragraphs <= 1}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            <input
              type="number"
              bind:value={paragraphs}
              on:input={() => {
                clearTimeout(timeout)
                timeout = setTimeout(() => {
                  generate()
                  saveState()
                }, 150)
              }}
              min="1"
              max="50"
              class="counter-input"
            />
            <button type="button" class="counter-btn" on:click={incrementParagraphs} disabled={paragraphs >= 50}>
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
            on:input={() => {
              clearTimeout(timeout)
              timeout = setTimeout(() => {
                generate()
                saveState()
              }, 150)
            }}
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
              on:change={() => {
                clearTimeout(timeout)
                timeout = setTimeout(() => {
                  generate()
                  saveState()
                }, 150)
              }}
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>

    <!-- columns={1}: generated prose is a long unbroken string that would wrap
         badly in half a width, so the output reads top-to-bottom. -->
    <PanelGroup columns={1}>
      <Panel
        label="Generated Text"
        meta={copyNotice || `${paragraphs} paragraphs`}
        data-testid="lorem-output-panel"
      >
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
      </Panel>
    </PanelGroup>

    <FactStrip
      facts={[
        { label: 'Format', value: 'Plain Text' },
        { label: 'Starting', value: startWithLorem ? 'Lorem ipsum...' : 'Random words', presentation: 'accent' }
      ]}
    />

    <svelte:fragment slot="rail">
      <Button on:click={loadExample} aria-label="Load Example" title="Load Example">example</Button>
      <Button on:click={clear} aria-label="Clear" title="Clear">clear</Button>
    </svelte:fragment>

    <svelte:fragment slot="rail-end">
      {#if output}<CopyButton text={output} />{/if}
    </svelte:fragment>
  </ToolShell>
</div>

<style>
  .tool {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    width: 100%;
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
    transition: all var(--transition) var(--ease-out);
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
    transition: all var(--transition) var(--ease-out);
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
    transition: all var(--transition) var(--ease-out);
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
    transition: all var(--transition) var(--ease-out);
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

  @media (max-width: 768px) {
    .controls-grid {
      flex-direction: column;
      align-items: flex-start;
    }

    .toggle-group {
      margin-left: 0;
      width: 100%;
      justify-content: space-between;
    }
  }
</style>