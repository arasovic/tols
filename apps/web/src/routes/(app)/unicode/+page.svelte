<script>
  import UnicodeTool from '$lib/tools/UnicodeTool.svelte'

  const pageTitle = 'Unicode Inspector - DevUtils | Explore Unicode Characters'
  const pageDescription = 'Free online Unicode inspector tool for developers. Explore Unicode characters, codepoints, categories, and special symbols instantly with search included.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/unicode'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="Unicode inspector, Unicode characters, codepoint lookup, Unicode search" />
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
    "name": "Unicode Inspector",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "Character details",
      "Block information",
      "Escape sequences",
      "Multi-character analysis",
      "Search functionality",
      "One-click copy"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <UnicodeTool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What is Unicode Inspector?</h2>
      <p>
        Unicode Inspector is a tool for exploring Unicode characters and their properties. Unicode
        is a universal character encoding standard that assigns a unique number to every character
        across all writing systems. This tool helps developers and linguists inspect character
        codepoints, names, categories, and other Unicode properties.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use Unicode Inspector</h2>
      <ol>
        <li><strong>Enter characters</strong> - Type or paste text to inspect its Unicode properties</li>
        <li><strong>View details</strong> - See codepoints, names, and categories for each character</li>
        <li><strong>Search by codepoint</strong> - Enter a Unicode codepoint to find the character</li>
        <li><strong>Copy information</strong> - Copy character data for use in your projects</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">Unicode Inspector Features</h2>
      <ul>
        <li><strong>Character details</strong> - View codepoints, names, and categories</li>
        <li><strong>Block information</strong> - See which Unicode block a character belongs to</li>
        <li><strong>Escape sequences</strong> - Get JavaScript, CSS, and HTML escape codes</li>
        <li><strong>Multi-character analysis</strong> - Inspect entire strings at once</li>
        <li><strong>Search functionality</strong> - Find characters by name or codepoint</li>
        <li><strong>One-click copy</strong> - Copy character or escape sequences easily</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>What is a Unicode codepoint?</h3>
      <p>
        A Unicode codepoint is a number assigned to each character in the Unicode standard. Codepoints
        are typically written as U+ followed by hexadecimal, like U+0041 for the letter 'A'. Unicode
        supports over 140,000 characters covering virtually all writing systems in use today.
      </p>

      <h3>What are Unicode character categories?</h3>
      <p>
        Unicode assigns each character a general category like Letter (L), Mark (M), Number (N),
        Symbol (S), Separator (Z), or Other (C). These categories help software determine how to
        process text, such as where line breaks can occur or which characters are part of words.
      </p>

      <h3>Why do I need escape sequences?</h3>
      <p>
        Escape sequences allow you to represent special characters in code or markup when direct
        entry isn't possible or might cause issues. For example, you might need to escape emojis,
        special symbols, or non-ASCII characters when writing code, JSON, or CSS to ensure proper
        encoding and display.
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
