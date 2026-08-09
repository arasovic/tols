// apps/web/src/lib/cli/command.js

/** Inputs longer than this switch to the `@file` form instead of being inlined. */
export const INLINE_LIMIT = 120

const SAFE = /^[A-Za-z0-9_@%+=:,./-]+$/

/**
 * Wraps a value in single quotes unconditionally, escaping embedded quotes.
 * @param {string} value
 * @returns {string}
 */
function quoteLiteral(value) {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

/**
 * Shell-quotes a value the way a POSIX shell needs it.
 * @param {string} value
 * @returns {string}
 */
function quote(value) {
  if (value === '') return "''"
  if (SAFE.test(value)) return value
  return quoteLiteral(value)
}

/**
 * Quotes a flag value. A value carrying control characters uses ANSI-C
 * quoting so the command stays on one line and remains paste-friendly.
 * @param {string} value
 * @returns {string}
 */
function quoteFlagValue(value) {
  if (!/[\n\r\t]/.test(value)) return quote(value)
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
  return `$'${escaped}'`
}

/**
 * Renders flags as CLI arguments. Booleans become bare `--flag`; everything
 * else becomes `--flag=value`. `false`, `null` and `undefined` are dropped.
 * @param {Record<string, unknown>} flags
 * @returns {string[]}
 */
function renderFlags(flags) {
  return Object.entries(flags).flatMap(([key, value]) => {
    if (value === false || value === null || value === undefined) return []
    if (value === true) return [`--${key}`]
    return [`--${key}=${quoteFlagValue(String(value))}`]
  })
}

/**
 * Renders canonical positional arguments as `@file` references in order.
 * @param {Array<{ type: 'file', name: string }>} positionalArgs
 * @returns {string[]}
 */
function renderPositionalArgs(positionalArgs) {
  return positionalArgs.map((arg) => {
    if (arg.type !== 'file') {
      throw new TypeError(`Unsupported positional argument type: ${String(arg.type)}`)
    }
    if (typeof arg.name !== 'string' || arg.name.trim().length === 0) {
      throw new TypeError('File positional argument requires a non-empty name')
    }
    return quote(`@${arg.name}`)
  })
}

/**
 * Builds the runnable `tols` command that matches the current tool state.
 *
 * @param {object} spec
 * @param {string} spec.tool CLI tool name, e.g. 'json'
 * @param {string} spec.action CLI action, e.g. 'fmt'
 * @param {string} [spec.input] Current tool input
 * @param {Record<string, unknown>} [spec.flags] Flag values
 * @param {string} [spec.inputName] File name used by the `@file` fallback
 * @param {Array<{ type: 'file', name: string }>} [spec.positionalArgs]
 * @param {string} [spec.defaultAction]
 * @param {boolean} [spec.omitDefaultAction]
 * @returns {string} Command line without a leading prompt character
 */
export function buildCommand({
  tool,
  action,
  input = '',
  flags = {},
  inputName = 'input.txt',
  positionalArgs = [],
  defaultAction = '',
  omitDefaultAction = false
}) {
  if (positionalArgs.length > 0 && input.length > 0) {
    throw new TypeError('Canonical positional arguments cannot be combined with legacy input')
  }
  if (omitDefaultAction && action !== defaultAction) {
    throw new TypeError('Only the default action may be omitted')
  }

  const command = ['tols', tool]
  if (!omitDefaultAction) command.push(action)
  const positional = renderPositionalArgs(positionalArgs)
  const flagArgs = renderFlags(flags)

  if (positional.length > 0) return [...command, ...positional, ...flagArgs].join(' ')

  if (input.length === 0) return [...command, ...flagArgs].join(' ')

  if (input.includes('\n') || input.length > INLINE_LIMIT) {
    return [...command, `@${inputName}`, ...flagArgs].join(' ')
  }

  // The CLI resolves a leading `@` as a file path and a leading `--` as a flag,
  // so a literal input starting with either would silently mean something else.
  // Piping it as stdin is unambiguous and needs no CLI-side change.
  if (/^(@|--)/.test(input)) {
    return `printf '%s' ${quoteLiteral(input)} | ${[...command, ...flagArgs].join(' ')}`
  }

  return [...command, quote(input), ...flagArgs].join(' ')
}
