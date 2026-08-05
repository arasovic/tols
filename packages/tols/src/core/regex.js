/**
 * Regex core — matching behavior ported from apps/web RegexTool.svelte.
 * The web runs the regex in a Worker with a 5s timeout (ReDoS guard);
 * the CLI executes synchronously, so pathological patterns can block —
 * same trade-off as any grep-like tool.
 */

export const VALID_FLAGS = new Set(['g', 'i', 'm', 's', 'u', 'y']);

/** Dedupe and drop invalid flags, same as the web. */
export function validateFlags(flagString) {
  if (!flagString) return '';
  const uniqueFlags = [...new Set(String(flagString).split(''))];
  return uniqueFlags.filter((f) => VALID_FLAGS.has(f)).join('');
}

/**
 * @param {string} pattern
 * @param {string} flags
 */
export function compile(pattern, flags) {
  try {
    return new RegExp(pattern, validateFlags(flags));
  } catch (e) {
    throw new Error(`Invalid regex pattern: ${e.message}`);
  }
}

/**
 * @typedef {{ value: string, index: number, groups: string[], named: Record<string, string | undefined> }} MatchInfo
 */

/**
 * Collect matches. Global flag -> all matches; otherwise the first match
 * only (web parity).
 * @param {string} pattern
 * @param {string} flags
 * @param {string} text
 * @returns {MatchInfo[]}
 */
export function match(pattern, flags, text) {
  const regex = compile(pattern, flags);
  const toInfo = (/** @type {RegExpExecArray | RegExpMatchArray} */ m) => ({
    value: m[0] ?? '',
    index: typeof m.index === 'number' ? m.index : 0,
    groups: m.slice(1).map((g) => (g === undefined ? '' : g)),
    named: m.groups ? { ...m.groups } : {},
  });

  if (!regex.global) {
    const single = text.match(regex);
    return single ? [toInfo(single)] : [];
  }
  return Array.from(text.matchAll(regex), toInfo);
}

/**
 * @param {string} pattern
 * @param {string} flags
 * @param {string} text
 * @param {string} replacement supports $1-style and $<name> backreferences
 */
export function replace(pattern, flags, text, replacement) {
  const regex = compile(pattern, flags);
  return text.replace(regex, replacement);
}
