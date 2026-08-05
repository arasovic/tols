/**
 * Diff core — Myers diff + word diff ported verbatim from apps/web DiffTool.svelte.
 */

/**
 * @typedef {{
 *   type: 'equal' | 'delete' | 'insert',
 *   text: string
 * }} WordDiffItem
 */

/**
 * @typedef {{
 *   type: 'same' | 'modified' | 'removed' | 'added',
 *   left: string,
 *   right: string,
 *   oldLineNum: number | null,
 *   newLineNum: number | null
 * }} DiffLineItem
 */

/**
 * @typedef {(
 *   | { type: 'equal', oldIndex: number, newIndex: number, oldLine: string, newLine: string }
 *   | { type: 'delete', oldIndex: number, newIndex: null, oldLine: string, newLine: null }
 *   | { type: 'insert', oldIndex: null, newIndex: number, oldLine: null, newLine: string }
 * )} MyersOp
 */

/**
 * @typedef {(
 *   | { type: 'equal', oldWord: string, newWord: string }
 *   | { type: 'delete', oldWord: string, newWord?: undefined }
 *   | { type: 'insert', oldWord?: undefined, newWord: string }
 * )} LcsOp
 */

/** @type {Map<string, WordDiffItem[]>} */
const diffCache = new Map()

export function resetCache() { diffCache.clear() }

/**
 * @param {string} oldLine
 * @param {string} newLine
 */
export function getCacheKey(oldLine, newLine) {
  return `${oldLine}\x00${newLine}`
}

/**
 * Myers diff algorithm - finds shortest edit script
 * Returns an array of operations: { type: 'equal'|'insert'|'delete', oldIndex, newIndex, line }
 * @param {string[]} oldLines
 * @param {string[]} newLines
 * @returns {MyersOp[]}
 */
export function myersDiff(oldLines, newLines) {
  const n = oldLines.length
  const m = newLines.length
  const max = n + m

  const v = new Map()
  const trace = []

  v.set(1, 0)

  for (let d = 0; d <= max; d++) {
    for (let k = -d; k <= d; k += 2) {
      let x

      if (k === -d || (k !== d && v.get(k - 1) < v.get(k + 1))) {
        x = v.get(k + 1)
      } else {
        x = v.get(k - 1) + 1
      }

      let y = x - k

      while (x < n && y < m && oldLines[x] === newLines[y]) {
        x++
        y++
      }

      v.set(k, x)

      if (x >= n && y >= m) {
        // snapshot AFTER the round so trace[d] holds V at the end of round d
        trace.push(new Map(v))
        return backtrack(trace, oldLines, newLines, d, n, m)
      }
    }

    trace.push(new Map(v))
  }

  return backtrack(trace, oldLines, newLines, max, n, m)
}

/**
 * @param {Array<Map<number, number>>} trace
 * @param {string[]} oldLines
 * @param {string[]} newLines
 * @param {number} d
 * @param {number} n
 * @param {number} m
 * @returns {MyersOp[]}
 */
export function backtrack(trace, oldLines, newLines, d, n, m) {
  /** @type {MyersOp[]} */
  const edits = []
  let x = n
  let y = m

  for (let d_idx = d; d_idx > 0; d_idx--) {
    const v = trace[d_idx]
    const k = x - y

    let prevK
    const prevV = trace[d_idx - 1]

    if (k === -d_idx || (k !== d_idx && (prevV.get(k - 1) ?? 0) < (prevV.get(k + 1) ?? 0))) {
      prevK = k + 1
    } else {
      prevK = k - 1
    }

    const prevX = prevV.get(prevK) ?? 0
    const prevY = prevX - prevK

    while (x > prevX && y > prevY) {
      x--
      y--
      edits.unshift({ type: 'equal', oldIndex: x, newIndex: y, oldLine: oldLines[x], newLine: newLines[y] })
    }

    if (x > prevX) {
      x--
      edits.unshift({ type: 'delete', oldIndex: x, newIndex: null, oldLine: oldLines[x], newLine: null })
    } else if (y > prevY) {
      y--
      edits.unshift({ type: 'insert', oldIndex: null, newIndex: y, oldLine: null, newLine: newLines[y] })
    }
  }

  while (x > 0 && y > 0) {
    x--
    y--
    edits.unshift({ type: 'equal', oldIndex: x, newIndex: y, oldLine: oldLines[x], newLine: newLines[y] })
  }

  return edits
}

