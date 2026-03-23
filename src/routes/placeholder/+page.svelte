<script>
  import PlaceholderTool from '$lib/tools/PlaceholderTool.svelte'

  const pageTitle = 'Image Placeholder - DevUtils | Generate Placeholder Images'
  const pageDescription = 'Free online placeholder image generator tool for designers. Create colored placeholder images instantly for mockups, prototypes, and website design projects.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/placeholder'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="placeholder image, image placeholder, mockup image generator" />
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
    "name": "Image Placeholder Generator",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "Custom dimensions",
      "Color selection",
      "Custom text",
      "PNG output",
      "Instant generation",
      "Copy URL"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <PlaceholderTool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What is Image Placeholder Generator?</h2>
      <p>
        Image Placeholder Generator creates simple colored placeholder images for use in wireframes,
        mockups, and prototypes. These placeholder images help designers and developers visualize
        layout and spacing without needing actual content images, speeding up the design process.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use Image Placeholder Generator</h2>
      <ol>
        <li><strong>Set dimensions</strong> - Enter the width and height for your placeholder</li>
        <li><strong>Choose color</strong> - Select a background color for the placeholder</li>
        <li><strong>Add text (optional)</strong> - Include custom text on the placeholder</li>
        <li><strong>Generate and download</strong> - Create and save your placeholder image</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">Image Placeholder Generator Features</h2>
      <ul>
        <li><strong>Custom dimensions</strong> - Any width and height combination</li>
        <li><strong>Color selection</strong> - Choose any background color</li>
        <li><strong>Custom text</strong> - Add dimension labels or custom text</li>
        <li><strong>PNG output</strong> - Download as high-quality PNG images</li>
        <li><strong>Instant generation</strong> - Create placeholders in seconds</li>
        <li><strong>Copy URL</strong> - Get a data URL for direct use in HTML/CSS</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>Why use placeholder images?</h3>
      <p>
        Placeholder images help designers and developers create layouts before final content is ready.
        They allow you to test responsive designs, verify image aspect ratios, and present prototypes
        to clients without waiting for actual photography or graphics to be completed.
      </p>

      <h3>What size should I make my placeholders?</h3>
      <p>
        Create placeholders at the exact dimensions they will appear in your design. This helps you
        verify that images fit correctly in their containers and maintain proper aspect ratios.
        Common sizes include 1920x1080 for hero images, 800x600 for content images, and 400x400
        for thumbnails or avatars.
      </p>

      <h3>Can I use these placeholders in production?</h3>
      <p>
        While placeholder images are primarily intended for development and prototyping, you can
        technically use them in production. However, it's recommended to replace them with actual
        content before launch. Placeholders are most useful during the design and development phases.
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
