<!-- apps/web/src/lib/ui/Button.svelte -->
<script>
  import Kbd from './Kbd.svelte'

  /** @type {'primary' | 'ghost'} */
  export let variant = 'ghost'
  /** Optional keyboard hint rendered inside the button */
  export let kbd = ''
  export let disabled = false

  // `class` must be a DECLARED prop, not part of $$restProps. Svelte merges a
  // static class attribute and $$restProps into one attribute list applied via
  // set_attributes, which assigns className wholesale on a last-key-wins basis
  // — so a consumer-passed class in $$restProps would silently erase `btn` and
  // every base style with it. Declaring it excludes it from $$restProps and
  // lets us merge explicitly instead.
  let className = ''
  export { className as class }
</script>

<!--
  `$$restProps` carries aria-label, title, data-* and the like straight through.
  An icon-only action needs an accessible name, and 28 tool components will
  consume this primitive — a closed attribute surface would force every one of
  them to wrap it. `title` is deliberately NOT a declared prop: declaring it
  with a '' default would emit an empty title attribute on every button.
-->
<button
  type="button"
  class="btn {className}"
  class:btn-primary={variant === 'primary'}
  class:btn-ghost={variant === 'ghost'}
  {disabled}
  {...$$restProps}
  on:click
  on:keydown
  on:focus
  on:blur
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
    transition: color var(--transition-fast) var(--ease-out), background var(--transition-fast) var(--ease-out),
      border-color var(--transition-fast) var(--ease-out);
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
