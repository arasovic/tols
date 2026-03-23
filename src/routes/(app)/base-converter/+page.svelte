<script>
  import BaseConverterTool from '$lib/tools/BaseConverterTool.svelte'

  const pageTitle = 'Number Base Converter - DevUtils | Decimal Binary Hex'
  const pageDescription = 'Free online number base converter tool for developers. Convert between decimal, binary, hexadecimal, and octal number systems instantly with full support.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/base-converter'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="base converter, decimal to binary, hex converter, octal converter" />
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
    "name": "Number Base Converter",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "Four bases",
      "Real-time conversion",
      "Input validation",
      "Prefix options",
      "One-click copy",
      "Large numbers"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <BaseConverterTool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What is Number Base Converter?</h2>
      <p>
        Number Base Converter is a tool for converting numbers between different numeral systems.
        It supports binary (base-2), octal (base-8), decimal (base-10), and hexadecimal (base-16)
        conversions. This is essential for programming, digital electronics, and computer science
        work where different bases are commonly used.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use Number Base Converter</h2>
      <ol>
        <li><strong>Enter a number</strong> - Type your number in any supported base</li>
        <li><strong>See conversions</strong> - View the number converted to all other bases instantly</li>
        <li><strong>Copy results</strong> - Click copy buttons to copy any base representation</li>
        <li><strong>Input validation</strong> - Tool validates input for each number base</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">Number Base Converter Features</h2>
      <ul>
        <li><strong>Four bases</strong> - Binary, octal, decimal, and hexadecimal support</li>
        <li><strong>Real-time conversion</strong> - Instant results as you type</li>
        <li><strong>Input validation</strong> - Validates characters for each base</li>
        <li><strong>Prefix options</strong> - Optional 0x, 0b, 0o prefixes for programming</li>
        <li><strong>One-click copy</strong> - Copy any base result instantly</li>
        <li><strong>Large numbers</strong> - Supports numbers up to JavaScript's safe integer limit</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>What are number bases used for?</h3>
      <p>
        Different number bases are used in various computing contexts. Binary (base-2) is the
        fundamental language of computers. Hexadecimal (base-16) is used in programming for
        memory addresses, color codes, and binary data representation. Octal (base-8) was
        historically used in Unix systems for file permissions.
      </p>

      <h3>Why is hexadecimal used in programming?</h3>
      <p>
        Hexadecimal is compact and maps directly to binary - each hex digit represents exactly
        4 binary bits. This makes it much easier to read and write binary data. For example,
        the binary value 111100001010 is F0A in hex, which is far more readable. It's used for
        color codes (#RRGGBB), memory addresses, and byte values.
      </p>

      <h3>What is the largest number this converter supports?</h3>
      <p>
        This converter supports numbers up to JavaScript's safe integer limit of 9,007,199,254,740,991
        (2^53 - 1). Beyond this limit, precision may be lost. For most practical programming and
        computing purposes, this range is sufficient. The tool validates inputs to ensure accuracy.
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
