/**
 * Single source of truth for all tool metadata.
 *
 * Every surface (homepage grid, Cmd+K search, sidebar navigation, header
 * titles, sitemap) derives from this list. Adding a tool = one entry here
 * plus the route/component.
 */
import {
  Code,
  Binary,
  Link,
  Fingerprint,
  Hash,
  KeyRound,
  Palette,
  Clock,
  ScanSearch,
  FileText,
  FileJson,
  FileCode,
  Timer,
  FileStack,
  GitCompare,
  Database,
  FileType,
  Lock,
  QrCode,
  Image,
  Languages,
  Globe,
  Barcode,
  Shield,
  Calculator,
  FileDigit,
  FileBarChart,
  Zap
} from 'lucide-svelte'

/**
 * Tool categories, in display order.
 * @type {Array<{id: string, label: string}>}
 */
export const categories = [
  { id: 'data', label: 'Data' },
  { id: 'encoding', label: 'Encoding' },
  { id: 'generators', label: 'Generators' },
  { id: 'converters', label: 'Converters' }
]

/**
 * @typedef {Object} ToolDefinition
 * @property {string} id Route path segment, e.g. 'jwt-encoder' → /jwt-encoder
 * @property {string} name Canonical display name (homepage card, search, header)
 * @property {string} label Short label for the sidebar
 * @property {string} description One-line description (homepage card + search)
 * @property {string} category Category id, must exist in `categories`
 * @property {any} icon Lucide icon component
 * @property {string[]} aliases Extra search terms
 * @property {boolean} [popular] Shown in the homepage "Popular Tools" strip
 */

/**
 * All tools in canonical display order (grouped by category).
 * @type {ToolDefinition[]}
 */
