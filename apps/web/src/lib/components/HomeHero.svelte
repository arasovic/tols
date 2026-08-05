<script>
  /**
   * Homepage hero block. Installing the CLI is the primary action; the
   * terminal transcript below the sub is real captured CLI output, not a
   * scripted animation (anti-slop rule 6). Stats are derived from the
   * registry by the page.
   */
  import TerminalDemo from '$lib/components/TerminalDemo.svelte'

  /** @type {Array<{ value: string, label: string }>} */
  export let stats
</script>

<section class="hero">
  <h1 class="hero-title">28 dev tools. One command.</h1>
  <p class="hero-subtitle">
    Format, encode, hash, convert — in the browser or in your terminal. Nothing leaves your machine.
  </p>

  <div class="hero-terminal">
    <TerminalDemo />
  </div>

  <div class="hero-stats">
    {#each stats as stat}
      <div class="hero-stat">
        <span class="hero-stat-value">{stat.value}</span>
        <span class="hero-stat-label">{stat.label}</span>
      </div>
    {/each}
  </div>
</section>

<style>
  .hero {
    text-align: center;
    margin-bottom: var(--space-8);
  }

  .hero-title {
    font-family: var(--font-display);
    font-size: var(--text-4xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin-bottom: var(--space-4);
    letter-spacing: var(--tracking-tight);
    line-height: var(--leading-tight);
  }

  .hero-subtitle {
    font-size: var(--text-lg);
    color: var(--text-secondary);
    line-height: var(--leading-relaxed);
    max-width: 600px;
    margin: 0 auto var(--space-6);
  }

  .hero-terminal {
    max-width: 600px;
    margin: 0 auto var(--space-6);
    text-align: left;
  }

  .hero-stats {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-8);
    margin-top: var(--space-6);
  }

  .hero-stat {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
  }

  .hero-stat-value {
    font-size: var(--text-2xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
  }

  .hero-stat-label {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
  }

  @media (max-width: 640px) {
    .hero {
      margin-bottom: var(--space-6);
    }

    .hero-title {
      font-size: var(--text-2xl);
    }

    .hero-stats {
      flex-direction: column;
      gap: var(--space-3);
    }
  }
</style>