/**
 * Compute longest common subsequence for word-level diff
 * @param {string[]} oldWords
 * @param {string[]} newWords
 * @returns {LcsOp[]}
 */
export function computeLCS(oldWords, newWords) {
  const n = oldWords.length
  const m = newWords.length

  if (n === 0 && m === 0) return []
  if (n === 0) return newWords.map(w => ({ type: 'insert', newWord: w }))
  if (m === 0) return oldWords.map(w => ({ type: 'delete', oldWord: w }))

  const dp = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0))
  const direction = Array(n + 1).fill(null).map(() => Array(m + 1).fill(null))

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
        direction[i][j] = 'diag'
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        dp[i][j] = dp[i - 1][j]
        direction[i][j] = 'up'
      } else {
        dp[i][j] = dp[i][j - 1]
        direction[i][j] = 'left'
      }
    }
  }

  const result = /** @type {LcsOp[]} */ ([])
  let i = n
  let j = m

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && direction[i][j] === 'diag') {
      result.unshift({ type: 'equal', oldWord: oldWords[i - 1], newWord: newWords[j - 1] })
      i--
      j--
    } else if (j > 0 && (i === 0 || direction[i][j] === 'left')) {
      result.unshift({ type: 'insert', newWord: newWords[j - 1] })
      j--
    } else if (i > 0) {
      result.unshift({ type: 'delete', oldWord: oldWords[i - 1] })
      i--
    }
  }

  return result
}

/**
 * Tokenize text into words and separators for word-level diff
 * Supports Unicode characters including Turkish (ğ, ü, ş, ı, ö, ç)
 * @param {string} text
 * @returns {string[]}
 */
export function tokenize(text) {
  if (!text || text.length === 0) return []

  const tokens = []
  const regex = /(\s+|\p{L}[\p{L}\p{N}_]*|\p{N}+|[^\p{L}\p{N}\s])/gu
  let match

  while ((match = regex.exec(text)) !== null) {
    tokens.push(match[0])
  }

  return tokens.length > 0 ? tokens : [text]
}

/**
 * Compute word-level diff between two lines with caching
 * @param {string} oldLine
 * @param {string} newLine
 * @returns {WordDiffItem[]}
 */
export function computeWordDiff(oldLine, newLine) {
  if (oldLine === newLine) {
    return [{ type: 'equal', text: oldLine }]
  }

  const cacheKey = getCacheKey(oldLine, newLine)
  const cached = diffCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const oldTokens = tokenize(oldLine)
  const newTokens = tokenize(newLine)

  if (oldTokens.length === 0 && newTokens.length === 0) {
    return []
  }

  const lcs = computeLCS(oldTokens, newTokens)

  const groups = []
  let currentGroup = null

  for (const op of lcs) {
    if (!currentGroup || currentGroup.type !== op.type) {
      if (currentGroup) groups.push(currentGroup)
      currentGroup = { type: op.type, oldText: '', newText: '' }
    }

    if (op.type === 'equal') {
      currentGroup.oldText += op.oldWord
      currentGroup.newText += op.newWord
    } else if (op.type === 'delete') {
      currentGroup.oldText += op.oldWord
    } else if (op.type === 'insert') {
      currentGroup.newText += op.newWord
    }
  }

  if (currentGroup) groups.push(currentGroup)

  /** @type {WordDiffItem[]} */
  const result = []
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i]
    if (group.type === 'equal') {
      result.push({ type: 'equal', text: group.oldText })
    } else if (group.type === 'delete') {
      result.push({ type: 'delete', text: group.oldText })
    } else if (group.type === 'insert') {
      result.push({ type: 'insert', text: group.newText })
    }
  }

  diffCache.set(cacheKey, result)
  return result
}

