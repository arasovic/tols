/**
 * Centralized tool titles configuration
 * @type {Record<string, string>}
 */
export const toolTitles = {
  json: 'JSON Formatter',
  base64: 'Base64 Encoder/Decoder',
  url: 'URL Encoder/Decoder',
  uuid: 'UUID Generator',
  hash: 'Hash Calculator',
  jwt: 'JWT Decoder',
  color: 'Color Converter',
  timestamp: 'Timestamp Converter',
  regex: 'Regex Tester',
  lorem: 'Lorem Ipsum Generator',
  yaml: 'YAML Formatter',
  html: 'HTML Formatter',
  cron: 'Cron Expression Parser',
  xml: 'XML Formatter',
  diff: 'Diff Checker',
  sql: 'SQL Formatter',
  markdown: 'Markdown Previewer',
  'jwt-encoder': 'JWT Encoder',
  qrcode: 'QR Code Generator',
  placeholder: 'Image Placeholder',
  unicode: 'Unicode Inspector',
  css: 'CSS Formatter',
  jsonp: 'JSONP Tester',
  timezone: 'Time Zone Converter',
  barcode: 'Barcode Generator',
  password: 'Password Generator',
  'css-filter': 'CSS Filter Generator - DevUtils | Apply Visual Filters',
  'data-uri': 'Data URI Generator - DevUtils | Convert Files to Data URIs',
  gzip: 'Gzip Calculator - DevUtils | Estimate Compression Size',
  'base-converter': 'Number Base Converter'
}

/**
 * Get page title for a tool path
 * @param {string} path
 * @returns {string}
 */
export function getToolTitle(path) {
  return toolTitles[path] || 'DevUtils'
}
