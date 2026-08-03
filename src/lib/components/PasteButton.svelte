<script>
  /**
   * Reads the clipboard and emits the text to the host tool via `on:text`.
   * Kept dumb on purpose: the tool decides where the text lands.
   */
  import { createEventDispatcher } from 'svelte'
  import { ClipboardPaste, Check, TriangleAlert } from 'lucide-svelte'

  const dispatch = createEventDispatcher()

  let state = 'idle' // idle | done | error
  let resetTimer

  async function paste() {
    clearTimeout(resetTimer)
    state = 'idle'

    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard ||
          typeof navigator.clipboard.readText !== 'function') {
        throw new Error('Clipboard API unavailable')
      }
      const text = await navigator.clipboard.readText()
      if (!text) throw new Error('Clipboard is empty')

      dispatch('text', { text })
      state = 'done'
    } catch {
      state = 'error'
    }
    resetTimer = setTimeout(() => { state = 'idle' }, 2000)
  }
</script>

<button
  type="button"
  class="paste-btn"
  class:done={state === 'done'}
  class:failed={state === 'error'}
  on:click={paste}
  title={state === 'error' ? 'Clipboard unavailable or empty' : 'Paste from clipboard'}
  aria-label="Paste from clipboard"
>
  {#if state === 'done'}
    <Check size={14} />
    <span>Pasted</span>
  {:else if state === 'error'}
    <TriangleAlert size={14} />
    <span>No clipboard</span>
  {:else}
    <ClipboardPaste size={14} />
    <span>Paste</span>
  {/if}
</button>

<style>
  .paste-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .paste-btn:hover {
    background: var(--bg-hover);
    border-color: var(--border-strong);
    color: var(--text-primary);
  }

  .paste-btn.done {
    color: var(--success);
    border-color: var(--success);
  }

  .paste-btn.failed {
    color: var(--error);
    border-color: var(--error);
  }
</style>
