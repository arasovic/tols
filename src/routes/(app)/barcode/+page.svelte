<script>
  import BarcodeTool from '$lib/tools/BarcodeTool.svelte'

  const pageTitle = 'Barcode Generator - DevUtils | Create Barcodes'
  const pageDescription = 'Free online barcode generator tool. Create Code128 barcodes instantly for products, labels, inventory management, and retail business purposes online today.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/barcode'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="barcode generator, Code128, barcode creator, free barcode" />
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
    "name": "Barcode Generator",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "Code 128 support",
      "Real-time generation",
      "Customizable size",
      "Display options",
      "PNG download",
      "Print ready"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <BarcodeTool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What is Barcode Generator?</h2>
      <p>
        Barcode Generator creates scannable barcode images from text input. It supports Code 128,
        a high-density linear barcode symbology that can encode all 128 ASCII characters. This makes
        it ideal for inventory management, product labeling, and asset tracking where alphanumeric
        data needs to be encoded.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use Barcode Generator</h2>
      <ol>
        <li><strong>Enter text</strong> - Type the data you want to encode in the barcode</li>
        <li><strong>Generate barcode</strong> - The barcode is created automatically as you type</li>
        <li><strong>Customize appearance</strong> - Adjust width, height, and display options</li>
        <li><strong>Download or copy</strong> - Save the barcode as an image or copy it</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">Barcode Generator Features</h2>
      <ul>
        <li><strong>Code 128 support</strong> - Full ASCII character encoding</li>
        <li><strong>Real-time generation</strong> - Barcode updates as you type</li>
        <li><strong>Customizable size</strong> - Adjust barcode width and height</li>
        <li><strong>Display options</strong> - Show or hide the text below the barcode</li>
        <li><strong>PNG download</strong> - Download barcode as a PNG image</li>
        <li><strong>Print ready</strong> - Generate high-quality barcodes for printing</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>What is Code 128?</h3>
      <p>
        Code 128 is a high-density linear barcode symbology that can encode all 128 ASCII characters.
        It's widely used in shipping, packaging, and inventory management. Code 128 offers excellent
        density and reliability, making it suitable for encoding alphanumeric data like product
        IDs, serial numbers, and tracking codes.
      </p>

      <h3>How do I ensure my barcode will scan correctly?</h3>
      <p>
        For reliable scanning, ensure adequate quiet zones (white space) on both sides of the barcode,
        use sufficient height, and print at high resolution. Test with your intended scanner before
        mass production. Avoid stretching the barcode too wide or printing too small. The human-readable
        text below helps verify the encoded data.
      </p>

      <h3>What can I encode in a Code 128 barcode?</h3>
      <p>
        Code 128 can encode all standard ASCII characters including uppercase letters, lowercase
        letters, numbers, and special characters. This makes it versatile for various applications
        like product SKUs, asset tags, shipping labels, and inventory tracking. However, the more
        characters you encode, the wider the barcode becomes.
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
