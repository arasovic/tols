/**
 * Header titles for tool pages, derived from the registry.
 */
import { tools } from '$lib/config/registry.js'

/**
 * Centralized tool titles configuration
 * @type {Record<string, string>}
 */
export const toolTitles = Object.fromEntries(tools.map(tool => [tool.id, tool.name]))

/**
 * Get page title for a tool path
 * @param {string} path
 * @returns {string}
 */
export function getToolTitle(path) {
  return toolTitles[path] || 'DevUtils'
}
