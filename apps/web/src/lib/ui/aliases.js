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
 * always terminates with a free alias no matter how the registry grows. The one
 * thing that can break that is an override reserving another tool's id; see
 * `overrideProblems()`.
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

/**
 * SearchOverlay.svelte sizes `.result-alias` to a fixed `3ch` so all labels start on
 * the same column. Anything longer silently re-raggeds it, so the number lives
 * here rather than only in the CSS and only in the test.
 */
export const MAX_ALIAS_LENGTH = 3

/**
 * Hand-written aliases for ids the ladder cannot reach a readable form for.
 *
 * `timestamp` and `timezone` share four leading characters and neither has a
 * hyphen to initialise, so derivation can only truncate: `ti` and `tim`, which
 * a reader has to already know to tell apart. `jsonp` sits behind `json` and
 * truncates to `jso`. `ts`/`tz`/`jsp` are predictable from the name instead.
 *
 * This is a second source of truth, and the thing that goes wrong with one is
 * rot: it names a tool the registry dropped, or it quietly steals an alias the
 * ladder would have handed to a different tool. `overrideProblems()` states
 * every way it can be wrong, and aliases.test.js asserts the list is empty, so
 * a drifting entry fails by name rather than by producing a worse alias table.
 *
 * @type {Record<string, string>}
 */
const OVERRIDES = Object.freeze({
  timestamp: 'ts',
  timezone: 'tz',
  jsonp: 'jsp'
})

/**
 * Overrides are claimed before any tool climbs its ladder, so derivation can
 * never hand out a value the table has reserved.
 * @param {Record<string, string>} overrides
 * @returns {Record<string, string>}
 */
function assign(overrides) {
  /** @type {Record<string, string>} */
  const map = {}
  const taken = new Set(Object.values(overrides))
  for (const tool of tools) {
    const alias = overrides[tool.id] ?? ladder(tool.id).find((rung) => !taken.has(rung))
    if (!alias) {
      throw new Error(
        `no free alias for "${tool.id}": every rung of its ladder, including its own id, is already taken`
      )
    }
    taken.add(alias)
    map[tool.id] = alias
  }
  return map
}

export const TOOL_ALIASES = Object.freeze(assign(OVERRIDES))

/**
 * Every way the override table can be wrong, as messages naming the entry.
 * Empty means the table still agrees with the registry and with the ladder.
 *
 * Takes the table as an argument so the tests can prove each guard fires on a
 * deliberately broken one instead of only asserting that the real one is clean.
 * @param {Record<string, string>} [overrides]
 * @returns {string[]}
 */
export function overrideProblems(overrides = OVERRIDES) {
  /** @type {string[]} */
  const problems = []
  const ids = new Set(tools.map((t) => t.id))
  // What the ladder alone would produce. An override is only worth its cost if
  // it differs from this, and is only safe if it does not take someone else's.
  const derived = assign({})
  /** @type {Map<string, string>} */
  const claimed = new Map()

  for (const [id, alias] of Object.entries(overrides)) {
    const entry = `override "${id}" -> "${alias}"`

    if (!ids.has(id)) {
      problems.push(`${entry}: the registry has no tool with id "${id}"`)
    }

    const twin = claimed.get(alias)
    if (twin) problems.push(`${entry}: collides with override "${twin}" -> "${alias}"`)
    else claimed.set(alias, id)

    const owner = Object.entries(derived).find(([other, a]) => a === alias && other !== id)
    if (owner) problems.push(`${entry}: "${alias}" is the alias "${owner[0]}" derives on its own`)

    if (derived[id] === alias) {
      problems.push(`${entry}: redundant, the derivation ladder already produces "${alias}"`)
    }

    if (alias.length > MAX_ALIAS_LENGTH) {
      problems.push(
        `${entry}: ${alias.length} characters does not fit the ${MAX_ALIAS_LENGTH}ch nav column`
      )
    }
  }
  return problems
}

/**
 * Falls back to the same derivation the map uses, so an id the registry does
 * not know still gets a plausible alias rather than a different shape.
 * @param {string} id
 */
export function aliasFor(id) {
  return TOOL_ALIASES[id] ?? ladder(id)[0]
}
