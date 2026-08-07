import { error } from '@sveltejs/kit'
import { tools, getTool } from '$lib/config/registry.js'

export const prerender = true

// adapter-static with strict:true will not discover a dynamic route from the
// crawl alone. Declare every tool id so the build emits one page per tool,
// exactly as the 30 static routes did.
export const entries = () => tools.map((tool) => ({ tool: tool.id }))

// Lazy import map, one chunk per tool. A visitor to /xml downloads XmlTool and
// not the other twenty-nine. The specifiers must be static literals — a
// computed `$lib/tools/${id}.svelte` would defeat Vite's static analysis and
// bundle every tool into this page's chunk.
//
// Typed as a Record so `loaders[params.tool]()` type-checks: `params.tool` is
// a plain string here, and the literal key type would reject it. The index is
// still safe — getTool() above already threw 404 for anything not in the map.
/** @type {Record<string, () => Promise<{ default: any }>>} */
const loaders = {
  barcode: () => import('$lib/tools/BarcodeTool.svelte'),
  'base-converter': () => import('$lib/tools/BaseConverterTool.svelte'),
  base64: () => import('$lib/tools/Base64Tool.svelte'),
  color: () => import('$lib/tools/ColorTool.svelte'),
  cron: () => import('$lib/tools/CronTool.svelte'),
  css: () => import('$lib/tools/CssTool.svelte'),
  'css-filter': () => import('$lib/tools/CssFilterTool.svelte'),
  'data-uri': () => import('$lib/tools/DataUriTool.svelte'),
  diff: () => import('$lib/tools/DiffTool.svelte'),
  gzip: () => import('$lib/tools/GzipTool.svelte'),
  hash: () => import('$lib/tools/HashTool.svelte'),
  html: () => import('$lib/tools/HtmlTool.svelte'),
  json: () => import('$lib/tools/JsonTool.svelte'),
  jsonp: () => import('$lib/tools/JsonpTool.svelte'),
  jwt: () => import('$lib/tools/JwtTool.svelte'),
  'jwt-encoder': () => import('$lib/tools/JwtEncoderTool.svelte'),
  lorem: () => import('$lib/tools/LoremTool.svelte'),
  markdown: () => import('$lib/tools/MarkdownTool.svelte'),
  password: () => import('$lib/tools/PasswordTool.svelte'),
  placeholder: () => import('$lib/tools/PlaceholderTool.svelte'),
  qrcode: () => import('$lib/tools/QrcodeTool.svelte'),
  regex: () => import('$lib/tools/RegexTool.svelte'),
  sql: () => import('$lib/tools/SqlTool.svelte'),
  timestamp: () => import('$lib/tools/TimestampTool.svelte'),
  timezone: () => import('$lib/tools/TimezoneTool.svelte'),
  unicode: () => import('$lib/tools/UnicodeTool.svelte'),
  url: () => import('$lib/tools/UrlTool.svelte'),
  uuid: () => import('$lib/tools/UuidTool.svelte'),
  xml: () => import('$lib/tools/XmlTool.svelte'),
  yaml: () => import('$lib/tools/YamlTool.svelte')
}

// load() is awaited by SvelteKit before the page renders, so the awaited
// dynamic import lands in the static HTML — the tool markup is prerendered,
// not an empty shell. load() returning a component is the standard SvelteKit
// code-splitting pattern; on the client the same loader re-imports only the
// matched chunk, so a visitor still downloads just their tool.
export async function load({ params }) {
  // adapter-static writes flat files, so the build emits `xml.html` and
  // GitHub Pages serves it at BOTH /xml and /xml.html. Only /xml is ours —
  // canonical, sitemap and every internal link use it — but the .html form
  // is live whether we like it or not, and it cannot be redirected: Pages is
  // a file server, the file exists, and it answers 200. A visitor landing
  // there gets the correct prerendered page and then, on hydration, a 404 —
  // because `params.tool` is "xml.html" and no tool has that id. Stripping
  // the extension makes the page keep rendering. The duplicate URL is
  // handled the way an unredirectable duplicate always is, by the canonical
  // tag in the head, which already points at /xml.
  const id = params.tool.replace(/\.html$/, '')
  const tool = getTool(id)
  if (!tool) {
    // An unknown slug must 404, not render an empty shell. Without this check
    // a typo like /xmll would match [tool] and emit a blank page with a
    // valid-looking canonical — a new indexable garbage page for every typo.
    throw error(404, `No tool named "${params.tool}"`)
  }
  const mod = await loaders[id]()
  // `id` goes to the page so the head is keyed off the resolved tool rather
  // than the raw param. Deriving it twice would mean the head silently
  // emptied itself on /xml.html while the body rendered fine.
  return { component: mod.default, id }
}