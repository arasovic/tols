<script>
  /**
   * Landing-page terminal panel: install line + a real CLI transcript.
   * No typing animation, no fake cursor — the transcript is captured output,
   * not scripted motion (anti-slop rule 6).
   */
  import { copyToClipboard } from '$lib/utils/clipboard.js'
  import { onDestroy } from 'svelte'

  const INSTALL = 'npm i -g tols-cli'
  let copied = false
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let resetTimer

  // Captured from the real CLI (packages/tols/bin/tols.js), not written by
  // hand. See task-8-brief.md Step 2 for the exact commands run.
  const TRANSCRIPT = [
    { cmd: 'tols b64 enc hello', out: ['aGVsbG8='] },
    { cmd: 'echo -n aGVsbG8= | tols b64 dec', out: ['hello'] },
    {
      cmd: "tols json fmt '{\"a\":1,\"b\":[2,3]}'",
      out: ['{', '  "a": 1,', '  "b": [', '    2,', '    3', '  ]', '}']
    }
  ]

  // copyToClipboard resolves to { success, error? }, never a boolean — a bare
  // truthiness check would treat a failure object as success.
  async function copyInstall() {
    const result = await copyToClipboard(INSTALL)
    if (!result.success) return
    clearTimeout(resetTimer)
    copied = true
    resetTimer = setTimeout(() => (copied = false), 1200)
  }

  onDestroy(() => clearTimeout(resetTimer))
</script>

<div class="terminal">
  <div class="install">
    <span class="prompt" aria-hidden="true">$</span>
    <code>{INSTALL}</code>
    <button type="button" class="install-copy" on:click={copyInstall}>
      {copied ? 'copied' : 'copy'}
    </button>
  </div>

  <pre class="transcript">{#each TRANSCRIPT as entry}<span class="t-cmd"><span class="prompt" aria-hidden="true">$ </span>{entry.cmd}</span>
{#each entry.out as line}<span class="t-out">{line}</span>
{/each}{/each}</pre>
</div>

<style>
  .terminal {
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    background: var(--bg-surface);
    overflow: hidden;
  }

  .install {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border-subtle);
    font-family: var(--font-mono);
    font-size: var(--text-md);
  }

  .prompt { color: var(--accent); }

  /* Same opt-out as .command-text: this is the install line itself, not a code
     reference inside prose. `font-size: inherit` matters independently — the
     global rule's 0.92em against .install's --text-md lands on 12.88px, a size
     the type scale does not contain. */
  .install code {
    flex: 1;
    color: var(--text-primary);
    background: none;
    padding: 0;
    border-radius: 0;
    font-size: inherit;
  }

  .install-copy {
    padding: var(--space-1) var(--space-2);
    color: var(--text-tertiary);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    background: transparent;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius);
    cursor: pointer;
  }

  .install-copy:hover { color: var(--text-primary); border-color: var(--border-strong); }
  .install-copy:focus-visible { outline: none; box-shadow: var(--glow-focus); }

  .transcript {
    margin: 0;
    padding: var(--space-4);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: var(--leading-normal);
    overflow-x: auto;
  }

  .t-cmd { display: block; color: var(--text-primary); }
  .t-out { display: block; color: var(--text-tertiary); }
</style>
