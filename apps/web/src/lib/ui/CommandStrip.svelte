<!-- apps/web/src/lib/ui/CommandStrip.svelte -->
<script>
  import { buildCommand } from '$lib/cli/command.js'
  import { templateFor } from '$lib/cli/templates.js'
  import { copyToClipboard } from '$lib/utils/clipboard.js'
  import Kbd from './Kbd.svelte'

  /** Registry id of the current tool, e.g. 'json' */
  export let toolId = ''
  /** CLI action; falls back to the template default */
  export let action = ''
  /** Current tool input */
  export let input = ''
  /** Flag values to render, e.g. { indent: 2 } */
  /** @type {Record<string, unknown>} */
  export let flags = {}

  let copied = false

  $: template = templateFor(toolId)
  $: command = template
    ? buildCommand({
        tool: template.tool,
        action: action || template.defaultAction,
        input,
        flags,
        inputName: template.inputName
      })
    : ''

  async function copy() {
    const result = await copyToClipboard(command)
    if (!result.success) return
    copied = true
    setTimeout(() => (copied = false), 1200)
  }
</script>

{#if template}
  <div class="command-strip" role="group" aria-label="Equivalent tols command">
    <span class="command-prompt" aria-hidden="true">$</span>
    <code class="command-text">{command}</code>
    <span class="command-caret" aria-hidden="true"></span>
    <button type="button" class="command-copy" on:click={copy} title="Copy command">
      {copied ? 'copied' : 'copy'}
      <Kbd keys="⌘⇧C" />
    </button>
  </div>
{/if}

<style>
  .command-strip {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    height: var(--command-height);
    padding: 0 var(--space-4);
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border-subtle);
    overflow-x: auto;
  }

  .command-prompt {
    flex-shrink: 0;
    color: var(--accent);
    font-family: var(--font-mono);
    font-size: var(--text-base);
    user-select: none;
  }

  .command-text {
    flex: 1;
    min-width: 0;
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: var(--text-base);
    white-space: pre;
  }

  .command-caret {
    flex-shrink: 0;
    width: 7px;
    height: 15px;
    background: var(--accent);
    opacity: 0.35;
  }

  .command-strip:hover .command-caret,
  .command-strip:focus-within .command-caret {
    animation: blink 1s steps(1, end) infinite;
  }

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }

  .command-copy {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    flex-shrink: 0;
    padding: var(--space-1) var(--space-2);
    color: var(--text-tertiary);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    background: transparent;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius);
    cursor: pointer;
    transition: color var(--transition-fast), border-color var(--transition-fast);
  }

  .command-copy:hover {
    color: var(--text-primary);
    border-color: var(--border-strong);
  }

  .command-copy:focus-visible {
    outline: none;
    box-shadow: var(--glow-focus);
  }

  @media (prefers-reduced-motion: reduce) {
    .command-strip:hover .command-caret,
    .command-strip:focus-within .command-caret {
      animation: none;
      opacity: 1;
    }
  }
</style>
