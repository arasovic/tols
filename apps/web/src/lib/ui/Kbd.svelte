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
    padding: 1px var(--space-1);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-muted);
    background: transparent;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    white-space: nowrap;
  }
</style>
