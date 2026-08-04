/**
 * Resolve the configured app base to an absolute path for the given page
 * pathname. `base` is absolute in dev/client but relative ('.', '..') during
 * prerendering, where it must be resolved against the page URL.
 * @param {string} base
 * @param {string} pathname
 * @returns {string}
 */
export function resolveAbsoluteBase(base, pathname) {
  if (base.startsWith('/')) return base
  if (base) return new URL(base, `http://localhost${pathname}`).pathname.replace(/\/$/, '')
  return ''
}

/**
 * Strip the app base from a page pathname, returning the path without it
 * (e.g. '/dev-utilities/json' -> '/json'). Works with absolute, relative,
 * and empty base values. The "returned unchanged" fallback only triggers
 * with an absolute base: a relative base is resolved against the pathname
 * itself, so it always matches.
 * @param {string} base
 * @param {string} pathname
 * @returns {string}
 */
export function stripBase(base, pathname) {
  const absoluteBase = resolveAbsoluteBase(base, pathname)
  return pathname.startsWith(absoluteBase)
    ? pathname.slice(absoluteBase.length)
    : pathname
}