<script>
  import Base64Tool from '$lib/tools/Base64Tool.svelte'

  const pageTitle = 'Base64 Encoder/Decoder - DevUtils | Online Base64 Converter'
  const pageDescription = 'Free online Base64 encoder and decoder tool for developers. Encode and decode Base64 text instantly with full UTF-8 support for web development projects.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/base64'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="Base64 encoder, Base64 decoder, Base64 converter, online Base64, encode Base64, decode Base64, URL-safe Base64" />
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
    "name": "Base64 Encoder/Decoder",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "Encode text to Base64",
      "Decode Base64 to text",
      "URL-safe Base64 encoding",
      "Real-time conversion",
      "Copy to clipboard",
      "Auto-save input"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <Base64Tool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What is Base64?</h2>
      <p>
        Base64 is an encoding scheme that converts binary data into ASCII text. It's commonly used to encode
        data for transmission over text-based protocols like email and HTTP. The name comes from the fact that
        it uses 64 printable characters to represent data.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use Base64 Encoder/Decoder</h2>
      <ol>
        <li><strong>Choose mode</strong> - Select "Encode" to convert text to Base64, or "Decode" to convert Base64 to text</li>
        <li><strong>Enter your data</strong> - Paste your text or Base64 string into the input field</li>
        <li><strong>Get instant results</strong> - The conversion happens automatically as you type</li>
        <li><strong>Copy output</strong> - Click the copy button to copy the result to your clipboard</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">Base64 Tool Features</h2>
      <ul>
        <li><strong>Bi-directional conversion</strong> - Encode and decode with a single click</li>
        <li><strong>Real-time processing</strong> - Results update as you type</li>
        <li><strong>URL-safe encoding</strong> - Supports URL-safe Base64 variants</li>
        <li><strong>Error detection</strong> - Shows invalid Base64 input errors</li>
        <li><strong>One-click copy</strong> - Copy results instantly</li>
        <li><strong>Auto-save</strong> - Your settings are saved automatically</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>When should I use Base64 encoding?</h3>
      <p>
        Base64 is used when you need to encode binary data as text, such as embedding images in HTML/CSS,
        encoding data in URLs, or transmitting binary data over text-based protocols.
      </p>

      <h3>Is Base64 encryption?</h3>
      <p>
        No, Base64 is not encryption. It's an encoding scheme that makes data safe for text transmission.
        Anyone can decode Base64, so it should not be used for secure data transmission.
      </p>

      <h3>What is URL-safe Base64?</h3>
      <p>
        URL-safe Base64 replaces the standard + and / characters with - and _ respectively, making it safe
        for use in URLs and filenames without additional encoding.
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
