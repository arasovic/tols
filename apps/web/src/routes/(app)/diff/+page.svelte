<script>
  import DiffTool from '$lib/tools/DiffTool.svelte'

  const pageTitle = 'Diff Checker - DevUtils | Compare Text Differences'
  const pageDescription = 'Free online diff checker comparison tool for developers. Compare two texts side-by-side instantly, find differences, and see unified diff output online today.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/diff'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="diff checker, text compare, difference finder, unified diff" />
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
    "name": "Diff Checker",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "Side-by-side view",
      "Unified diff",
      "Line-by-line comparison",
      "Color highlighting",
      "Word-level diff",
      "Clear inputs"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <DiffTool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What is Diff Checker?</h2>
      <p>
        Diff Checker compares two texts to find differences between them. It highlights added,
        removed, and modified lines, making it easy to see what changed. This is useful for code
        reviews, document comparison, checking file versions, and tracking changes over time.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use Diff Checker</h2>
      <ol>
        <li><strong>Paste original text</strong> - Enter the original or older version in the left panel</li>
        <li><strong>Paste modified text</strong> - Enter the new or modified version in the right panel</li>
        <li><strong>Compare</strong> - Click the compare button to see differences</li>
        <li><strong>Review changes</strong> - Added lines are highlighted in green, removed in red</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">Diff Checker Features</h2>
      <ul>
        <li><strong>Side-by-side view</strong> - Compare texts in parallel panels</li>
        <li><strong>Unified diff</strong> - See changes in a consolidated view</li>
        <li><strong>Line-by-line comparison</strong> - Detailed difference detection</li>
        <li><strong>Color highlighting</strong> - Visual distinction of added/removed content</li>
        <li><strong>Word-level diff</strong> - See exact changes within lines</li>
        <li><strong>Clear inputs</strong> - Reset both panels with one click</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>What is a diff in programming?</h3>
      <p>
        A diff (difference) is a display of the differences between two files or texts. It shows
        which lines were added, removed, or changed. Diffs are commonly used in version control
        systems like Git to review code changes before committing.
      </p>

      <h3>Can I compare code with this tool?</h3>
      <p>
        Yes, this tool works great for comparing code. It handles any text content including source
        code, configuration files, JSON, XML, and more. The line-by-line and word-level comparison
        helps identify even small changes in code.
      </p>

      <h3>What is the difference between side-by-side and unified diff?</h3>
      <p>
        Side-by-side view shows both versions next to each other, making it easy to see the context
        of each file. Unified diff shows all changes in a single column with added lines marked with
        + and removed lines with -. Choose the view that works best for your needs.
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
