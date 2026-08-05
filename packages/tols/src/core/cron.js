/**
 * Cron core — parser/validator/next-run ported verbatim from apps/web CronTool.svelte.
 */

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * @param {string} field
 * @param {number} min
 * @param {number} max
 * @returns {number[] | null}
 */
export function parseCronField(field, min, max) {
  /** @type {number[]} */
  const values = []

  if (field === '*') {
    for (let i = min; i <= max; i++) values.push(i)
    return values
  }

  if (field === '?') return values

  const parts = field.split(',')
  for (const part of parts) {
    if (part.includes('/')) {
      const [range, step] = part.split('/')
      const stepVal = parseInt(step)
      if (isNaN(stepVal) || stepVal < 1) return null
      let start, end
      if (range === '*') {
        start = min
        end = max
      } else if (range.includes('-')) {
        const rangeParts = range.split('-').map(Number)
        start = rangeParts[0]
        end = rangeParts[1]
        if (start > end) return null
      } else {
        start = parseInt(range)
        end = max
      }
      if (start < min || end > max) return null
      for (let i = start; i <= end; i += stepVal) values.push(i)
    } else if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number)
      if (isNaN(start) || isNaN(end)) return null
      if (start > end) return null
      if (start < min || end > max) return null
      for (let i = start; i <= end; i++) values.push(i)
    } else {
      const val = parseInt(part)
      if (isNaN(val)) return null
      if (val < min || val > max) return null
      values.push(val)
    }
  }

  // Dedupe: `0,0` or overlapping ranges must not schedule duplicate runs.
  return [...new Set(values)].sort((a, b) => a - b)
}

/**
 * @param {string} cron
 * @returns {string}
 */
export function getDescription(cron) {
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) return 'Invalid cron expression'

  const [minute, hour, day, month, weekday] = parts

  if (cron === '* * * * *') return 'Every minute'
  if (cron === '0 * * * *') return 'Every hour'
  if (cron === '0 0 * * *') return 'Every day at midnight'
  if (cron === '0 0 * * 0') return 'Every Sunday at midnight'
  if (cron === '0 0 1 * *') return 'First day of every month at midnight'
  if (cron === '0 0 1 1 *') return 'First day of every year at midnight'

  const segments = []

  if (minute !== '*') {
    segments.push(`at minute ${minute}`)
  }
  if (hour !== '*') {
    if (minute !== '*') {
      segments.push(`past hour ${hour}`)
    } else {
      segments.push(`every hour at minute ${minute}`)
    }
  }
  if (day !== '*' && day !== '?') {
    segments.push(`on day ${day}`)
  }
  if (month !== '*') {
    const monthNames = parseCronField(month, 1, 12)
    if (monthNames) {
      const monthStr = monthNames.map(m => MONTH_NAMES[m - 1]).join(', ')
      segments.push(`in ${monthStr}`)
    }
  }
  if (weekday !== '*' && weekday !== '?') {
    const dayValues = parseCronField(weekday, 0, 7)
    if (dayValues) {
      const normalized = [...new Set(dayValues.map((v) => (v === 7 ? 0 : v)))].sort((a, b) => a - b)
      const dayStr = normalized.map(d => WEEKDAY_NAMES[d]).join(', ')
      segments.push(`on ${dayStr}`)
    }
  }

  if (segments.length === 0) return 'Custom schedule'

  return 'Runs ' + segments.join(', ')
}

/**
 * Next run times for a cron expression.
 *
 * Day-based scan (instead of minute stepping) so sparse expressions like
 * "0 0 29 2 *" resolve without iterating millions of minutes. Standard cron
 * day-of-month/day-of-week OR semantics apply when both are constrained.
 * Throws when fewer than `count` runs occur within the 40-year window
 * (e.g. "0 0 31 2 *" never matches).
 * @param {string} cron
 * @param {number} [count]
 * @param {Date} [from]
 * @returns {Date[]}
 */
