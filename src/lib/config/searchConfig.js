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
  FileInput,
  Image as ImageIcon,
  FileBarChart,
  Type,
  Zap,
  Search
} from 'lucide-svelte'

/**
 * Tool categories
 * @type {Array<{id: string, label: string}>}
 */
export const categories = [
  { id: 'data', label: 'Data' },
  { id: 'encoding', label: 'Encoding' },
  { id: 'generators', label: 'Generators' },
  { id: 'converters', label: 'Converters' },
  { id: 'security', label: 'Security' }
]

/**
 * Complete tool metadata with search aliases
 * @type {Array<{
 *   id: string,
 *   name: string,
 *   description: string,
 *   category: string,
 *   categoryLabel: string,
 *   icon: any,
 *   path: string,
 *   aliases: string[]
 * }>}
 */
export const searchTools = [
  {
    id: 'json',
    name: 'JSON Formatter',
    description: 'Format, validate and beautify JSON data with syntax highlighting',
    category: 'data',
    categoryLabel: 'Data',
    icon: Code,
    path: '/json',
    aliases: ['json', 'formatter', 'validator', 'prettify', 'beautifier', 'parse']
  },
  {
    id: 'yaml',
    name: 'YAML Formatter',
    description: 'Format, validate, and convert YAML to JSON',
    category: 'data',
    categoryLabel: 'Data',
    icon: FileJson,
    path: '/yaml',
    aliases: ['yaml', 'yml', 'formatter', 'converter', 'parse']
  },
  {
    id: 'xml',
    name: 'XML Formatter',
    description: 'Format, validate, and minify XML data',
    category: 'data',
    categoryLabel: 'Data',
    icon: FileStack,
    path: '/xml',
    aliases: ['xml', 'formatter', 'validator', 'minify', 'parse']
  },
  {
    id: 'html',
    name: 'HTML Formatter',
    description: 'Beautify, minify, and clean HTML',
    category: 'data',
    categoryLabel: 'Data',
    icon: FileCode,
    path: '/html',
    aliases: ['html', 'formatter', 'beautifier', 'minify', 'clean']
  },
  {
    id: 'markdown',
    name: 'Markdown Previewer',
    description: 'Live preview and convert Markdown to HTML',
    category: 'data',
    categoryLabel: 'Data',
    icon: FileType,
    path: '/markdown',
    aliases: ['markdown', 'md', 'preview', 'converter', 'html']
  },
  {
    id: 'sql',
    name: 'SQL Formatter',
    description: 'Format and beautify SQL queries',
    category: 'data',
    categoryLabel: 'Data',
    icon: Database,
    path: '/sql',
    aliases: ['sql', 'formatter', 'query', 'beautifier', 'mysql', 'postgres']
  },
  {
    id: 'regex',
    name: 'Regex Tester',
    description: 'Test and validate regular expressions with real-time matching',
    category: 'data',
    categoryLabel: 'Data',
    icon: ScanSearch,
    path: '/regex',
    aliases: ['regex', 'regexp', 'regular expression', 'test', 'match', 'pattern']
  },
  {
    id: 'diff',
    name: 'Diff Checker',
    description: 'Compare two texts and find differences',
    category: 'data',
    categoryLabel: 'Data',
    icon: GitCompare,
    path: '/diff',
    aliases: ['diff', 'compare', 'difference', 'text compare', 'checker']
  },
  {
    id: 'jsonp',
    name: 'JSONP Tester',
    description: 'Simulate JSONP requests and parse responses',
    category: 'data',
    categoryLabel: 'Data',
    icon: Code,
    path: '/jsonp',
    aliases: ['jsonp', 'json with padding', 'callback', 'api', 'test']
  },
  {
    id: 'base64',
    name: 'Base64 Encoder',
    description: 'Encode and decode Base64 strings for data transmission',
    category: 'encoding',
    categoryLabel: 'Encoding',
    icon: Binary,
    path: '/base64',
    aliases: ['base64', 'base 64', 'encode', 'decode', 'converter']
  },
  {
    id: 'url',
    name: 'URL Encoder',
    description: 'Encode and decode URLs and query parameters safely',
    category: 'encoding',
    categoryLabel: 'Encoding',
    icon: Link,
    path: '/url',
    aliases: ['url', 'encode', 'decode', 'uri', 'percent encode', 'query']
  },
  {
    id: 'jwt',
    name: 'JWT Decoder',
    description: 'Decode and inspect JWT token payload and signatures',
    category: 'encoding',
    categoryLabel: 'Encoding',
    icon: KeyRound,
    path: '/jwt',
    aliases: ['jwt', 'json web token', 'decode', 'token', 'bearer', 'auth']
  },
  {
    id: 'jwt-encoder',
    name: 'JWT Encoder',
    description: 'Create and sign JWT tokens with HS256',
    category: 'encoding',
    categoryLabel: 'Encoding',
    icon: Lock,
    path: '/jwt-encoder',
    aliases: ['jwt', 'encoder', 'sign', 'token', 'hs256', 'auth']
  },
  {
    id: 'gzip',
    name: 'Gzip Calculator',
    description: 'Estimate compression size for Gzip',
    category: 'encoding',
    categoryLabel: 'Encoding',
    icon: FileBarChart,
    path: '/gzip',
    aliases: ['gzip', 'compression', 'size', 'estimate', 'zip']
  },
  {
    id: 'data-uri',
    name: 'Data URI Generator',
    description: 'Convert files to Data URIs',
    category: 'encoding',
    categoryLabel: 'Encoding',
    icon: FileDigit,
    path: '/data-uri',
    aliases: ['data uri', 'base64', 'converter', 'file', 'encode']
  },
  {
    id: 'uuid',
    name: 'UUID Generator',
    description: 'Generate UUID v4 identifiers for your applications',
    category: 'generators',
    categoryLabel: 'Generators',
    icon: Fingerprint,
    path: '/uuid',
    aliases: ['uuid', 'guid', 'generate', 'v4', 'identifier', 'unique id']
  },
  {
    id: 'hash',
    name: 'Hash Calculator',
    description: 'Calculate MD5, SHA-1, SHA-256, SHA-512 hashes',
    category: 'generators',
    categoryLabel: 'Generators',
    icon: Hash,
    path: '/hash',
    aliases: ['hash', 'md5', 'sha', 'sha256', 'checksum', 'calculate']
  },
  {
    id: 'lorem',
    name: 'Lorem Ipsum',
    description: 'Generate placeholder text for mockups and prototypes',
    category: 'generators',
    categoryLabel: 'Generators',
    icon: FileText,
    path: '/lorem',
    aliases: ['lorem', 'ipsum', 'placeholder', 'text', 'dummy', 'mockup']
  },
  {
    id: 'qrcode',
    name: 'QR Code Generator',
    description: 'Generate QR codes from text or URLs',
    category: 'generators',
    categoryLabel: 'Generators',
    icon: QrCode,
    path: '/qrcode',
    aliases: ['qr', 'qrcode', 'generate', 'barcode', 'scan']
  },
  {
    id: 'barcode',
    name: 'Barcode Generator',
    description: 'Generate Code128 barcodes',
    category: 'generators',
    categoryLabel: 'Generators',
    icon: Barcode,
    path: '/barcode',
    aliases: ['barcode', 'code128', 'generate', 'scan']
  },
  {
    id: 'password',
    name: 'Password Generator',
    description: 'Generate secure random passwords with entropy display',
    category: 'generators',
    categoryLabel: 'Generators',
    icon: Shield,
    path: '/password',
    aliases: ['password', 'generate', 'secure', 'random', 'strong', 'pass']
  },
  {
    id: 'placeholder',
    name: 'Image Placeholder',
    description: 'Generate colored placeholder images',
    category: 'generators',
    categoryLabel: 'Generators',
    icon: ImageIcon,
    path: '/placeholder',
    aliases: ['placeholder', 'image', 'dummy', 'mockup', 'placeholder image']
  },
  {
    id: 'color',
    name: 'Color Converter',
    description: 'Convert between HEX, RGB, HSL color formats',
    category: 'converters',
    categoryLabel: 'Converters',
    icon: Palette,
    path: '/color',
    aliases: ['color', 'hex', 'rgb', 'hsl', 'convert', 'picker']
  },
  {
    id: 'css',
    name: 'CSS Formatter',
    description: 'Beautify and minify CSS',
    category: 'converters',
    categoryLabel: 'Converters',
    icon: Palette,
    path: '/css',
    aliases: ['css', 'formatter', 'beautify', 'minify', 'style']
  },
  {
    id: 'css-filter',
    name: 'CSS Filter Generator',
    description: 'Apply visual CSS filters',
    category: 'converters',
    categoryLabel: 'Converters',
    icon: Zap,
    path: '/css-filter',
    aliases: ['css', 'filter', 'blur', 'brightness', 'contrast', 'effect']
  },
  {
    id: 'timestamp',
    name: 'Timestamp Converter',
    description: 'Convert Unix timestamps to readable dates and times',
    category: 'converters',
    categoryLabel: 'Converters',
    icon: Clock,
    path: '/timestamp',
    aliases: ['timestamp', 'unix', 'epoch', 'convert', 'date', 'time']
  },
  {
    id: 'timezone',
    name: 'Time Zone Converter',
    description: 'Convert times between different time zones',
    category: 'converters',
    categoryLabel: 'Converters',
    icon: Globe,
    path: '/timezone',
    aliases: ['timezone', 'time zone', 'convert', 'utc', 'gmt']
  },
  {
    id: 'base-converter',
    name: 'Base Converter',
    description: 'Convert between decimal, binary, hex, and octal',
    category: 'converters',
    categoryLabel: 'Converters',
    icon: Calculator,
    path: '/base-converter',
    aliases: ['base', 'binary', 'hex', 'decimal', 'octal', 'convert', 'number']
  },
  {
    id: 'cron',
    name: 'Cron Parser',
    description: 'Validate cron expressions and see next execution times',
    category: 'converters',
    categoryLabel: 'Converters',
    icon: Timer,
    path: '/cron',
    aliases: ['cron', 'crontab', 'schedule', 'parser', 'expression']
  },
  {
    id: 'unicode',
    name: 'Unicode Inspector',
    description: 'Explore Unicode characters and their properties',
    category: 'converters',
    categoryLabel: 'Converters',
    icon: Languages,
    path: '/unicode',
    aliases: ['unicode', 'character', 'emoji', 'code point', 'utf']
  }
]

