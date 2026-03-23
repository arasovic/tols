<script>
  import TimestampTool from '$lib/tools/TimestampTool.svelte'

  const pageTitle = 'Timestamp Converter - DevUtils | Unix Timestamp to Date'
  const pageDescription = 'Free online timestamp converter tool for developers. Convert Unix timestamps to human-readable dates and times instantly with full timezone support online.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/timestamp'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="timestamp converter, Unix timestamp, epoch time, timestamp to date, date to timestamp, online timestamp tool" />
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
    "name": "Timestamp Converter",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "Unix timestamp to date",
      "Date to Unix timestamp",
      "Millisecond support",
      "Multiple timezone support",
      "Current timestamp",
      "ISO 8601 output"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <TimestampTool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What is a Unix Timestamp?</h2>
      <p>
        A Unix timestamp (also called Epoch time) is a way to track time as a running total of seconds
        since the Unix Epoch on January 1st, 1970 at UTC. It's widely used in programming and databases
        because it represents time as a simple integer, making it easy to store and compare.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use Timestamp Converter</h2>
      <ol>
        <li><strong>Choose mode</strong> - Select whether to convert from timestamp to date or vice versa</li>
        <li><strong>Enter value</strong> - Input your timestamp or select a date from the picker</li>
        <li><strong>View results</strong> - See the conversion in multiple formats instantly</li>
        <li><strong>Copy values</strong> - Copy the timestamp or formatted date to your clipboard</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">Timestamp Converter Features</h2>
      <ul>
        <li><strong>Bi-directional</strong> - Convert both ways: timestamp to date and date to timestamp</li>
        <li><strong>Multiple formats</strong> - Get ISO 8601, locale string, and raw timestamp</li>
        <li><strong>Millisecond support</strong> - Handles both seconds and milliseconds timestamps</li>
        <li><strong>Timezone aware</strong> - Shows time in UTC and local timezone</li>
        <li><strong>Current time</strong> - Quick button to insert current timestamp</li>
        <li><strong>One-click copy</strong> - Copy any format with a single click</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>Why do developers use Unix timestamps?</h3>
      <p>
        Unix timestamps provide a language-agnostic way to represent time. They're easy to store
        (just a number), compare (numerical comparison), and convert to any timezone. Most
        programming languages have built-in support for Unix timestamps.
      </p>

      <h3>What is the difference between seconds and milliseconds?</h3>
      <p>
        Unix timestamps in seconds count seconds since 1970. Millisecond timestamps multiply
        this by 1000 for more precision. JavaScript typically uses milliseconds, while many
        other systems use seconds.
      </p>

      <h3>When does the Unix timestamp overflow?</h3>
      <p>
        32-bit systems using signed integers will overflow on January 19, 2038 (the Year 2038 problem).
        Modern systems use 64-bit integers, which won't overflow for billions of years.
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
