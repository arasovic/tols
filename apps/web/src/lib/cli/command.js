// apps/web/src/lib/cli/command.js

/** Inputs longer than this switch to the `@file` form instead of being inlined. */
export const INLINE_LIMIT = 120

const SAFE = /^[A-Za-z0-9_@%+=:,./-]+$/

/**
 * Shell-quotes a value the way a POSIX shell needs it.
 * @param {string} value
 * @returns {string}
 */
function quote(value) {
  if (value === '') return "''"
  if (SAFE.test(value)) return value
  return `'${value.replace(/'/g, `'\\''`)}'`
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
    return [`--${key}=${quote(String(value))}`]
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
 * @returns {string} Command line without a leading prompt character
 */
export function buildCommand({ tool, action, input = '', flags = {}, inputName = 'input.txt' }) {
  const parts = ['tols', tool, action]

  if (input.length > 0) {
    const needsFile = input.includes('\n') || input.length > INLINE_LIMIT
    parts.push(needsFile ? `@${inputName}` : quote(input))
  }

  return [...parts, ...renderFlags(flags)].join(' ')
}