export function getNextRuns(cron, count = 5, from = new Date()) {
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) return []

  // '?' means unconstrained (Quartz-style); normalize it to '*' for the
  // time/month fields so validation and scheduling stay consistent.
  const field = (idx) => (parts[idx] === '?' ? '*' : parts[idx])
  const minutes = parseCronField(field(0), 0, 59)
  const hours = parseCronField(field(1), 0, 23)
  const days = parseCronField(field(2), 1, 31)
  const months = parseCronField(field(3), 1, 12)
  // Some cron dialects accept 7 as Sunday; fold it onto 0.
  let weekdays = parseCronField(field(4), 0, 7)
  if (weekdays) {
    weekdays = [...new Set(weekdays.map((v) => (v === 7 ? 0 : v)))].sort((a, b) => a - b)
  }

  if (!minutes || !hours || !days || !months || !weekdays) return []

  const dayFree = parts[2] === '*' || parts[2] === '?'
  const weekdayFree = parts[4] === '*' || parts[4] === '?'
  const dayMatches = (d) => {
    const dayMatch = days.includes(d.getDate())
    const weekdayMatch = weekdays.includes(d.getDay())
    if (!dayFree && !weekdayFree) return dayMatch || weekdayMatch
    if (!dayFree) return dayMatch
    if (!weekdayFree) return weekdayMatch
    return true
  }

  const start = new Date(from)
  start.setSeconds(0, 0)

  const runs = []
  const maxDays = 366 * 40

  for (let offset = 0; offset < maxDays && runs.length < count; offset++) {
    const day = new Date(start)
    day.setDate(day.getDate() + offset)
    if (!months.includes(day.getMonth() + 1)) continue
    if (!dayMatches(day)) continue

    for (const h of hours) {
      for (const m of minutes) {
        const candidate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m, 0, 0)
        if (candidate.getTime() <= start.getTime()) continue
        runs.push(candidate)
        if (runs.length >= count) break
      }
      if (runs.length >= count) break
    }
  }

  if (runs.length < count) {
    throw new Error(`no matching run within 40 years (found ${runs.length} of ${count}; check day/month fields)`)
  }

  return runs
}

/**
 * @param {string} cron
 * @returns {string | null}
 */
export function validateCron(cron) {
  if (!cron || cron.length === 0) return 'Please enter a cron expression'

  const trimmed = cron.trim()
  if (trimmed.length === 0) return 'Cron expression cannot be whitespace only'

  const parts = trimmed.split(/\s+/)
  if (parts.length !== 5) return 'Cron expression must have exactly 5 parts'

  // Vixie/Quartz allow 7 as an alias for Sunday in the weekday field.
  const ranges = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 7]]

  for (let i = 0; i < 5; i++) {
    const part = parts[i]
    if (part === '*') continue
    if (part === '?') {
      if (i !== 2 && i !== 4) {
        return `The '?' character is only allowed in the day-of-month and day-of-week fields (part ${i + 1})`
      }
      continue
    }

    const subParts = part.split(',')
    for (const sub of subParts) {
      if (sub.includes('/')) {
        const [range, step] = sub.split('/')
        if (!/^\d+$/.test(step)) return `Invalid step value in part ${i + 1}`
        const stepVal = parseInt(step)
        if (isNaN(stepVal) || stepVal < 1) return `Step value must be at least 1 in part ${i + 1}`
        if (range !== '*') {
          if (range.includes('-')) {
            if (range.startsWith('-') || range.endsWith('-')) return `Invalid range in part ${i + 1}`
            const [start, end] = range.split('-').map(Number)
            if (isNaN(start) || isNaN(end)) return `Invalid range in part ${i + 1}`
            if (start > end) return `Range start cannot be greater than end in part ${i + 1}`
            if (start < ranges[i][0] || end > ranges[i][1]) return `Value out of range in part ${i + 1}`
          } else if (!/^\d+$/.test(range)) {
            return `Invalid value in part ${i + 1}`
          } else {
            const rangeVal = parseInt(range)
            if (isNaN(rangeVal)) return `Invalid value in part ${i + 1}`
            if (rangeVal < ranges[i][0] || rangeVal > ranges[i][1]) return `Value out of range in part ${i + 1}`
          }
        }
      } else if (sub.includes('-')) {
        if (sub.startsWith('-') || sub.endsWith('-')) return `Invalid range in part ${i + 1}`
        const [start, end] = sub.split('-').map(Number)
        if (isNaN(start) || isNaN(end)) return `Invalid range in part ${i + 1}`
        if (start > end) return `Range start cannot be greater than end in part ${i + 1}`
        if (start < ranges[i][0] || end > ranges[i][1]) return `Value out of range in part ${i + 1}`
      } else {
        if (!/^\d+$/.test(sub)) return `Invalid value in part ${i + 1}`
        const val = parseInt(sub)
        if (isNaN(val)) return `Invalid value in part ${i + 1}`
        if (val < ranges[i][0] || val > ranges[i][1]) return `Value out of range in part ${i + 1}`
      }
    }
  }

  return null
}
