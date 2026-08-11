<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import ShareButton from '$lib/components/ShareButton.svelte'
  import ToolHeader from '$lib/ui/ToolHeader.svelte'
  import ToolShell from '$lib/ui/ToolShell.svelte'
  import PanelGroup from '$lib/ui/PanelGroup.svelte'
  import Panel from '$lib/ui/Panel.svelte'
  import Button from '$lib/ui/Button.svelte'
  import { readShareFragment } from '$lib/utils/share.js'
  import { fileDrop } from '$lib/utils/fileDrop.js'
  import { onMount, onDestroy } from 'svelte'
  import { myersDiff, computeWordDiff, similarityScore, resetCache } from 'tols-cli/core/diff'

  const EXAMPLE_LEFT = `function greet(name) {
  return "Hello, " + name + "!";
}

const user = "World";
console.log(greet(user));`

  const EXAMPLE_RIGHT = `function greet(name) {
  return \`Hello, \${name}!\`;
}

const user = "Universe";
console.log(greet(user));`

  let leftInput = EXAMPLE_LEFT
  let rightInput = EXAMPLE_RIGHT
  let mode = 'split'

  /**
   * @typedef {{
   *   type: 'equal' | 'delete' | 'insert',
   *   text: string
   * }} WordDiffItem
   */

  /**
   * @typedef {{
   *   type: 'same' | 'modified' | 'removed' | 'added',
   *   left: string,
   *   right: string,
   *   oldLineNum: number | null,
   *   newLineNum: number | null,
   *   wordDiff: WordDiffItem[],
   *   oldWordDiff: WordDiffItem[] | null,
   *   newWordDiff: WordDiffItem[] | null
   * }} DiffItem
   */

  /**
   * @typedef {(
   *   | { type: 'equal', oldIndex: number, newIndex: number, oldLine: string, newLine: string }
   *   | { type: 'delete', oldIndex: number, newIndex: null, oldLine: string, newLine: null }
   *   | { type: 'insert', oldIndex: null, newIndex: number, oldLine: null, newLine: string }
   * )} MyersOp
   */

  /**
   * @typedef {(
   *   | { type: 'equal', oldWord: string, newWord: string }
   *   | { type: 'delete', oldWord: string, newWord?: undefined }
   *   | { type: 'insert', oldWord?: undefined, newWord: string }
   * )} LcsOp
   */

  /** @type {DiffItem[]} */
  let diff = []
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timeout = null
  /** @type {ReturnType<typeof setTimeout> | null} */
  let saveTimeout = null
  let isTruncated = false
  let isInitialized = false

  const MAX_LINES = 10000
  const MAX_CHARS = 1000000

  // The CLI takes the two sides as positional files and is a single `run`
  // action, so split/unified are view modes, not CLI modes — the action does
  // not change. The output feeds both ⌘⇧O and the rail copy button, so the two
  // cannot disagree.
  $: diffText = getDiffContent()

  function getDiffContent() {
    return diff.map(d => {
      if (d.type === 'removed') return `- ${d.left}`
      if (d.type === 'added') return `+ ${d.right}`
      if (d.type === 'modified') return `- ${d.left}\n+ ${d.right}`
      return ` ${d.left}`
    }).join('\n')
  }

  function loadState() {
    try {
      const savedLeft = localStorage.getItem('devutils-diff-left')
      const savedRight = localStorage.getItem('devutils-diff-right')
      if (savedLeft !== null) {
        leftInput = savedLeft
      } else {
        leftInput = EXAMPLE_LEFT
      }
      if (savedRight !== null) {
        rightInput = savedRight
      } else {
        rightInput = EXAMPLE_RIGHT
      }
    } catch (/** @type {any} */ e) {
      console.warn('Failed to load state from localStorage:', e)
    }
  }

  function saveState() {
    if (!isInitialized) return
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem('devutils-diff-left', leftInput)
        localStorage.setItem('devutils-diff-right', rightInput)
      } catch (/** @type {any} */ e) {
        console.warn('Failed to save state to localStorage:', e)
      }
    }, 500)
  }

  onMount(() => {
    // A shared link takes precedence over locally saved state
    const shared = readShareFragment()
    if (shared && (typeof shared.left === 'string' || typeof shared.right === 'string')) {
      if (typeof shared.left === 'string') leftInput = shared.left
      if (typeof shared.right === 'string') rightInput = shared.right
      if (shared.mode === 'split' || shared.mode === 'unified') mode = shared.mode
    } else {
      loadState()
    }
    // Mark as initialized - reactive block will trigger initial computeDiff
    isInitialized = true
  })

  onDestroy(() => {
    if (timeout) clearTimeout(timeout)
    if (saveTimeout) clearTimeout(saveTimeout)
  })

  // Reactive: trigger debounced diff computation when inputs change
  $: if (isInitialized && leftInput !== undefined && rightInput !== undefined) {
    debouncedCompute()
  }

  function computeDiff() {
    resetCache()
    isTruncated = false

    if (!leftInput && !rightInput) {
      diff = []
      return
    }

    let oldLines = leftInput ? leftInput.split('\n') : ['']
    let newLines = rightInput ? rightInput.split('\n') : ['']

    const totalChars = leftInput.length + rightInput.length
    if (totalChars > MAX_CHARS) {
      console.warn('Input too large, truncating to', MAX_CHARS, 'characters')
      isTruncated = true
      const leftRatio = leftInput.length / totalChars
      const maxLeftChars = Math.floor(MAX_CHARS * leftRatio)
      const maxRightChars = MAX_CHARS - maxLeftChars
      oldLines = leftInput.slice(0, maxLeftChars).split('\n')
      newLines = rightInput.slice(0, maxRightChars).split('\n')
    }

    if (oldLines.length > MAX_LINES || newLines.length > MAX_LINES) {
      console.warn('Input too large, truncating to', MAX_LINES, 'lines')
      isTruncated = true
      oldLines = oldLines.slice(0, MAX_LINES)
      newLines = newLines.slice(0, MAX_LINES)
    }

    const normalizedOldLines = oldLines.map(line => line || '')
    const normalizedNewLines = newLines.map(line => line || '')

    const edits = myersDiff(normalizedOldLines, normalizedNewLines)
    /** @type {DiffItem[]} */
    const result = []

    let oldLineNum = 1
    let newLineNum = 1

    const MODIFIED_THRESHOLD = 0.3

    for (let i = 0; i < edits.length; i++) {
      const edit = edits[i]

      if (edit.type === 'equal') {
        result.push({
          type: 'same',
          left: edit.oldLine,
          right: edit.newLine,
          oldLineNum: oldLineNum++,
          newLineNum: newLineNum++,
          wordDiff: computeWordDiff(edit.oldLine, edit.newLine),
          oldWordDiff: null,
          newWordDiff: null
        })
      } else if (edit.type === 'delete') {
        const nextEdit = edits[i + 1]
        const isModified = nextEdit &&
          nextEdit.type === 'insert' &&
          similarityScore(edit.oldLine, nextEdit.newLine) >= MODIFIED_THRESHOLD

        if (nextEdit && nextEdit.type === 'insert' && isModified) {
          const wordDiff = computeWordDiff(edit.oldLine, nextEdit.newLine)
          result.push({
            type: 'modified',
            left: edit.oldLine,
            right: nextEdit.newLine,
            oldLineNum: oldLineNum++,
            newLineNum: newLineNum++,
            wordDiff,
            oldWordDiff: wordDiff.filter(w => w.type === 'equal' || w.type === 'delete'),
            newWordDiff: wordDiff.filter(w => w.type === 'equal' || w.type === 'insert')
          })
          i++
        } else {
          /** @type {WordDiffItem[]} */
          const wordDiff = [{ type: 'delete', text: edit.oldLine }]
          result.push({
            type: 'removed',
            left: edit.oldLine,
            right: '',
            oldLineNum: oldLineNum++,
            newLineNum: null,
            wordDiff,
            oldWordDiff: wordDiff,
            newWordDiff: null
          })
        }
      } else if (edit.type === 'insert') {
        /** @type {WordDiffItem[]} */
        const wordDiff = [{ type: 'insert', text: edit.newLine }]
        result.push({
          type: 'added',
          left: '',
          right: edit.newLine,
          oldLineNum: null,
          newLineNum: newLineNum++,
          wordDiff,
          oldWordDiff: null,
          newWordDiff: wordDiff
        })
      }
    }

    diff = result
  }

  function debouncedCompute() {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      computeDiff()
      saveState()
    }, 300)
  }

  function clear() {
    leftInput = ''
    rightInput = ''
    diff = []
    isTruncated = false
    try {
      localStorage.removeItem('devutils-diff-left')
      localStorage.removeItem('devutils-diff-right')
    } catch (/** @type {any} */ e) {
      console.warn('Failed to clear localStorage:', e)
    }
  }

  function loadExample() {
    leftInput = EXAMPLE_LEFT
    rightInput = EXAMPLE_RIGHT
    debouncedCompute()
  }

  function swap() {
    const temp = leftInput
    leftInput = rightInput
    rightInput = temp
    debouncedCompute()
  }
