<script>
  import TimezoneTool from '$lib/tools/TimezoneTool.svelte'

  const pageTitle = 'Time Zone Converter - DevUtils | Convert Time Zones'
  const pageDescription = 'Free online time zone converter tool for scheduling. Convert times instantly between different time zones worldwide with automatic daylight saving support.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/timezone'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="time zone converter, timezone converter, UTC converter, world time" />
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
    "name": "Time Zone Converter",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "Global coverage",
      "Daylight saving",
      "Current time",
      "Time difference",
      "Date support",
      "Multiple formats"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <TimezoneTool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What is Time Zone Converter?</h2>
      <p>
        Time Zone Converter helps you convert times between different time zones around the world.
        It accounts for daylight saving time changes and provides accurate conversions for scheduling
        meetings, coordinating with remote teams, or planning travel across multiple time zones.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use Time Zone Converter</h2>
      <ol>
        <li><strong>Select source timezone</strong> - Choose the timezone of your original time</li>
        <li><strong>Enter time</strong> - Input the date and time you want to convert</li>
        <li><strong>Select target timezone</strong> - Choose the timezone to convert to</li>
        <li><strong>View result</strong> - See the converted time instantly</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">Time Zone Converter Features</h2>
      <ul>
        <li><strong>Global coverage</strong> - All major time zones worldwide</li>
        <li><strong>Daylight saving</strong> - Automatic DST adjustments</li>
        <li><strong>Current time</strong> - Quick button to use current time</li>
        <li><strong>Time difference</strong> - Shows hours difference between zones</li>
        <li><strong>Date support</strong> - Convert any date and time</li>
        <li><strong>Multiple formats</strong> - View in 12-hour and 24-hour formats</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>What is UTC and how does it relate to time zones?</h3>
      <p>
        UTC (Coordinated Universal Time) is the primary time standard by which the world regulates
        clocks. All other time zones are defined as offsets from UTC (e.g., UTC+5, UTC-8). When
        converting between time zones, the tool calculates the difference between each zone's
        UTC offset, accounting for daylight saving time when applicable.
      </p>

      <h3>How does daylight saving time affect conversions?</h3>
      <p>
        Many regions observe daylight saving time (DST), which shifts clocks forward by one hour
        during summer months. The converter automatically applies DST rules for each timezone
        based on the date you select. Be aware that DST start/end dates vary by region and year.
      </p>

      <h3>What is the best way to schedule meetings across time zones?</h3>
      <p>
        When scheduling international meetings, convert the proposed time to each participant's
        local time zone to ensure convenience. Consider business hours in each location - a time
        that works for someone in London might be very early or late for someone in Tokyo.
        Always confirm times with all participants.
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
