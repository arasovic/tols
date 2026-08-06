<script>
  import { createEventDispatcher } from 'svelte'
  import { copyToClipboard } from '$lib/utils/clipboard'
  import Toast from './Toast.svelte'
  import { Copy, Check } from 'lucide-svelte'

  export let text = ''
  export let disabled = false
  /** @type {'sm' | 'md' | 'lg'} */
  export let size = 'md'

  const dispatch = createEventDispatcher()
  /** @type {Toast | null} */
  let toast = null
  let copied = false

  const sizes = {
    sm: 24,
    md: 32,
    lg: 40
  }

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 18
  }

  $: buttonSize = sizes[size] || sizes.md
  $: iconSize = iconSizes[size] || iconSizes.md

  async function handleCopy() {
    if (!text || disabled) return

    const result = await copyToClipboard(text)
    if (result.success) {
      copied = true
      toast?.show('Copied to clipboard', 'success')
      dispatch('copy')
      setTimeout(() => copied = false, 2000)
    } else {
      toast?.show('Failed to copy', 'error')
      dispatch('error', result.error)
    }
  }
</script>

<div class="copy-wrapper">
  <Toast bind:this={toast} />
  <button
    type="button"
    class="copy-btn"
    class:copied
    class:disabled
    on:click={handleCopy}
    {disabled}
    aria-label={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
    title={copied ? 'Copied!' : 'Copy'}
    style="--btn-size: {buttonSize}px"
  >
    <span class="icon-container">
      <span class="icon icon-copy">
        <Copy size={iconSize} />
      </span>
      <span class="icon icon-check">
        <Check size={iconSize} />
      </span>
    </span>
  </button>
</div>

<style>
  .copy-wrapper {
    display: inline-flex;
    position: relative;
  }

  .copy-btn {
    --btn-size: 28px;
    width: var(--btn-size);
    height: var(--btn-size);
    padding: 0;
    border: 1px solid var(--border-default);
    border-radius: var(--radius);
    background: var(--bg-surface);
    color: var(--text-tertiary);
    cursor: pointer;
    transition: all var(--transition-fast) var(--ease-out);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .copy-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--accent-soft);
    opacity: 0;
    transition: opacity var(--transition-fast) var(--ease-out);
  }

  .copy-btn:hover:not(.disabled) {
    border-color: var(--accent);
    color: var(--accent);
  }

  .copy-btn:hover:not(.disabled)::before {
    opacity: 1;
  }

  .copy-btn:active:not(.disabled) {
    transform: scale(0.96);
  }

  .copy-btn.copied {
    border-color: var(--success);
    color: var(--success);
    background: var(--success-soft);
  }

  .copy-btn.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .icon-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-fast) var(--ease-out);
  }

  .icon-copy {
    opacity: 1;
    transform: scale(1);
  }

  .icon-check {
    opacity: 0;
    transform: scale(0.5);
  }

  .copy-btn.copied .icon-copy {
    opacity: 0;
    transform: scale(0.5);
  }

  .copy-btn.copied .icon-check {
    opacity: 1;
    transform: scale(1);
  }
</style>
