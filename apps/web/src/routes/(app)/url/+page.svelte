<script>
  import UrlTool from '$lib/tools/UrlTool.svelte'

  const pageTitle = 'URL Encoder/Decoder - DevUtils | Online URL Converter'
  const pageDescription = 'Free online URL encoder and decoder tool for web developers. Encode and decode URL components instantly with full character support for all development.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/url'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="URL encoder, URL decoder, URL converter, percent encoding, URL escape, online URL tool, encode URL, decode URL" />
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
    "name": "URL Encoder/Decoder",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "Encode URLs to percent-encoded format",
      "Decode percent-encoded URLs",
      "Full URL encoding support",
      "Special character handling",
      "Real-time conversion",
      "Copy to clipboard"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <UrlTool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What is URL Encoding?</h2>
      <p>
        URL encoding (also known as percent-encoding) is a mechanism for encoding information in a Uniform
        Resource Locator (URL). It replaces unsafe ASCII characters with a "%" followed by two hexadecimal digits.
        This ensures that URLs can be safely transmitted over the internet.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use URL Encoder/Decoder</h2>
      <ol>
        <li><strong>Select mode</strong> - Choose "Encode" or "Decode" based on your needs</li>
        <li><strong>Enter URL or text</strong> - Paste the URL or text you want to encode or decode</li>
        <li><strong>View results</strong> - The converted output appears automatically</li>
        <li><strong>Copy output</strong> - Use the copy button to copy the result</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">URL Tool Features</h2>
      <ul>
        <li><strong>Full encoding support</strong> - Handles all special characters per RFC 3986</li>
        <li><strong>Decode mode</strong> - Convert percent-encoded URLs back to readable text</li>
        <li><strong>Real-time conversion</strong> - Results update as you type</li>
        <li><strong>Space handling</strong> - Properly encodes spaces as %20</li>
        <li><strong>Unicode support</strong> - Handles international characters</li>
        <li><strong>Auto-save</strong> - Saves your work automatically</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>What characters need to be URL encoded?</h3>
      <p>
        Characters that need encoding include spaces, special characters like @, #, $, %, &, +, and non-ASCII
        characters. Alphanumeric characters (A-Z, a-z, 0-9) and some special characters (-, _, ., ~) don't need encoding.
      </p>

      <h3>Why do URLs need encoding?</h3>
      <p>
        URLs have a limited character set. Special characters must be encoded to prevent them from being
        misinterpreted as URL delimiters or control characters during transmission.
      </p>

      <h3>What is the difference between encode and decode?</h3>
      <p>
        Encoding converts special characters to percent-encoded format (e.g., space becomes %20). Decoding
        reverses this process, converting percent-encoded sequences back to their original characters.
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
