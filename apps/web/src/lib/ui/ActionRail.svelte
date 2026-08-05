<!-- apps/web/src/lib/ui/ActionRail.svelte -->
<div class="action-rail">
  <div class="rail-main">
    <slot />
  </div>
  <div class="rail-end">
    <slot name="end" />
  </div>
</div>

<style>
  .action-rail {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-2) 0 0;
    border-top: 1px solid var(--border-subtle);
    margin-top: var(--space-3);
  }

  .rail-main,
  .rail-end {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
  }
</style>
