<!-- apps/web/src/lib/ui/Kbd.svelte -->
<script>
  /** @type {string} */
  export let keys = ''
</script>

<kbd class="kbd">{keys}</kbd>

<style>
  .kbd {
    display: inline-flex;
    align-items: center;
    /* 1px vertical is a deliberate optical adjustment: a full --space-1 makes
       the key cap taller than the line it sits on. Rule 8 exception, scoped
       to this one declaration. */
    padding: 1px var(--space-1);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-secondary);
    background: var(--bg-surface);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    white-space: nowrap;
    transition:
      color var(--transition-fast) var(--ease-out),
      background var(--transition-fast) var(--ease-out),
      border-color var(--transition-fast) var(--ease-out);
  }

  :global(button:hover) .kbd,
  :global(button:focus-visible) .kbd {
    color: var(--bg-base);
    background: var(--text-primary);
    border-color: var(--text-primary);
  }
</style>
