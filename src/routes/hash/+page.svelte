<script>
  import HashTool from '$lib/tools/HashTool.svelte'

  const pageTitle = 'Hash Calculator - DevUtils | Online MD5, SHA Generator'
  const pageDescription = 'Calculate cryptographic hashes online. Generate MD5, SHA-1, SHA-256, SHA-512 hashes instantly. Free hash calculator for developers and security professionals.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/hash'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="hash calculator, MD5 generator, SHA-256, SHA-1, SHA-512, online hash, cryptographic hash, checksum generator" />
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
    "name": "Hash Calculator",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "MD5 hash calculation",
      "SHA-1 hash calculation",
      "SHA-256 hash calculation",
      "SHA-512 hash calculation",
      "Real-time computation",
      "Copy hash to clipboard"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <HashTool />

    <div class="seo-section">
      <section class="seo-content" aria-labelledby="what-is">
        <h2 id="what-is">What is a Hash Function?</h2>
        <p>
          A hash function is a cryptographic algorithm that takes an input of any size and produces a
          fixed-size string of characters, known as a hash value or digest. Hash functions are designed
          to be one-way functions, meaning it's practically impossible to reverse the process and get
          the original input from the hash.
        </p>
      </section>

      <section class="seo-content" aria-labelledby="how-to-use">
        <h2 id="how-to-use">How to Use Hash Calculator</h2>
        <ol>
          <li><strong>Enter your text</strong> - Type or paste the text you want to hash</li>
          <li><strong>Select algorithms</strong> - Choose which hash algorithms to calculate (MD5, SHA-1, SHA-256, SHA-512)</li>
          <li><strong>View results</strong> - Hashes are calculated automatically as you type</li>
          <li><strong>Copy hashes</strong> - Click the copy button next to any hash to copy it</li>
        </ol>
      </section>

      <section class="seo-content" aria-labelledby="features">
        <h2 id="features">Hash Calculator Features</h2>
        <ul>
          <li><strong>Multiple algorithms</strong> - Supports MD5, SHA-1, SHA-256, and SHA-512</li>
          <li><strong>Real-time calculation</strong> - Hashes update instantly as you type</li>
          <li><strong>Secure computation</strong> - Uses native Web Crypto API</li>
          <li><strong>One-click copy</strong> - Copy any hash with a single click</li>
          <li><strong>Lowercase output</strong> - Consistent lowercase hexadecimal format</li>
          <li><strong>Auto-save</strong> - Saves your input automatically</li>
        </ul>
      </section>

      <section class="seo-content" aria-labelledby="faq">
        <h2 id="faq">Frequently Asked Questions</h2>

        <h3>What is the difference between MD5 and SHA-256?</h3>
        <p>
          MD5 produces a 128-bit hash and is considered cryptographically broken for security purposes.
          SHA-256 produces a 256-bit hash and is currently considered secure. Use SHA-256 for security-critical applications.
        </p>

        <h3>Can I reverse a hash to get the original text?</h3>
        <p>
          No, hash functions are designed to be one-way. While brute-force attacks are possible for short
          or common passwords, properly designed hash functions cannot be reversed mathematically.
        </p>

        <h3>Are my hashes calculated securely?</h3>
        <p>
          Yes, all hash calculations are performed locally in your browser using the Web Crypto API.
          Your data never leaves your device.
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
