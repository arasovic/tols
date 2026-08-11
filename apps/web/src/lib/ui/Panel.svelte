<!-- apps/web/src/lib/ui/Panel.svelte -->
<script>
  /** Pipe-role label shown in the panel head, e.g. 'stdin' */
  export let label = ''
  /** Right-aligned metadata, e.g. a byte count */
  export let meta = ''
</script>

<!--
  `label` is effectively required: an empty aria-label is not an accessible
  name, so the <section> would silently lose its implicit `region` role. Falling
  back to `undefined` keeps the DOM honest — no empty attribute pretending to
  be a label — but a consumer that omits `label` still gets an unnamed pane.
-->
<!--
  `$$restProps` first so the panel's own contract wins: `label` is the API for
  naming a pane and must not be overridable by a stray aria-label. What it does
  let through is the per-pane wiring a primitive cannot guess — `aria-live` on a
  pane whose contents are computed, `data-testid` for a spec that needs a stable
  handle on one pane out of several.
-->
<section {...$$restProps} class="panel" aria-label={label || undefined}>
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
    border: 1px solid var(--border-default);
    border-radius: 0;
  }

  .panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--border-default);
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
