<script>
  /**
   * Homepage hero block. Stats are derived from the registry by the page.
   */
  import { Zap } from 'lucide-svelte'

  /** @type {Array<{ value: string, label: string }>} */
  export let stats
</script>

<section class="hero">
  <div class="hero-badge">
    <span class="hero-badge-pulse"></span>
    <Zap size={14} />
    <span>100% Browser-based • No Server Uploads</span>
  </div>
  <h1 class="hero-title">
    Essential Tools for Every <span class="hero-title-highlight">Developer</span>
  </h1>
  <p class="hero-subtitle">
    Free, fast, and secure utilities for your daily workflow.
    From <span class="hero-subtle">JSON formatting</span> to <span class="hero-subtle">Base64 encoding</span> and <span class="hero-subtle">UUID generation</span>.
  </p>
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

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    margin-bottom: var(--space-5);
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    color: var(--accent);
    background: var(--accent-soft);
    border: 1px solid var(--accent-dim);
    border-radius: var(--radius-full);
    position: relative;
  }

  .hero-badge-pulse {
    position: absolute;
    left: var(--space-3);
    width: 6px;
    height: 6px;
    background: var(--accent);
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.2);
    }
  }

  .hero-title {
    font-size: var(--text-4xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin-bottom: var(--space-4);
    letter-spacing: var(--tracking-tight);
    line-height: var(--leading-tight);
  }

  .hero-title-highlight {
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-subtitle {
    font-size: var(--text-lg);
    color: var(--text-secondary);
    line-height: var(--leading-relaxed);
    max-width: 600px;
    margin: 0 auto var(--space-6);
  }

  .hero-subtle {
    color: var(--text-tertiary);
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
