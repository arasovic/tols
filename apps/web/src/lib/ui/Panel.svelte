<!-- apps/web/src/lib/ui/Panel.svelte -->
<script>
  /** Pipe-role label shown in the panel head, e.g. 'stdin' */
  export let label = ''
  /** Right-aligned metadata, e.g. a byte count */
  export let meta = ''
</script>

<section class="panel" aria-label={label}>
  <header class="panel-head">
    <span class="panel-label">{label}</span>
    {#if meta}<span class="panel-meta">{meta}</span>{/if}
  </header>
  <div class="panel-body">
    <slot />
  </div>
</section>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    background: var(--bg-base);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius);
  }

  .panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--border-subtle);
  }

  .panel-label {
    color: var(--text-tertiary);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    text-transform: lowercase;
  }

  .panel-meta {
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-variant-numeric: tabular-nums;
  }

  .panel-body {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
</style>
