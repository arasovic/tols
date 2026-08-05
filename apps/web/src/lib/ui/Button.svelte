<!-- apps/web/src/lib/ui/Button.svelte -->
<script>
  import Kbd from './Kbd.svelte'

  /** @type {'primary' | 'ghost'} */
  export let variant = 'ghost'
  /** Optional keyboard hint rendered inside the button */
  export let kbd = ''
  export let disabled = false
  export let title = ''
</script>

<button
  type="button"
  class="btn"
  class:btn-primary={variant === 'primary'}
  class:btn-ghost={variant === 'ghost'}
  {disabled}
  {title}
  on:click
>
  <slot />
  {#if kbd}<Kbd keys={kbd} />{/if}
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    height: var(--control-height);
    padding: 0 var(--space-3);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    border-radius: var(--radius);
    cursor: pointer;
    transition: color var(--transition-fast), background var(--transition-fast),
      border-color var(--transition-fast);
  }

  .btn:disabled {
    color: var(--text-disabled);
    cursor: not-allowed;
  }

  .btn:focus-visible {
    outline: none;
    box-shadow: var(--glow-focus);
  }

  .btn-ghost {
    color: var(--text-secondary);
    background: transparent;
    border: 1px solid var(--border-subtle);
  }

  .btn-ghost:hover:not(:disabled) {
    color: var(--text-primary);
    border-color: var(--border-strong);
  }

  .btn-primary {
    color: var(--bg-base);
    background: var(--accent);
    border: 1px solid var(--accent);
    font-weight: var(--font-semibold);
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--accent-hover);
    border-color: var(--accent-hover);
  }
</style>
