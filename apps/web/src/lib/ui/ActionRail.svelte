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
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--border-default);
    border-top: 0;
  }

  .rail-main,
  .rail-end {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
    min-width: 0;
  }
</style>