/**
 * Calculate similarity ratio between two strings (0-1)
 * @param {string} str1
 * @param {string} str2
 * @returns {number}
 */
export function similarityScore(str1, str2) {
  if (!str1 || !str2) return 0
  const len1 = str1.length
  const len2 = str2.length
  if (len1 === 0 && len2 === 0) return 1
  if (len1 === 0 || len2 === 0) return 0

  const tokens1 = tokenize(str1)
  const tokens2 = tokenize(str2)

  const commonTokens = new Set(tokens1.filter(t => tokens2.includes(t)))
  const uniqueTokens = new Set([...tokens1, ...tokens2])
  return uniqueTokens.size > 0 ? commonTokens.size / uniqueTokens.size : 0
}

/**
 * Compute a line diff between two texts.
 * @param {string} oldText
 * @param {string} newText
 * @returns {{ differ: boolean, items: DiffLineItem[] }}
 */
export function diffLines(oldText, newText) {
  const oldLines = (oldText ? oldText.split('\n') : ['']).map((l) => l || '')
  const newLines = (newText ? newText.split('\n') : ['']).map((l) => l || '')

  // Myers with a full trace is quadratic in the edit distance; cap input
  // size with a clear error instead of letting huge diffs exhaust memory.
  if ((oldLines.length + 1) * (newLines.length + 1) > 12_000_000) {
    throw new Error(`inputs too large for diff (${oldLines.length} vs ${newLines.length} lines; keep each side under ~3500 lines)`)
  }

  const edits = myersDiff(oldLines, newLines)
  /** @type {DiffLineItem[]} */
  const items = []
  let oldLineNum = 1
  let newLineNum = 1
  const MODIFIED_THRESHOLD = 0.3

  for (let i = 0; i < edits.length; i++) {
    const edit = edits[i]
    if (edit.type === 'equal') {
      items.push({
        type: 'same', left: edit.oldLine, right: edit.newLine,
        oldLineNum: oldLineNum++, newLineNum: newLineNum++,
      })
    } else if (edit.type === 'delete') {
      const nextEdit = edits[i + 1]
      const isModified = nextEdit && nextEdit.type === 'insert' &&
        similarityScore(edit.oldLine, nextEdit.newLine) >= MODIFIED_THRESHOLD
      if (nextEdit && nextEdit.type === 'insert' && isModified) {
        items.push({
          type: 'modified', left: edit.oldLine, right: nextEdit.newLine,
          oldLineNum: oldLineNum++, newLineNum: newLineNum++,
        })
        i++
      } else {
        items.push({
          type: 'removed', left: edit.oldLine, right: '',
          oldLineNum: oldLineNum++, newLineNum: null,
        })
      }
    } else if (edit.type === 'insert') {
      items.push({
        type: 'added', left: '', right: edit.newLine,
        oldLineNum: null, newLineNum: newLineNum++,
      })
    }
  }

  return { differ: items.some((it) => it.type !== 'same'), items }
}

/**
 * Git-like plain text rendering: '  ' same, '- ' removed/old, '+ ' added/new.
 * @param {{ differ: boolean, items: DiffLineItem[] }} result
 */
export function toPlainText(result) {
  const lines = []
  for (const it of result.items) {
    if (it.type === 'same') lines.push('  ' + it.left)
    else if (it.type === 'removed') lines.push('- ' + it.left)
    else if (it.type === 'added') lines.push('+ ' + it.right)
    else if (it.type === 'modified') {
      lines.push('- ' + it.left)
      lines.push('+ ' + it.right)
    }
  }
  return lines.join('\n')
}
