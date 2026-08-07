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
  const tool = getTool(params.tool)
  if (!tool) {
    // An unknown slug must 404, not render an empty shell. Without this check
    // a typo like /xmll would match [tool] and emit a blank page with a
    // valid-looking canonical — a new indexable garbage page for every typo.
    throw error(404, `No tool named "${params.tool}"`)
  }
  const mod = await loaders[params.tool]()
  return { component: mod.default }
}