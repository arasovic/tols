<script>
  import { theme, themePreference } from '$lib/stores/theme'
  import Button from './Button.svelte'

  const labels = {
    system: 'auto',
    light: 'light',
    dark: 'dark'
  }

  $: controlLabel = `Theme: ${labels[$themePreference]}. Change theme`
</script>

<Button
  class="theme-control"
  on:click={theme.cycle}
  aria-label={controlLabel}
>
  <span>theme</span>
  <span aria-hidden="true">/</span>
  <span class="theme-value">{labels[$themePreference]}</span>
</Button>

<style>
  :global(.theme-control) {
    border: 0;
    padding-inline: 0;
    height: auto;
    color: var(--text-secondary);
    background: transparent;
  }

  :global(.theme-control:hover:not(:disabled)) {
    color: var(--text-primary);
    border-color: transparent;
  }

  .theme-value {
    color: var(--text-primary);
  }
</style>