</script>

<div class="tool">
  <ToolHeader toolId="diff" />

  <ToolShell
    toolId="diff"
    action="run"
    output={diffText}
    onRun={computeDiff}
  >
    <div class="segmented">
      <button type="button" class="segment" class:active={mode === 'split'} on:click={() => mode = 'split'}>Split</button>
      <button type="button" class="segment" class:active={mode === 'unified'} on:click={() => mode = 'unified'}>Unified</button>
    </div>

    <PanelGroup>
      <Panel label={mode === 'split' ? 'Original' : 'Original Text'} meta="{leftInput.length} chars">
        <textarea
          bind:value={leftInput}
          on:input={debouncedCompute}
          use:fileDrop={{ onText: (text) => { leftInput = text } }}
          placeholder="Paste original text..."
          class="diff-textarea"
          aria-label="Original text input"
        ></textarea>
      </Panel>

      <Panel label={mode === 'split' ? 'Modified' : 'Modified Text'} meta="{rightInput.length} chars">
        <textarea
          bind:value={rightInput}
          on:input={debouncedCompute}
          use:fileDrop={{ onText: (text) => { rightInput = text } }}
          placeholder="Paste modified text..."
          class="diff-textarea"
          aria-label="Modified text input"
        ></textarea>
      </Panel>
    </PanelGroup>

    {#if mode === 'split'}
      <PanelGroup columns={1}>
        <Panel label="Word-Level Comparison" data-testid="diff-result">
          {#if isTruncated}
            <div class="truncation-warning">
              <span class="warning-icon">⚠️</span>
              <span>Input truncated due to size limits. Showing first {MAX_LINES.toLocaleString()} lines.</span>
            </div>
          {/if}
          <div class="diff-grid" role="table" aria-label="Diff comparison results">
            {#each diff as item, idx}
              <div class="diff-row {item.type}" role="row">
                <div class="line-num" role="cell">{item.oldLineNum ?? ''}</div>
                <div class="line-content old" role="cell">
                  {#if item.type === 'added'}
                    <span class="empty-line" aria-label="Empty line"></span>
                  {:else if item.oldWordDiff}
                    {#each item.oldWordDiff as word}
                      {#if word.type === 'delete'}
                        <span class="word-delete" aria-label="Deleted text">
                          <span class="change-icon">−</span>{word.text}
                        </span>
                      {:else}
                        <span>{word.text}</span>
                      {/if}
                    {/each}
                  {:else}
                    {item.left || ' '}
                  {/if}
                </div>
                <div class="line-num" role="cell">{item.newLineNum ?? ''}</div>
                <div class="line-content new" role="cell">
                  {#if item.type === 'removed'}
                    <span class="empty-line" aria-label="Empty line"></span>
                  {:else if item.newWordDiff}
                    {#each item.newWordDiff as word}
                      {#if word.type === 'insert'}
                        <span class="word-insert" aria-label="Inserted text">
                          <span class="change-icon">+</span>{word.text}
                        </span>
                      {:else}
                        <span>{word.text}</span>
                      {/if}
                    {/each}
                  {:else}
                    {item.right || ' '}
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </Panel>
      </PanelGroup>
    {:else}
      <PanelGroup columns={1}>
        <Panel label="Unified Diff" data-testid="unified-result">
          {#if isTruncated}
            <div class="truncation-warning">
              <span class="warning-icon">⚠️</span>
              <span>Input truncated due to size limits. Showing first {MAX_LINES.toLocaleString()} lines.</span>
            </div>
          {/if}
          <div class="unified-content">
            {#each diff as item}
              {#if item.type === 'removed'}
                <div class="unified-line removed" role="row" aria-label="Removed line {item.oldLineNum}">
                  <span class="line-marker" aria-hidden="true">−</span>
                  <span class="line-text">
                    {#if item.oldWordDiff}
                      {#each item.oldWordDiff as word}
                        {#if word.type === 'delete'}
                          <span class="word-delete">{word.text}</span>
                        {:else}
                          <span>{word.text}</span>
                        {/if}
                      {/each}
                    {:else}
                      {item.left}
                    {/if}
                  </span>
                </div>
              {:else if item.type === 'added'}
                <div class="unified-line added" role="row" aria-label="Added line {item.newLineNum}">
                  <span class="line-marker" aria-hidden="true">+</span>
                  <span class="line-text">
                    {#if item.newWordDiff}
                      {#each item.newWordDiff as word}
                        {#if word.type === 'insert'}
                          <span class="word-insert">{word.text}</span>
                        {:else}
                          <span>{word.text}</span>
                        {/if}
                      {/each}
                    {:else}
                      {item.right}
                    {/if}
                  </span>
                </div>
              {:else if item.type === 'modified'}
                <div class="unified-line removed modified-pair" role="row" aria-label="Modified line {item.oldLineNum} (old)">
                  <span class="line-marker" aria-hidden="true">−</span>
                  <span class="line-text">
                    {#if item.oldWordDiff}
                      {#each item.oldWordDiff as word}
                        {#if word.type === 'delete'}
                          <span class="word-delete">{word.text}</span>
                        {:else}
                          <span>{word.text}</span>
                        {/if}
                      {/each}
                    {:else}
                      {item.left}
                    {/if}
                  </span>
                </div>
                <div class="unified-line added modified-pair" role="row" aria-label="Modified line {item.newLineNum} (new)">
                  <span class="line-marker" aria-hidden="true">+</span>
                  <span class="line-text">
                    {#if item.newWordDiff}
                      {#each item.newWordDiff as word}
                        {#if word.type === 'insert'}
                          <span class="word-insert">{word.text}</span>
                        {:else}
                          <span>{word.text}</span>
                        {/if}
                      {/each}
                    {:else}
                      {item.right}
                    {/if}
                  </span>
                </div>
              {:else}
                <div class="unified-line same" role="row" aria-label="Unchanged line {item.oldLineNum}">
                  <span class="line-marker" aria-hidden="true"> </span>
                  <span class="line-text">{item.left}</span>
                </div>
              {/if}
            {/each}
          </div>
        </Panel>
      </PanelGroup>
    {/if}

    <svelte:fragment slot="rail">
      <Button on:click={swap} aria-label="Swap Sides" title="Swap Sides">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12m0-12 4 4m-4-4-4 4"/></svg>
        swap
      </Button>
      <Button on:click={loadExample} aria-label="Load Example" title="Load Example">example</Button>
      <Button on:click={clear} aria-label="Clear" title="Clear">clear</Button>
    </svelte:fragment>

    <svelte:fragment slot="rail-end">
      {#if diffText}<CopyButton text={diffText} />{/if}
      <ShareButton getState={() => ({ left: leftInput, right: rightInput, mode })} />
    </svelte:fragment>
  </ToolShell>
</div>

<style>
  .tool {
    display: flex;
    flex-direction: column;
    gap: 0;
    width: 100%;
  }

  .segmented { display: flex; background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius); padding: 2px; }
  .segment { display: flex; align-items: center; padding: var(--space-1) var(--space-3); border-radius: var(--radius-sm); font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-secondary); background: transparent; border: none; cursor: pointer; transition: all var(--transition-fast) var(--ease-out); }
  .segment:hover { color: var(--text-primary); }
  .segment.active { background: var(--bg-surface); color: var(--text-primary); border: 1px solid var(--border-default); }

  .diff-textarea { flex: 1; min-height: 150px; padding: var(--space-3); border: none; background: var(--bg-surface); color: var(--text-primary); font-family: var(--font-mono); font-size: var(--text-sm); line-height: var(--leading-snug); resize: vertical; outline: none; }
  .diff-textarea::placeholder { color: var(--text-muted); }

  .diff-grid { display: grid; grid-template-columns: auto 1fr auto 1fr; gap: 1px; background: var(--border-subtle); }
  .diff-row { display: contents; }
  .diff-row .line-num { padding: var(--space-1) var(--space-2); background: var(--bg-elevated); font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-muted); text-align: right; min-width: 40px; }
  .diff-row .line-content { padding: var(--space-1) var(--space-3); font-family: var(--font-mono); font-size: var(--text-sm); white-space: pre-wrap; word-break: break-all; }
  .diff-row.same .line-content { background: var(--bg-surface); color: var(--text-primary); }
  .diff-row.removed .line-content.old { background: var(--diff-remove-bg); color: var(--error); border-left: 3px solid var(--error); }
  .diff-row.added .line-content.new { background: var(--diff-add-bg); color: var(--success); border-left: 3px solid var(--success); }
  .diff-row.modified .line-content.old { background: var(--diff-remove-bg-subtle); border-left: 3px solid var(--warning); }
  .diff-row.modified .line-content.new { background: var(--diff-add-bg-subtle); border-left: 3px solid var(--warning); }

  .unified-content { max-height: 400px; overflow: auto; }
  .unified-line { display: flex; font-family: var(--font-mono); font-size: var(--text-sm); }
  .line-marker { width: 24px; padding: var(--space-1) var(--space-2); background: var(--bg-elevated); text-align: center; flex-shrink: 0; }
  .line-text { flex: 1; padding: var(--space-1) var(--space-3); white-space: pre-wrap; word-break: break-all; }
  .unified-line.same { background: var(--bg-surface); }
  .unified-line.removed { background: var(--diff-remove-bg); border-left: 3px solid var(--error); }
  .unified-line.removed .line-marker { color: var(--error); font-weight: bold; }
  .unified-line.added { background: var(--diff-add-bg); border-left: 3px solid var(--success); }
  .unified-line.added .line-marker { color: var(--success); font-weight: bold; }
  .unified-line.modified-pair { position: relative; }
  .unified-line.modified-pair::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 1px;
    background: var(--border-subtle);
  }

  /* Word-level diff styles */
  .word-delete {
    background: var(--diff-word-remove-bg);
    text-decoration: line-through;
    border-radius: 2px;
    padding: 1px 3px;
    color: var(--error);
    border: 1px dashed var(--error);
  }
  .word-insert {
    background: var(--diff-word-add-bg);
    border-radius: 2px;
    padding: 1px 3px;
    color: var(--success);
    border: 1px solid var(--success);
  }
  .change-icon {
    font-weight: bold;
    margin-right: 2px;
    opacity: 0.8;
  }
  .empty-line {
    display: inline-block;
    min-height: 1.2em;
  }
  .truncation-warning {
    padding: var(--space-2) var(--space-4);
    background: var(--bg-warning);
    border-bottom: 1px solid var(--border-subtle);
    font-size: var(--text-sm);
    color: var(--text-warning);
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .warning-icon {
    font-size: var(--text-base);
  }

  @media (max-width: 768px) {
    .diff-grid { grid-template-columns: auto 1fr; }
  }
</style>