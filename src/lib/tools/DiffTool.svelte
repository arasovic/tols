<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount, onDestroy } from 'svelte'

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
  let diff = []
  let timeout = null
  let saveTimeout = null
  let isTruncated = false
  let isInitialized = false

  const MAX_LINES = 10000
  const MAX_CHARS = 1000000

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
    } catch (e) {
      console.warn('Failed to load state from localStorage:', e)
    }
  }

  function saveState() {
    if (!isInitialized) return
    try {
      if (saveTimeout) clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        localStorage.setItem('devutils-diff-left', leftInput)
        localStorage.setItem('devutils-diff-right', rightInput)
      }, 500)
    } catch (e) {
      console.warn('Failed to save state to localStorage:', e)
    }
  }

  onMount(() => {
    loadState()
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

  const diffCache = new Map()

  function getCacheKey(oldLine, newLine) {
    return `${oldLine}\x00${newLine}`
  }

  /**
   * Myers diff algorithm - finds shortest edit script
   * Returns an array of operations: { type: 'equal'|'insert'|'delete', oldIndex, newIndex, line }
   */
  function myersDiff(oldLines, newLines) {
    const n = oldLines.length
    const m = newLines.length
    const max = n + m

    const v = new Map()
    const trace = []

    v.set(1, 0)

    for (let d = 0; d <= max; d++) {
      trace.push(new Map(v))

      for (let k = -d; k <= d; k += 2) {
        let x

        if (k === -d || (k !== d && v.get(k - 1) < v.get(k + 1))) {
          x = v.get(k + 1)
        } else {
          x = v.get(k - 1) + 1
        }

        let y = x - k

        while (x < n && y < m && oldLines[x] === newLines[y]) {
          x++
          y++
        }

        v.set(k, x)

        if (x >= n && y >= m) {
          return backtrack(trace, oldLines, newLines, d, n, m)
        }
      }
    }

    return backtrack(trace, oldLines, newLines, max, n, m)
  }

  function backtrack(trace, oldLines, newLines, d, n, m) {
    const edits = []
    let x = n
    let y = m

    for (let d_idx = d; d_idx > 0; d_idx--) {
      const v = trace[d_idx]
      const k = x - y

      let prevK
      const prevV = trace[d_idx - 1]

      if (k === -d_idx || (k !== d_idx && prevV.get(k - 1) < prevV.get(k + 1))) {
        prevK = k + 1
      } else {
        prevK = k - 1
      }

      const prevX = prevV.get(prevK)
      const prevY = prevX - prevK

      while (x > prevX && y > prevY) {
        x--
        y--
        edits.unshift({ type: 'equal', oldIndex: x, newIndex: y, oldLine: oldLines[x], newLine: newLines[y] })
      }

      if (x > prevX) {
        x--
        edits.unshift({ type: 'delete', oldIndex: x, newIndex: null, oldLine: oldLines[x], newLine: null })
      } else if (y > prevY) {
        y--
        edits.unshift({ type: 'insert', oldIndex: null, newIndex: y, oldLine: null, newLine: newLines[y] })
      }
    }

    while (x > 0 && y > 0) {
      x--
      y--
      edits.unshift({ type: 'equal', oldIndex: x, newIndex: y, oldLine: oldLines[x], newLine: newLines[y] })
    }

    return edits
  }

  /**
   * Compute longest common subsequence for word-level diff
   */
  function computeLCS(oldWords, newWords) {
    const n = oldWords.length
    const m = newWords.length

    if (n === 0 && m === 0) return []
    if (n === 0) return newWords.map(w => ({ type: 'insert', newWord: w }))
    if (m === 0) return oldWords.map(w => ({ type: 'delete', oldWord: w }))

    const dp = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0))
    const direction = Array(n + 1).fill(null).map(() => Array(m + 1).fill(null))

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (oldWords[i - 1] === newWords[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1
          direction[i][j] = 'diag'
        } else if (dp[i - 1][j] > dp[i][j - 1]) {
          dp[i][j] = dp[i - 1][j]
          direction[i][j] = 'up'
        } else {
          dp[i][j] = dp[i][j - 1]
          direction[i][j] = 'left'
        }
      }
    }

    const result = []
    let i = n
    let j = m

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && direction[i][j] === 'diag') {
        result.unshift({ type: 'equal', oldWord: oldWords[i - 1], newWord: newWords[j - 1] })
        i--
        j--
      } else if (j > 0 && (i === 0 || direction[i][j] === 'left')) {
        result.unshift({ type: 'insert', newWord: newWords[j - 1] })
        j--
      } else if (i > 0) {
        result.unshift({ type: 'delete', oldWord: oldWords[i - 1] })
        i--
      }
    }

    return result
  }

  /**
   * Tokenize text into words and separators for word-level diff
   * Supports Unicode characters including Turkish (ğ, ü, ş, ı, ö, ç)
   */
  function tokenize(text) {
    if (!text || text.length === 0) return []

    const tokens = []
    const regex = /(\s+|\p{L}[\p{L}\p{N}_]*|\p{N}+|[^\p{L}\p{N}\s])/gu
    let match

    while ((match = regex.exec(text)) !== null) {
      tokens.push(match[0])
    }

    return tokens.length > 0 ? tokens : [text]
  }

  /**
   * Compute word-level diff between two lines with caching
   */
  function computeWordDiff(oldLine, newLine) {
    if (oldLine === newLine) {
      return [{ type: 'equal', text: oldLine }]
    }

    const cacheKey = getCacheKey(oldLine, newLine)
    if (diffCache.has(cacheKey)) {
      return diffCache.get(cacheKey)
    }

    const oldTokens = tokenize(oldLine)
    const newTokens = tokenize(newLine)

    if (oldTokens.length === 0 && newTokens.length === 0) {
      return []
    }

    const lcs = computeLCS(oldTokens, newTokens)

    const groups = []
    let currentGroup = null

    for (const op of lcs) {
      if (!currentGroup || currentGroup.type !== op.type) {
        if (currentGroup) groups.push(currentGroup)
        currentGroup = { type: op.type, oldText: '', newText: '' }
      }

      if (op.type === 'equal') {
        currentGroup.oldText += op.oldWord
        currentGroup.newText += op.newWord
      } else if (op.type === 'delete') {
        currentGroup.oldText += op.oldWord
      } else if (op.type === 'insert') {
        currentGroup.newText += op.newWord
      }
    }

    if (currentGroup) groups.push(currentGroup)

    const result = []
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i]
      if (group.type === 'equal') {
        result.push({ type: 'equal', text: group.oldText })
      } else if (group.type === 'delete') {
        result.push({ type: 'delete', text: group.oldText })
      } else if (group.type === 'insert') {
        result.push({ type: 'insert', text: group.newText })
      }
    }

    diffCache.set(cacheKey, result)
    return result
  }

  /**
   * Calculate similarity ratio between two strings (0-1)
   */
  function similarityScore(str1, str2) {
    if (!str1 || !str2) return 0
    const len1 = str1.length
    const len2 = str2.length
    if (len1 === 0 && len2 === 0) return 1
    if (len1 === 0 || len2 === 0) return 0

    const tokens1 = tokenize(str1)
    const tokens2 = tokenize(str2)

    const commonTokens = new Set(tokens1.filter(t => tokens2.includes(t)))
    const uniqueTokens = new Set([...tokens1, ...tokens2])
    return uniqueTokens.size > 0 ? commonTokens.size / uniqueTokens.size : 0
  }

  function computeDiff() {
    diffCache.clear()
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

        if (isModified) {
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
    } catch (e) {
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

  function getSplitDiffContent() {
    return diff.map(d => {
      if (d.type === 'removed') return `- ${d.left}`
      if (d.type === 'added') return `+ ${d.right}`
      if (d.type === 'modified') return `- ${d.left}\n+ ${d.right}`
      return ` ${d.left}`
    }).join('\n')
  }
</script>

<div class="tool">
  <div class="tool-header">
    <div class="tool-meta">
      <h1 class="tool-name">Diff Checker</h1>
      <p class="tool-desc">Compare two texts with word-level precision</p>
    </div>
    <div class="tool-actions">
      <div class="segmented">
        <button class="segment" class:active={mode === 'split'} on:click={() => mode = 'split'}>Split</button>
        <button class="segment" class:active={mode === 'unified'} on:click={() => mode = 'unified'}>Unified</button>
      </div>
      <button class="icon-btn" on:click={swap} title="Swap Sides">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12m0-12 4 4m-4-4-4 4"/></svg>
      </button>
      <button class="icon-btn" on:click={loadExample} title="Load Example">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></svg>
      </button>
      <button class="icon-btn" on:click={clear} title="Clear">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  </div>

  {#if mode === 'split'}
    <div class="diff-split">
      <div class="diff-panel">
        <div class="panel-header">
          <span>Original</span>
          <span class="char-count">{leftInput.length} chars</span>
        </div>
        <textarea
          bind:value={leftInput}
          on:input={debouncedCompute}
          placeholder="Paste original text..."
          class="diff-textarea"
          aria-label="Original text input"
        ></textarea>
      </div>

      <div class="diff-panel">
        <div class="panel-header">
          <span>Modified</span>
          <span class="char-count">{rightInput.length} chars</span>
        </div>
        <textarea
          bind:value={rightInput}
          on:input={debouncedCompute}
          placeholder="Paste modified text..."
          class="diff-textarea"
          aria-label="Modified text input"
        ></textarea>
      </div>
    </div>

    <div class="diff-result">
      <div class="result-header">
        <h3>Word-Level Comparison</h3>
        {#if diff.length > 0}
          <CopyButton text={getSplitDiffContent()} />
        {/if}
      </div>
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
    </div>
  {:else}
    <div class="diff-unified">
      <div class="diff-panel">
        <div class="panel-header">
          <span>Original Text</span>
          <span class="char-count">{leftInput.length} chars</span>
        </div>
        <textarea
          bind:value={leftInput}
          on:input={debouncedCompute}
          placeholder="Paste original text..."
          class="diff-textarea"
          aria-label="Original text input"
        ></textarea>
      </div>

      <div class="diff-panel">
        <div class="panel-header">
          <span>Modified Text</span>
          <span class="char-count">{rightInput.length} chars</span>
        </div>
        <textarea
          bind:value={rightInput}
          on:input={debouncedCompute}
          placeholder="Paste modified text..."
          class="diff-textarea"
          aria-label="Modified text input"
        ></textarea>
      </div>

      <div class="unified-result">
        <div class="result-header">
          <h3>Unified Diff</h3>
          {#if diff.length > 0}
            <CopyButton text={diff.map(d => {
              if (d.type === 'removed') return `- ${d.left}`
              if (d.type === 'added') return `+ ${d.right}`
              if (d.type === 'modified') return `- ${d.left}\n+ ${d.right}`
              return ` ${d.left}`
            }).join('\n')} />
          {/if}
        </div>
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
      </div>
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
  .segmented { display: flex; background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius); padding: 2px; }
  .segment { display: flex; align-items: center; padding: var(--space-1) var(--space-3); border-radius: var(--radius-sm); font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-secondary); background: transparent; border: none; cursor: pointer; transition: all var(--transition-fast); }
  .segment:hover { color: var(--text-primary); }
  .segment.active { background: var(--bg-surface); color: var(--text-primary); border: 1px solid var(--border-default); box-shadow: var(--shadow-xs); }
  .icon-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: var(--radius); background: transparent; color: var(--text-tertiary); border: none; cursor: pointer; transition: all var(--transition-fast); }
  .icon-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
  .diff-split { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
  .diff-unified { display: flex; flex-direction: column; gap: var(--space-4); }
  .diff-panel { display: flex; flex-direction: column; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden; }
  .panel-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-2) var(--space-3); background: var(--bg-elevated); border-bottom: 1px solid var(--border-subtle); font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-secondary); }
  .char-count { font-size: var(--text-xs); color: var(--text-muted); font-family: var(--font-mono); }
  .diff-textarea { flex: 1; min-height: 150px; padding: var(--space-3); border: none; background: var(--bg-surface); color: var(--text-primary); font-family: var(--font-mono); font-size: var(--text-sm); line-height: var(--leading-snug); resize: vertical; outline: none; }
  .diff-textarea::placeholder { color: var(--text-muted); }
  .diff-result { background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden; }
  .result-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3) var(--space-4); background: var(--bg-elevated); border-bottom: 1px solid var(--border-subtle); }
  .result-header h3 { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--text-tertiary); margin: 0; text-transform: uppercase; letter-spacing: var(--tracking-wide); }
  .diff-grid { display: grid; grid-template-columns: auto 1fr auto 1fr; gap: 1px; background: var(--border-subtle); }
  .diff-row { display: contents; }
  .diff-row .line-num { padding: var(--space-1) var(--space-2); background: var(--bg-elevated); font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-muted); text-align: right; min-width: 40px; }
  .diff-row .line-content { padding: var(--space-1) var(--space-3); font-family: var(--font-mono); font-size: var(--text-sm); white-space: pre-wrap; word-break: break-all; }
  .diff-row.same .line-content { background: var(--bg-surface); color: var(--text-primary); }
  .diff-row.removed .line-content.old { background: var(--diff-remove-bg); color: var(--error); border-left: 3px solid var(--error); }
  .diff-row.added .line-content.new { background: var(--diff-add-bg); color: var(--success); border-left: 3px solid var(--success); }
  .diff-row.modified .line-content.old { background: var(--diff-remove-bg-subtle); border-left: 3px solid var(--warning); }
  .diff-row.modified .line-content.new { background: var(--diff-add-bg-subtle); border-left: 3px solid var(--warning); }
  .unified-result { background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden; }
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
    .diff-split { grid-template-columns: 1fr; }
    .tool-header { flex-direction: column; align-items: flex-start; }
    .tool-actions { width: 100%; justify-content: flex-end; }
    .diff-grid { grid-template-columns: auto 1fr; }
  }
</style>
