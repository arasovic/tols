// apps/web/src/lib/ui/aliases.js
import { tools } from '$lib/config/registry.js'

/**
 * The ladder of aliases a tool will accept, best first. The first rung a
 * previous tool has not already claimed becomes its alias.
 *
 * The seed comes from the REGISTRY ID, not from the CLI template's tool name.
 * Deriving from the template collapsed `jwt` and `jwt-encoder` onto the same
 * name `jwt`, so the widening ladder handed the longer, more complete-looking
 * alias to whichever of the two the registry happened to list second: `jw`
 * meant the JWT decoder while `jwt` meant the JWT *Encoder*. Same for `cs`
 * (CSS Formatter) against `css` (CSS Filter Generator). Registry order should
 * not decide which tool looks canonical.
 *
 * A hyphenated id initialises its segments instead — `jwt-encoder` -> `je`,
 * `css-filter` -> `cf`, `data-uri` -> `du`, `base-converter` -> `bc`. Those are
 * aliases a reader can predict from the name, and none of them is another
 * tool's whole id.
 *
 * Later rungs widen through the hyphen-stripped id one character at a time, and
 * the last rung is the raw id, which is unique by construction — so the ladder
 * always terminates with a free alias no matter how the registry grows.
 *
 * @param {string} id
 * @returns {string[]}
 */
function ladder(id) {
  const segments = id.split('-')
  const flat = id.replace(/-/g, '')
  const seed = segments.length > 1 ? segments.map((s) => s[0]).join('') : id.slice(0, 2)
  const rungs = [seed]
  for (let n = seed.length + 1; n <= flat.length; n++) rungs.push(flat.slice(0, n))
  rungs.push(id)
  return rungs
}

function build() {
  /** @type {Record<string, string>} */
  const map = {}
  const taken = new Set()
  for (const tool of tools) {
    const alias = /** @type {string} */ (ladder(tool.id).find((rung) => !taken.has(rung)))
    taken.add(alias)
    map[tool.id] = alias
  }
  return Object.freeze(map)
}

export const TOOL_ALIASES = build()

/**
 * Falls back to the same derivation the map uses, so an id the registry does
 * not know still gets a plausible alias rather than a different shape.
 * @param {string} id
 */
export function aliasFor(id) {
  return TOOL_ALIASES[id] ?? ladder(id)[0]
}
