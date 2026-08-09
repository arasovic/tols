// apps/web/src/lib/cli/templates.js

/**
 * @typedef {{ type: 'file', name: string }} PositionalArg
 * @typedef {Object} CommandTemplate
 * @property {string} tool CLI tool name
 * @property {string[]} actions Available CLI actions
 * @property {string} defaultAction Action used when the UI has no explicit mode
 * @property {string} [inputName] File name used by the `@file` fallback
 * @property {PositionalArg[]} [positionalArgs] Canonical positional file arguments
 * @property {boolean} [omitDefaultAction] Omit the action when it equals `defaultAction`
 */

/** @type {Record<string, CommandTemplate>} */
const TEMPLATES = {
  json: { tool: 'json', actions: ['fmt', 'min', 'val'], defaultAction: 'fmt', inputName: 'input.json' },
  yaml: { tool: 'yaml', actions: ['fmt', 'json'], defaultAction: 'fmt', inputName: 'input.yaml' },
  xml: { tool: 'xml', actions: ['fmt', 'min'], defaultAction: 'fmt', inputName: 'input.xml' },
  html: { tool: 'html', actions: ['fmt', 'min'], defaultAction: 'fmt', inputName: 'input.html' },
  css: { tool: 'css', actions: ['fmt', 'min'], defaultAction: 'fmt', inputName: 'input.css' },
  sql: { tool: 'sql', actions: ['fmt', 'min'], defaultAction: 'fmt', inputName: 'input.sql' },
  markdown: { tool: 'markdown', actions: ['html'], defaultAction: 'html', inputName: 'input.md' },
  jsonp: { tool: 'jsonp', actions: ['wrap', 'script'], defaultAction: 'wrap', inputName: 'input.js' },
  base64: { tool: 'base64', actions: ['enc', 'dec'], defaultAction: 'enc', inputName: 'input.txt' },
  url: { tool: 'url', actions: ['enc', 'dec', 'analyze'], defaultAction: 'enc', inputName: 'input.txt' },
  gzip: { tool: 'gzip', actions: ['comp', 'decomp'], defaultAction: 'comp', inputName: 'input.txt' },
  'data-uri': { tool: 'datauri', actions: ['enc', 'dec'], defaultAction: 'enc', inputName: 'input.txt' },
  unicode: { tool: 'unicode', actions: ['info', 'search'], defaultAction: 'info', inputName: 'input.txt' },
  jwt: { tool: 'jwt', actions: ['dec'], defaultAction: 'dec', inputName: 'token.txt' },
  'jwt-encoder': { tool: 'jwt', actions: ['enc'], defaultAction: 'enc', inputName: 'payload.json' },
  hash: { tool: 'hash', actions: ['md5', 'sha1', 'sha256', 'sha512'], defaultAction: 'sha256', inputName: 'input.txt' },
  diff: {
    tool: 'diff',
    actions: ['run'],
    defaultAction: 'run',
    positionalArgs: [
      { type: 'file', name: 'old.txt' },
      { type: 'file', name: 'new.txt' }
    ],
    omitDefaultAction: true
  },
  timestamp: { tool: 'timestamp', actions: ['now', 'conv', 'parse'], defaultAction: 'conv', inputName: 'input.txt' },
  timezone: { tool: 'timezone', actions: ['conv'], defaultAction: 'conv', inputName: 'input.txt' },
  cron: { tool: 'cron', actions: ['parse', 'next', 'val'], defaultAction: 'parse', inputName: 'expr.txt' },
  'base-converter': { tool: 'base', actions: ['conv'], defaultAction: 'conv', inputName: 'input.txt' },
  regex: { tool: 'regex', actions: ['match', 'replace'], defaultAction: 'match', inputName: 'input.txt' },
  uuid: { tool: 'uuid', actions: ['gen'], defaultAction: 'gen', inputName: 'input.txt' },
  password: { tool: 'password', actions: ['gen'], defaultAction: 'gen', inputName: 'input.txt' },
  lorem: { tool: 'lorem', actions: ['gen'], defaultAction: 'gen', inputName: 'input.txt' },
  color: { tool: 'color', actions: ['conv'], defaultAction: 'conv', inputName: 'input.txt' },
  'css-filter': { tool: 'cssfilter', actions: ['gen'], defaultAction: 'gen', inputName: 'input.txt' },
  qrcode: { tool: 'qr', actions: ['gen'], defaultAction: 'gen', inputName: 'input.txt' },
  barcode: { tool: 'barcode', actions: ['gen'], defaultAction: 'gen', inputName: 'input.txt' },
  placeholder: { tool: 'placeholder', actions: ['gen'], defaultAction: 'gen', inputName: 'input.txt' }
}

/**
 * @param {string} toolId Registry id (route segment)
 * @returns {CommandTemplate | undefined}
 */
export function templateFor(toolId) {
  return TEMPLATES[toolId]
}
