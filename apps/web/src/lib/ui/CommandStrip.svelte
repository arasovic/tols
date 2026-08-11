<!-- apps/web/src/lib/ui/CommandStrip.svelte -->
<script>
  import { buildCommand } from '$lib/cli/command.js'
  import { templateFor } from '$lib/cli/templates.js'
  import { createCopyFeedback } from './copyFeedback.js'
  import { onDestroy } from 'svelte'
  import Kbd from './Kbd.svelte'

  export let toolId = ''
  export let action = ''
  export let input = ''
  /** @type {Record<string, unknown>} */
  export let flags = {}

  let copied = false
  let failed = false
  let command = ''

  const feedback = createCopyFeedback((status) => {
    copied = status === 'copied'
    failed = status === 'failed'
  })

  $: template = templateFor(toolId)
  $: {
    const resolvedAction = template ? action || template.defaultAction : ''
    const omitDefaultAction = template?.omitDefaultAction === true
      && resolvedAction === template.defaultAction
    command = template
      ? buildCommand({
          tool: template.tool,
          action: resolvedAction,
          defaultAction: template.defaultAction,
          omitDefaultAction,
          positionalArgs: template.positionalArgs,
          input,
          flags,
          inputName: template.inputName
        })
      : ''
  }

  export async function copy() {
    await feedback.copy(command)
  }

  onDestroy(() => feedback.dispose())

  $: copyLabel = failed ? 'failed' : copied ? 'copied' : 'copy'
  $: copyAria = failed
    ? 'Failed to copy command'
    : copied
      ? 'Command copied to clipboard'
      : 'Copy command to clipboard'
</script>

{#if template}
  <div class="command-strip" role="group" aria-label="Equivalent tols command">
    <span class="command-label">Run locally</span>
    <code class="command-text">{command}</code>
    <button
      type="button"
      class="command-copy"
      class:is-failed={failed}
      on:click={copy}
      aria-label={copyAria}
    >
      {copyLabel}
      <Kbd keys="⌘⇧C" />
    </button>
  </div>
{/if}

<style>
  .command-strip {
    display: grid;
    grid-template-columns: minmax(96px, 0.22fr) minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-4);
    min-height: 60px;
    padding: var(--space-3) var(--space-4);
    background: var(--bg-base);
    border-top: 1px solid var(--border-default);
    border-bottom: 1px solid var(--border-default);
  }

  .command-label {
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
  }

  .command-text {
    min-width: 0;
    overflow-x: auto;
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: var(--text-base);
    white-space: pre;
    background: none;
    padding: 0;
    border-radius: 0;
  }

  .command-copy {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    flex-shrink: 0;
    margin-left: auto;
    padding: 0;
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    background: transparent;
    border: 0;
    border-radius: 0;
    cursor: pointer;
    transition: color var(--transition-fast) var(--ease-out);
  }

  .command-copy:hover {
    color: var(--text-primary);
  }

  .command-copy.is-failed {
    color: var(--error);
  }

  .command-copy:focus-visible {
    outline: 2px solid var(--border-focus);
    outline-offset: 4px;
  }

  @media (max-width: 600px) {
    .command-strip {
      grid-template-columns: 1fr auto;
      gap: var(--space-2) var(--space-3);
      padding-inline: var(--space-3);
    }

    .command-label {
      grid-column: 1 / -1;
    }
  }
</style>
