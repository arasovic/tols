<script>
  import JwtEncoderTool from '$lib/tools/JwtEncoderTool.svelte'

  const pageTitle = 'JWT Encoder - DevUtils | Create and Sign JWT Tokens'
  const pageDescription = 'Free online JWT encoder tool for web developers. Create and sign JSON Web Tokens instantly with HS256 algorithm for securely signing web app authentication.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/jwt-encoder'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="JWT encoder, JWT signer, create JWT, HS256, JWT token generator" />
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
    "name": "JWT Encoder",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "HS256 signing",
      "Custom headers",
      "Flexible payload",
      "Real-time preview",
      "One-click copy",
      "Validation"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <JwtEncoderTool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What is JWT Encoder?</h2>
      <p>
        JWT Encoder creates and signs JSON Web Tokens (JWT) using the HS256 algorithm. JWTs are
        compact, self-contained tokens used for authentication and secure information exchange.
        This tool helps developers generate signed tokens for testing APIs, debugging authentication
        flows, and understanding how JWTs work.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use JWT Encoder</h2>
      <ol>
        <li><strong>Enter header</strong> - Input the JWT header (typically contains algorithm and type)</li>
        <li><strong>Add payload</strong> - Enter the claims and data for your token</li>
        <li><strong>Provide secret</strong> - Enter the secret key for signing</li>
        <li><strong>Generate token</strong> - Click to create and sign your JWT</li>
        <li><strong>Copy result</strong> - Copy the complete encoded token</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">JWT Encoder Features</h2>
      <ul>
        <li><strong>HS256 signing</strong> - HMAC with SHA-256 algorithm support</li>
        <li><strong>Custom headers</strong> - Define your own JWT headers</li>
        <li><strong>Flexible payload</strong> - Add any claims and custom data</li>
        <li><strong>Real-time preview</strong> - See encoded parts as you type</li>
        <li><strong>One-click copy</strong> - Copy the complete JWT instantly</li>
        <li><strong>Validation</strong> - Checks for valid JSON in header and payload</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>What is a JWT token used for?</h3>
      <p>
        JWT tokens are used for authentication and authorization in web applications. After a user
        logs in, the server issues a JWT that the client can use to prove identity on subsequent
        requests. They're commonly used in REST APIs, single sign-on systems, and microservices.
      </p>

      <h3>What is HS256?</h3>
      <p>
        HS256 stands for HMAC with SHA-256. It's a symmetric signing algorithm where the same secret
        key is used to sign and verify the token. This tool uses HS256, which is widely supported
        and suitable for many applications.
      </p>

      <h3>Is the secret key safe when using this tool?</h3>
      <p>
        The JWT encoding happens entirely in your browser. The secret key and all data are never
        sent to any server. However, you should still use test secrets and never use production
        secrets in online tools as a security best practice.
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
