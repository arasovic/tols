/**
 * Search layer for the Cmd+K overlay.
 * Tool metadata comes from the registry; this module only adds search shapes
 * and fuzzy matching.
 */
import { tools, categories, getCategoryLabel } from '$lib/config/registry.js'

export { categories }

/**
 * Tool metadata shaped for search (with route path and category label).
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
export const searchTools = tools.map(tool => ({
  id: tool.id,
  name: tool.name,
  description: tool.description,
  category: tool.category,
  categoryLabel: getCategoryLabel(tool.category),
  icon: tool.icon,
  path: `/${tool.id}`,
  aliases: tool.aliases
}))

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
 * @param {any[]} [toolList]
 * @returns {any[]}
 */
export function searchToolsFuzzy(query, toolList = searchTools) {
  if (!query.trim()) {
    return toolList.slice().sort((a, b) => a.name.localeCompare(b.name))
  }

  const normalizedQuery = normalizeString(query)

  return toolList
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
 * Get category accent color
 * @param {string} categoryId
 * @returns {string}
 */
export function getCategoryColor(categoryId) {
  /** @type {Record<string, string>} */
  const colors = {
    data: 'var(--accent)',
    encoding: 'var(--success)',
    generators: 'var(--warning)',
    converters: 'var(--info)'
  }
  return colors[categoryId] || 'var(--text-tertiary)'
}
