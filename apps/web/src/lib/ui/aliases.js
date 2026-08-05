// apps/web/src/lib/ui/aliases.js
import { tools } from '$lib/config/registry.js'
import { templateFor } from '$lib/cli/templates.js'

// Two characters is the target width. On collision the alias widens one
// character at a time — deterministic, order-stable, and never silently
// duplicated. A tool absent from TEMPLATES falls back to its own id.
function build() {
  /** @type {Record<string, string>} */
  const map = {}
  const taken = new Set()
  for (const tool of tools) {
    const name = templateFor(tool.id)?.tool ?? tool.id
    let alias = name.slice(0, 2)
    for (let n = 3; taken.has(alias) && n <= name.length; n++) alias = name.slice(0, n)
    taken.add(alias)
    map[tool.id] = alias
  }
  return Object.freeze(map)
}

export const TOOL_ALIASES = build()

/** @param {string} id */
export function aliasFor(id) {
  return TOOL_ALIASES[id] ?? id.slice(0, 2)
}
