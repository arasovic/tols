<script>
  import JwtTool from '$lib/tools/JwtTool.svelte'

  const pageTitle = 'JWT Decoder - DevUtils | Online JSON Web Token Inspector'
  const pageDescription = 'Free online JWT decoder tool for web developers. Decode JSON Web Tokens instantly to view header, payload, and verify token signatures for debugging now.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/jwt'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="JWT decoder, JWT debugger, JSON Web Token, JWT inspector, decode JWT, JWT parser, online JWT tool" />
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
    "name": "JWT Decoder",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "Decode JWT header",
      "Decode JWT payload",
      "Pretty-print JSON",
      "Token validation",
      "Base64 URL decoding",
      "Copy decoded parts"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <JwtTool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What is JWT?</h2>
      <p>
        JSON Web Token (JWT) is an open standard (RFC 7519) that defines a compact and self-contained
        way for securely transmitting information between parties as a JSON object. JWTs are commonly
        used for authentication and information exchange in modern web applications.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use JWT Decoder</h2>
      <ol>
        <li><strong>Paste your JWT</strong> - Copy and paste your complete JWT token into the input field</li>
        <li><strong>View decoded data</strong> - The header and payload are automatically decoded and displayed</li>
        <li><strong>Inspect claims</strong> - Review the token's claims, expiration, issuer, and other data</li>
        <li><strong>Copy parts</strong> - Copy the decoded header or payload separately</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">JWT Decoder Features</h2>
      <ul>
        <li><strong>Header decoding</strong> - View the algorithm and token type</li>
        <li><strong>Payload inspection</strong> - See all claims including custom data</li>
        <li><strong>JSON formatting</strong> - Pretty-printed, readable output</li>
        <li><strong>Real-time decoding</strong> - Instant results as you type</li>
        <li><strong>Error detection</strong> - Identifies malformed tokens</li>
        <li><strong>One-click copy</strong> - Copy decoded sections easily</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>Is it safe to paste my JWT here?</h3>
      <p>
        Yes, all decoding happens in your browser. Your JWT is never sent to any server.
        However, never share JWTs containing sensitive production data in any online tool.
      </p>

      <h3>What are the three parts of a JWT?</h3>
      <p>
        A JWT consists of three parts separated by dots: Header (algorithm and type),
        Payload (claims and data), and Signature (verification). The tool decodes the
        header and payload which are Base64Url encoded.
      </p>

      <h3>Can this tool verify the signature?</h3>
      <p>
        This tool decodes the header and payload for inspection but does not verify signatures.
        Signature verification requires the secret key or public key, which should only be done
        in secure server environments.
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
