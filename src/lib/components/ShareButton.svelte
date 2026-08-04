<script>
  /**
   * Copies a shareable link (tool state encoded in the URL fragment) to the
   * clipboard. The fragment never reaches the server.
   */
  import { copyToClipboard } from '$lib/utils/clipboard.js'
  import { encodeShareState, buildShareUrl } from '$lib/utils/share.js'
  import { Share2, Check, Unlink } from 'lucide-svelte'

  /** Returns the shareable state of the host tool, e.g. () => ({ input }). */
  /** @type {() => Record<string, string>} */
  export let getState

  let copied = false
  let tooLarge = false
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let resetTimer

  async function share() {
    clearTimeout(resetTimer)
    tooLarge = false
    copied = false

    const encoded = encodeShareState(getState())
    if (!encoded) {
      tooLarge = true
      resetTimer = setTimeout(() => { tooLarge = false }, 2500)
      return
    }

    const result = await copyToClipboard(buildShareUrl(encoded))
    if (result.success) {
      copied = true
      resetTimer = setTimeout(() => { copied = false }, 2000)
    }
  }
</script>

<button
  type="button"
  class="share-btn"
  class:copied
  class:too-large={tooLarge}
  on:click={share}
  title={tooLarge ? 'Input too large to share (50KB link limit)' : 'Copy shareable link'}
  aria-label="Copy shareable link"
>
  {#if copied}
    <Check size={14} />
    <span>Copied</span>
  {:else if tooLarge}
    <Unlink size={14} />
    <span>Too large</span>
  {:else}
    <Share2 size={14} />
    <span>Share</span>
  {/if}
</button>

<style>
  .share-btn {
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

  .share-btn:hover {
    background: var(--bg-hover);
    border-color: var(--border-strong);
    color: var(--text-primary);
  }

  .share-btn.copied {
    color: var(--success);
    border-color: var(--success);
  }

  .share-btn.too-large {
    color: var(--error);
    border-color: var(--error);
  }
</style>
