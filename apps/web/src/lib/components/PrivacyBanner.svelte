<script>
  import { Shield } from 'lucide-svelte'
</script>

<section class="privacy-banner">
  <div class="privacy-banner-content">
    <div class="privacy-banner-icon">
      <Shield size={24} />
    </div>
    <div class="privacy-banner-text">
      <!-- h2, not h3: this banner sits directly under the landing page's only
           <h1>, so an h3 here skips a level (WCAG 1.3.1 / Lighthouse
           heading-order). It is a sibling of the tool-card h2s below it. -->
      <h2>Privacy & Speed</h2>
      <p>Your data never leaves your browser</p>
    </div>
    <div class="privacy-banner-tags">
      <span class="privacy-tag">
        <span class="privacy-tag-dot green"></span>
        No Server
      </span>
      <span class="privacy-tag">
        <span class="privacy-tag-dot green"></span>
        No Cookies
      </span>
      <span class="privacy-tag">
        <span class="privacy-tag-dot blue"></span>
        Offline Ready
      </span>
    </div>
  </div>
</section>

<style>
  .privacy-banner {
    margin-bottom: var(--space-8);
  }

  .privacy-banner-content {
    display: flex;
    align-items: center;
    gap: var(--space-5);
    padding: var(--space-5) var(--space-6);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
  }

  .privacy-banner-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: var(--accent-soft);
    border-radius: var(--radius);
    color: var(--accent);
    flex-shrink: 0;
  }

  .privacy-banner-text {
    flex: 1;
  }

  .privacy-banner-text h2 {
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--space-1) 0;
  }

  .privacy-banner-text p {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    margin: 0;
  }

  .privacy-banner-tags {
    display: flex;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  .privacy-tag {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-3);
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-full);
  }

  .privacy-tag-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .privacy-tag-dot.green {
    background: var(--success);
  }

  .privacy-tag-dot.blue {
    background: var(--accent);
  }

  @media (max-width: 640px) {
    .privacy-banner-content {
      flex-direction: column;
      text-align: center;
      gap: var(--space-4);
    }

    .privacy-banner-tags {
      justify-content: center;
    }
  }
</style>
