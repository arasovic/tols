<script>
  import UuidTool from '$lib/tools/UuidTool.svelte'

  const pageTitle = 'UUID Generator - DevUtils | Free UUID v4 Generator'
  const pageDescription = 'Free online UUID generator tool for web developers. Create version 4 UUIDs instantly for unique identifiers in databases and distributed software apps.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/uuid'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="UUID generator, UUID v4, GUID generator, generate UUID, online UUID, bulk UUID, unique identifier" />
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
    "name": "UUID Generator",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "Generate UUID v4",
      "Bulk UUID generation (up to 100)",
      "Cryptographically secure random generation",
      "One-click copy",
      "Generate multiple formats",
      "Auto-save preferences"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <UuidTool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What is a UUID?</h2>
      <p>
        A UUID (Universally Unique Identifier) is a 128-bit number used to uniquely identify information
        in computer systems. UUID v4 generates random identifiers with an extremely low probability of
        duplicates, making them perfect for database keys, session IDs, and distributed systems.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use UUID Generator</h2>
      <ol>
        <li><strong>Set quantity</strong> - Choose how many UUIDs you want to generate (1-100)</li>
        <li><strong>Click generate</strong> - Press the generate button to create your UUIDs</li>
        <li><strong>Copy results</strong> - Click the copy button to copy all generated UUIDs</li>
        <li><strong>Regenerate</strong> - Click again to generate new random UUIDs</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">UUID Generator Features</h2>
      <ul>
        <li><strong>UUID v4 standard</strong> - Generates RFC 4122 compliant version 4 UUIDs</li>
        <li><strong>Bulk generation</strong> - Generate up to 100 UUIDs at once</li>
        <li><strong>Cryptographically secure</strong> - Uses browser crypto API for randomness</li>
        <li><strong>Standard format</strong> - Output in xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx format</li>
        <li><strong>One-click copy</strong> - Copy all generated UUIDs instantly</li>
        <li><strong>Save preferences</strong> - Remembers your last used quantity</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>What is the probability of duplicate UUIDs?</h3>
      <p>
        The probability of generating duplicate UUID v4 is extremely low - approximately 1 in 2.71 quintillion.
        For practical purposes, you can assume UUIDs are unique.
      </p>

      <h3>What is UUID v4?</h3>
      <p>
        UUID v4 is a version of UUID that generates random identifiers. The '4' in the version field
        indicates random generation, with 122 bits of randomness.
      </p>

      <h3>Can I use these UUIDs in production?</h3>
      <p>
        Yes, the UUIDs generated here are cryptographically secure and suitable for production use.
        They use the browser's crypto.getRandomValues() API for randomness.
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
