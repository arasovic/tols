<script>
  import CronTool from '$lib/tools/CronTool.svelte'

  const pageTitle = 'Cron Expression Parser - DevUtils | Validate & Parse Cron'
  const pageDescription = 'Free online cron expression parser tool for developers. Validate cron syntax instantly, get human descriptions, and calculate next execution times online.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/cron'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="cron parser, cron validator, cron expression, crontab, schedule parser" />
  <link rel="canonical" href={canonicalUrl} />

  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={pageDescription} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:site_name" content="DevUtils" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={pageDescription} />
  <meta name="twitter:image" content={ogImage} />

  {@html `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Cron Expression Parser",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "Human-readable description",
      "Next execution times",
      "Syntax validation",
      "Standard cron support",
      "Common presets",
      "Real-time parsing"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <CronTool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What is Cron Expression Parser?</h2>
      <p>
        Cron Expression Parser helps you understand and validate cron expressions used for scheduling
        tasks. Cron is a time-based job scheduler in Unix-like systems. This tool translates cryptic
        cron expressions into human-readable descriptions and shows the next execution times,
        making it easier to create and debug scheduled jobs.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use Cron Expression Parser</h2>
      <ol>
        <li><strong>Enter cron expression</strong> - Type your cron expression (e.g., "0 0 * * *")</li>
        <li><strong>View description</strong> - See a human-readable explanation of the schedule</li>
        <li><strong>Check next runs</strong> - View the next execution dates and times</li>
        <li><strong>Validate syntax</strong> - Ensure your expression is valid</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">Cron Expression Parser Features</h2>
      <ul>
        <li><strong>Human-readable description</strong> - Converts cron to plain English</li>
        <li><strong>Next execution times</strong> - Shows upcoming scheduled runs</li>
        <li><strong>Syntax validation</strong> - Detects invalid cron expressions</li>
        <li><strong>Standard cron support</strong> - Works with Linux/Unix cron syntax</li>
        <li><strong>Common presets</strong> - Quick templates for common schedules</li>
        <li><strong>Real-time parsing</strong> - Updates as you type</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>What is the cron format?</h3>
      <p>
        Standard cron expressions have 5 fields: minute (0-59), hour (0-23), day of month (1-31),
        month (1-12), and day of week (0-7, where both 0 and 7 represent Sunday). Each field can
        contain a number, range, list, or special characters like * (any) and / (step).
      </p>

      <h3>What are common cron expressions?</h3>
      <p>
        "0 0 * * *" runs daily at midnight. "*/5 * * * *" runs every 5 minutes. "0 9 * * 1" runs
        at 9 AM every Monday. "0 0 1 * *" runs on the first day of each month. The tool includes
        presets for these common patterns.
      </p>

      <h3>Does this support cron extensions like @daily?</h3>
      <p>
        This parser focuses on standard 5-field cron syntax. Some systems support special strings
        like @daily, @hourly, or @reboot, but these are non-standard extensions and may not be
        supported in all cron implementations.
      </p>
    </section>
    </div>
  </article>
</main>

<style>
  .seo-section {
    margin-top: var(--space-8);
    padding-top: var(--space-8);
    border-top: 1px solid var(--border-subtle);
  }

  .seo-content {
    width: 100%;
    margin-top: var(--space-6);
    padding: var(--space-6);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
  }

  .seo-content:first-child {
    margin-top: 0;
  }

  .seo-content h2 {
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin-bottom: var(--space-4);
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--border-subtle);
  }

  .seo-content h3 {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin-top: var(--space-5);
    margin-bottom: var(--space-2);
  }

  .seo-content p {
    color: var(--text-secondary);
    line-height: var(--leading-relaxed);
    margin-bottom: var(--space-3);
  }

  .seo-content ul,
  .seo-content ol {
    color: var(--text-secondary);
    line-height: var(--leading-relaxed);
    margin-left: var(--space-4);
    margin-bottom: var(--space-3);
  }

  .seo-content li {
    margin-bottom: var(--space-2);
  }

  .seo-content strong {
    color: var(--text-primary);
    font-weight: var(--font-medium);
  }

  @media (max-width: 768px) {
    .seo-section {
      margin-top: var(--space-6);
      padding-top: var(--space-6);
    }

    .seo-content {
      padding: var(--space-4);
      margin-top: var(--space-4);
    }
  }
</style>