export const tools = [
  // Data
  {
    id: 'json',
    name: 'JSON Formatter',
    label: 'JSON',
    description: 'Format, validate & beautify JSON data with syntax highlighting',
    category: 'data',
    icon: Code,
    aliases: ['json', 'formatter', 'validator', 'prettify', 'beautifier', 'parse'],
    popular: true
  },
  {
    id: 'yaml',
    name: 'YAML Formatter',
    label: 'YAML',
    description: 'Format, validate, and convert YAML to JSON',
    category: 'data',
    icon: FileJson,
    aliases: ['yaml', 'yml', 'formatter', 'converter', 'parse']
  },
  {
    id: 'xml',
    name: 'XML Formatter',
    label: 'XML',
    description: 'Format, validate, and minify XML data',
    category: 'data',
    icon: FileStack,
    aliases: ['xml', 'formatter', 'validator', 'minify', 'parse']
  },
  {
    id: 'html',
    name: 'HTML Formatter',
    label: 'HTML',
    description: 'Beautify, minify, and clean HTML',
    category: 'data',
    icon: FileCode,
    aliases: ['html', 'formatter', 'beautifier', 'minify', 'clean']
  },
  {
    id: 'markdown',
    name: 'Markdown Previewer',
    label: 'Markdown',
    description: 'Live preview and convert Markdown to HTML',
    category: 'data',
    icon: FileType,
    aliases: ['markdown', 'md', 'preview', 'converter', 'html']
  },
  {
    id: 'regex',
    name: 'Regex Tester',
    label: 'Regex',
    description: 'Test & validate regular expressions with real-time matching',
    category: 'data',
    icon: ScanSearch,
    aliases: ['regex', 'regexp', 'regular expression', 'test', 'match', 'pattern']
  },
  {
    id: 'diff',
    name: 'Diff Checker',
    label: 'Diff',
    description: 'Compare two texts and find differences',
    category: 'data',
    icon: GitCompare,
    aliases: ['diff', 'compare', 'difference', 'text compare', 'checker']
  },
  {
    id: 'sql',
    name: 'SQL Formatter',
    label: 'SQL',
    description: 'Format and beautify SQL queries',
    category: 'data',
    icon: Database,
    aliases: ['sql', 'formatter', 'query', 'beautifier', 'mysql', 'postgres']
  },

  // Encoding
  {
    id: 'base64',
    name: 'Base64 Encoder/Decoder',
    label: 'Base64',
    description: 'Encode & decode Base64 strings for data transmission',
    category: 'encoding',
    icon: Binary,
    aliases: ['base64', 'base 64', 'encode', 'decode', 'converter'],
    popular: true
  },
  {
    id: 'url',
    name: 'URL Encoder/Decoder',
    label: 'URL',
    description: 'Encode & decode URLs and query parameters safely',
    category: 'encoding',
    icon: Link,
    aliases: ['url', 'encode', 'decode', 'uri', 'percent encode', 'query']
  },
  {
    id: 'jwt',
    name: 'JWT Decoder',
    label: 'JWT',
    description: 'Decode and inspect JWT token payload and signatures',
    category: 'encoding',
    icon: KeyRound,
    aliases: ['jwt', 'json web token', 'decode', 'token', 'bearer', 'auth'],
    popular: true
  },
  {
    id: 'jwt-encoder',
    name: 'JWT Encoder',
    label: 'JWT Encoder',
    description: 'Create and sign JWT tokens with HS256',
    category: 'encoding',
    icon: Lock,
    aliases: ['jwt', 'encoder', 'sign', 'token', 'hs256', 'auth']
  },
  {
    id: 'jsonp',
    name: 'JSONP Tester',
    label: 'JSONP',
    description: 'Simulate JSONP requests and parse responses',
    category: 'encoding',
    icon: Code,
    aliases: ['jsonp', 'json with padding', 'callback', 'api', 'test']
  },
  {
    id: 'gzip',
    name: 'Gzip Calculator',
    label: 'Gzip',
    description: 'Estimate compression size for Gzip',
    category: 'encoding',
    icon: FileBarChart,
    aliases: ['gzip', 'compression', 'size', 'estimate', 'zip']
  },
  {
    id: 'data-uri',
    name: 'Data URI Generator',
    label: 'Data URI',
    description: 'Convert files to Data URIs',
    category: 'encoding',
    icon: FileDigit,
    aliases: ['data uri', 'base64', 'converter', 'file', 'encode']
  },

  // Generators
  {
    id: 'uuid',
    name: 'UUID Generator',
    label: 'UUID',
    description: 'Generate UUID v4 identifiers for your applications',
    category: 'generators',
    icon: Fingerprint,
    aliases: ['uuid', 'guid', 'generate', 'v4', 'identifier', 'unique id'],
    popular: true
  },
  {
    id: 'hash',
    name: 'Hash Calculator',
    label: 'Hash',
    description: 'Calculate MD5, SHA-1, SHA-256, SHA-512 hashes',
    category: 'generators',
    icon: Hash,
    aliases: ['hash', 'md5', 'sha', 'sha256', 'checksum', 'calculate'],
    popular: true
  },
  {
    id: 'lorem',
    name: 'Lorem Ipsum Generator',
    label: 'Lorem',
    description: 'Generate placeholder text for mockups and prototypes',
    category: 'generators',
    icon: FileText,
    aliases: ['lorem', 'ipsum', 'placeholder', 'text', 'dummy', 'mockup']
  },
  {
    id: 'qrcode',
    name: 'QR Code Generator',
    label: 'QR Code',
    description: 'Generate QR codes from text or URLs',
    category: 'generators',
    icon: QrCode,
    aliases: ['qr', 'qrcode', 'generate', 'barcode', 'scan']
  },
  {
    id: 'barcode',
    name: 'Barcode Generator',
    label: 'Barcode',
    description: 'Generate Code128 barcodes',
    category: 'generators',
    icon: Barcode,
    aliases: ['barcode', 'code128', 'generate', 'scan']
  },
  {
    id: 'password',
    name: 'Password Generator',
    label: 'Password',
    description: 'Generate secure random passwords with entropy display',
    category: 'generators',
    icon: Shield,
    aliases: ['password', 'generate', 'secure', 'random', 'strong', 'pass']
  },
  {
    id: 'placeholder',
    name: 'Image Placeholder',
    label: 'Placeholder',
    description: 'Generate colored placeholder images',
    category: 'generators',
    icon: Image,
    aliases: ['placeholder', 'image', 'dummy', 'mockup', 'placeholder image']
  },

  // Converters
  {
    id: 'color',
    name: 'Color Converter',
    label: 'Color',
    description: 'Convert between HEX, RGB, HSL color formats',
    category: 'converters',
    icon: Palette,
    aliases: ['color', 'hex', 'rgb', 'hsl', 'convert', 'picker']
  },
  {
    id: 'timestamp',
    name: 'Timestamp Converter',
    label: 'Timestamp',
    description: 'Convert Unix timestamps to readable dates and times',
    category: 'converters',
    icon: Clock,
    aliases: ['timestamp', 'unix', 'epoch', 'convert', 'date', 'time']
  },
  {
    id: 'timezone',
    name: 'Time Zone Converter',
    label: 'Timezone',
    description: 'Convert times between different time zones',
    category: 'converters',
    icon: Globe,
    aliases: ['timezone', 'time zone', 'convert', 'utc', 'gmt']
  },
  {
    id: 'base-converter',
    name: 'Number Base Converter',
    label: 'Base Conv',
    description: 'Convert between decimal, binary, hex, and octal',
    category: 'converters',
    icon: Calculator,
    aliases: ['base', 'binary', 'hex', 'decimal', 'octal', 'convert', 'number']
  },
  {
    id: 'cron',
    name: 'Cron Parser',
    label: 'Cron',
    description: 'Validate cron expressions and see next execution times',
    category: 'converters',
    icon: Timer,
    aliases: ['cron', 'crontab', 'schedule', 'parser', 'expression']
  },
  {
    id: 'unicode',
    name: 'Unicode Inspector',
    label: 'Unicode',
    description: 'Explore Unicode characters and their properties',
    category: 'converters',
    icon: Languages,
    aliases: ['unicode', 'character', 'emoji', 'code point', 'utf']
  },
  {
    id: 'css',
    name: 'CSS Formatter',
    label: 'CSS',
    description: 'Beautify and minify CSS',
    category: 'converters',
    icon: Palette,
    aliases: ['css', 'formatter', 'beautify', 'minify', 'style']
  },
  {
    id: 'css-filter',
    name: 'CSS Filter Generator',
    label: 'CSS Filter',
    description: 'Apply visual CSS filters',
    category: 'converters',
    icon: Zap,
    aliases: ['css', 'filter', 'blur', 'brightness', 'contrast', 'effect']
  }
]

/** @type {Map<string, ToolDefinition>} */
const toolsById = new Map(tools.map(tool => [tool.id, tool]))

/** @type {Map<string, string>} */
const categoryLabels = new Map(categories.map(category => [category.id, category.label]))

/**
 * Look up a tool by its route id.
 * @param {string} id
 * @returns {ToolDefinition | undefined}
 */
export function getTool(id) {
  return toolsById.get(id)
}

/**
 * Category label for a category id ('' when unknown).
 * @param {string} categoryId
 * @returns {string}
 */
export function getCategoryLabel(categoryId) {
  return categoryLabels.get(categoryId) ?? ''
}
