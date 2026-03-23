<script>
  import GzipTool from '$lib/tools/GzipTool.svelte'

  const pageTitle = 'Gzip Calculator - DevUtils | Estimate Compression Size'
  const pageDescription = 'Free online Gzip compression calculator tool for web developers. Estimate gzip compression size and analyze bandwidth savings for content optimization.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/gzip'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="gzip calculator, compression ratio, gzip compression, file size estimator" />
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
    "name": "Gzip Calculator",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "Size estimation",
      "Compression ratio",
      "Real-time calculation",
      "Byte-level precision",
      "Multiple formats",
      "Performance insights"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <GzipTool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What is Gzip Compression?</h2>
      <p>
        Gzip is a file format and software application used for file compression and decompression.
        It's widely used on the web to reduce the size of HTML, CSS, JavaScript, and other text-based
        files before sending them over the network. This tool helps you estimate the compression
        ratio and size savings you can achieve with gzip.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use Gzip Calculator</h2>
      <ol>
        <li><strong>Enter your text</strong> - Paste the content you want to analyze</li>
        <li><strong>See compression stats</strong> - View original size, compressed size, and ratio</li>
        <li><strong>Analyze savings</strong> - Understand how much bandwidth you'll save</li>
        <li><strong>Optimize content</strong> - Use insights to improve your web performance</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">Gzip Calculator Features</h2>
      <ul>
        <li><strong>Size estimation</strong> - Calculate compressed size before deployment</li>
        <li><strong>Compression ratio</strong> - See percentage of size reduction</li>
        <li><strong>Real-time calculation</strong> - Instant results as you type</li>
        <li><strong>Byte-level precision</strong> - Accurate size measurements</li>
        <li><strong>Multiple formats</strong> - View sizes in bytes and human-readable format</li>
        <li><strong>Performance insights</strong> - Understand your content's compressibility</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>What types of content compress well with gzip?</h3>
      <p>
        Text-based content like HTML, CSS, JavaScript, JSON, and XML compress very well with gzip,
        often achieving 60-80% size reduction. Content with lots of repeated patterns, whitespace,
        and common words compresses best. Already compressed content like images, videos, and
        pre-compressed archives see little additional benefit from gzip.
      </p>

      <h3>Should I always enable gzip on my server?</h3>
      <p>
        Yes, gzip compression should be enabled on your web server for all text-based content.
        The CPU overhead of compression is minimal compared to the bandwidth savings. Modern servers
        can compress on-the-fly efficiently, and browsers have supported gzip decompression for decades.
      </p>

      <h3>What compression level should I use?</h3>
      <p>
        Most web servers default to compression level 6, which offers a good balance between
        compression ratio and CPU usage. Levels 1-3 offer faster compression with less size reduction,
        while levels 7-9 offer maximum compression at the cost of more CPU time. Level 6 is
        recommended for most use cases.
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
