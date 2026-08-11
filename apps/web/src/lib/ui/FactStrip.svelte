<!-- apps/web/src/lib/ui/FactStrip.svelte -->
<script>
  /**
   * The "what just happened" row at the foot of a tool page: a horizontal strip
   * of `label: value` facts — the mode, the byte counts, the detected MIME
   * type. Ten tools used to hand-roll this as `info-bar` / `info-item` /
   * `info-label` / `info-value` plus their own copy of the CSS, and it drifted
   * the way duplicated things do (a trailing colon here, a missing one there,
   * a badge tone spelled out three different ways). This component is the one
   * copy.
   *
   * Facts are data, not slot content: a fact is a label, a value, and an
   * optional presentation, and a tool has no say in how the strip draws them.
   * A tool that shows a fact only sometimes filters the array instead of
   * wrapping markup in `{#if}`, so the strip's own `{#if facts.length}` is the
   * only conditional the chrome needs.
   *
   * `presentation` picks the value rendering: the plain value (default), a
   * monospace value ('mono'), or a badge in one of the three tones the tools
   * were drifting between ('accent' | 'info' | 'success').
   *
   * `testid` is the handle a spec needs to reach a single fact. It lands on
   * the fact row, so a spec can assert the row as a whole — the label, the
   * separator and the value together — rather than threading a data attribute
   * through markup the tool would otherwise keep writing itself.
   *
   * @typedef {'plain' | 'mono' | 'accent' | 'info' | 'success'} FactPresentation
   * @typedef {{
   *   label: string,
   *   value: string,
   *   presentation?: FactPresentation,
   *   testid?: string
   * }} Fact
   */
  export let facts = /** @type {Fact[]} */ ([])

  /** @param {Fact} fact */
  function valueClass(fact) {
    if (fact.presentation === 'mono') return 'fact-value fact-mono'
    if (fact.presentation === 'accent' || fact.presentation === 'info' || fact.presentation === 'success') {
      return `fact-badge fact-badge-${fact.presentation}`
    }
    return 'fact-value'
  }
</script>

<!--
  The separator (the trailing colon each label used to carry in its own text)
  is drawn by the component as `::after` on the label rather than as a bare
  element, because a bare element sits between the label and its gap: a flex
  gap would space "Mode", ":" and the value equally, where the strips used to
  read "Mode:" flush against the value's gap. The pseudo-element keeps the
  colon attached to the label and lets the existing gap carry the value. No
  tool writes a colon any more, which is the drift this removes.
-->
{#if facts.length}
  <div class="fact-strip">
    {#each facts as fact}
      <div class="fact" data-testid={fact.testid || undefined}>
        <span class="fact-label">{fact.label}</span>
        <span class={valueClass(fact)}>{fact.value}</span>
      </div>
    {/each}
  </div>
{/if}

<style>
  .fact-strip {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-3) var(--space-6);
    padding: var(--space-3) var(--space-4);
    background: var(--bg-base);
    border: 1px solid var(--border-default);
    border-radius: 0;
  }

  .fact {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .fact-label {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
  }

  .fact-label::after {
    content: ':';
  }

  .fact-value {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-primary);
  }

  .fact-mono {
    font-family: var(--font-mono);
  }

  .fact-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    border-radius: var(--radius-sm);
    background: var(--bg-elevated);
    color: var(--text-secondary);
    border: 1px solid var(--border-subtle);
  }

  .fact-badge-accent {
    background: var(--accent-soft);
    color: var(--accent);
    border-color: var(--accent-dim);
  }

  .fact-badge-info {
    background: var(--info-muted);
    color: var(--info);
  }

  /* No border tint: --accent-dim exists for the accent badge, there is no
     success equivalent, and the literal that was here was not even this
     palette's green (#3da35d) — it was Tailwind's. The shared --border-subtle
     from .fact-badge is what the info tone already uses. */
  .fact-badge-success {
    background: var(--success-soft);
    color: var(--success);
  }

  /* Vertical strip on small screens — the shape the majority of tools already
     collapsed to by hand, so the primitive makes it the one shape. */
  @media (max-width: 768px) {
    .fact-strip {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-3);
    }
  }
</style>
