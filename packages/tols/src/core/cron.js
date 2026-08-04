/**
 * Cron core — parser/validator/next-run ported verbatim from apps/web CronTool.svelte.
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

  return values.sort((a, b) => a - b)
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
    const dayNames = parseCronField(weekday, 0, 6)
    if (dayNames) {
      const dayStr = dayNames.map(d => WEEKDAY_NAMES[d]).join(', ')
      segments.push(`on ${dayStr}`)
    }
  }

  if (segments.length === 0) return 'Custom schedule'

  return 'Runs ' + segments.join(', ')
}

/**
 * @param {string} cron
 * @param {number} count
 * @returns {Date[]}
 */
export function getNextRuns(cron, count = 5, from = new Date()) {
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) return []

  const minutes = parseCronField(parts[0], 0, 59)
  const hours = parseCronField(parts[1], 0, 23)
  const days = parseCronField(parts[2], 1, 31)
  const months = parseCronField(parts[3], 1, 12)
  const weekdays = parseCronField(parts[4], 0, 6)

  if (!minutes || !hours || !days || !months || !weekdays) return []

  const runs = []
  let date = new Date(from)
  date.setSeconds(0, 0)

  const maxIterations = 10000
  let iterations = 0

  while (runs.length < count && iterations < maxIterations) {
    iterations++
    date.setMinutes(date.getMinutes() + 1)

    if (!minutes.includes(date.getMinutes())) continue
    if (!hours.includes(date.getHours())) continue
    if (!months.includes(date.getMonth() + 1)) continue

    const dayMatch = days.includes(date.getDate())
    const weekdayMatch = weekdays.includes(date.getDay())

    // standard cron: '*' or '?' means unconstrained; when both day fields are
    // constrained they combine with OR
    const dayFree = parts[2] === '*' || parts[2] === '?'
    const weekdayFree = parts[4] === '*' || parts[4] === '?'

    if (!dayFree && !weekdayFree) {
      if (!dayMatch && !weekdayMatch) continue
    } else if (!dayFree) {
      if (!dayMatch) continue
    } else if (!weekdayFree) {
      if (!weekdayMatch) continue
    }

    runs.push(new Date(date))
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

  const ranges = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 6]]

  for (let i = 0; i < 5; i++) {
    const part = parts[i]
    if (part === '*' || part === '?') continue

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