/**
 * Normalize string for fuzzy search (lowercase, remove diacritics)
 * @param {string} str
 * @returns {string}
 */
export function normalizeString(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Calculate fuzzy match score
 * @param {string} query
 * @param {string} text
 * @returns {number}
 */
export function fuzzyMatchScore(query, text) {
  if (!query) return 1
  const normalizedQuery = normalizeString(query)
  const normalizedText = normalizeString(text)

  // Exact match
  if (normalizedText === normalizedQuery) return 100

  // Starts with
  if (normalizedText.startsWith(normalizedQuery)) return 80

  // Contains as word boundary
  const wordRegex = new RegExp(`\\b${escapeRegex(normalizedQuery)}\\b`, 'i')
  if (wordRegex.test(normalizedText)) return 60

  // Contains anywhere
  if (normalizedText.includes(normalizedQuery)) return 40

  // Fuzzy match (characters in order)
  let queryIndex = 0
  let textIndex = 0
  while (queryIndex < normalizedQuery.length && textIndex < normalizedText.length) {
    if (normalizedQuery[queryIndex] === normalizedText[textIndex]) {
      queryIndex++
    }
    textIndex++
  }
  if (queryIndex === normalizedQuery.length) return 20

  return 0
}

/**
 * Escape regex special characters
 * @param {string} string
 * @returns {string}
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Search tools with fuzzy matching
 * @param {string} query
 * @param {any[]} [tools]
 * @returns {any[]}
 */
export function searchToolsFuzzy(query, tools = searchTools) {
  if (!query.trim()) {
    return tools.slice().sort((a, b) => a.name.localeCompare(b.name))
  }

  const normalizedQuery = normalizeString(query)

  return tools
    .map(tool => {
      // Check name
      let score = fuzzyMatchScore(normalizedQuery, tool.name) * 2

      // Check description
      score += fuzzyMatchScore(normalizedQuery, tool.description)

      // Check category
      score += fuzzyMatchScore(normalizedQuery, tool.categoryLabel) * 1.5

      // Check aliases
      for (const alias of tool.aliases) {
        const aliasScore = fuzzyMatchScore(normalizedQuery, alias)
        score = Math.max(score, aliasScore * 1.5)
      }

      return { tool, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ tool }) => tool)
}

/**
 * Get category color class
 * @param {string} categoryId
 * @returns {string}
 */
export function getCategoryColor(categoryId) {
  /** @type {Record<string, string>} */
  const colors = {
    data: 'var(--accent)',
    encoding: 'var(--success)',
    generators: 'var(--warning)',
    converters: 'var(--info)',
    security: 'var(--error)'
  }
  return colors[categoryId] || 'var(--text-tertiary)'
}
