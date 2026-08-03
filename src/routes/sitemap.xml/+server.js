import { base } from '$app/paths'
import { tools } from '$lib/config/registry.js'

export const prerender = true

const siteUrl = process.env.PUBLIC_SITE_URL || 'https://arasovic.github.io'

// Home + every tool route, derived from the registry so the sitemap can
// never drift from the tool list again.
const routes = [
  { path: '', priority: '1.0', changefreq: 'weekly' },
  ...tools.map(tool => ({ path: `/${tool.id}`, priority: '0.8', changefreq: 'monthly' }))
]

export async function GET() {
  const now = new Date().toISOString().split('T')[0]

  const urls = routes.map(route => {
    const loc = `${siteUrl}${base}${route.path}`
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  }).join('\n')

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml'
    }
  })
}
