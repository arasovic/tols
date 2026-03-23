<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount } from 'svelte'

  const CRON_PARTS = ['minute', 'hour', 'day', 'month', 'weekday']
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  let input = '* * * * *'
  let description = ''
  let nextRuns = []
  let error = ''
  let timeout
  let saveTimeout

  function loadState() {
    try {
      const savedInput = localStorage.getItem('devutils-cron-input')
      if (savedInput) input = savedInput
    } catch (e) {}
  }

  function saveState() {
    try {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        localStorage.setItem('devutils-cron-input', input)
      }, 500)
    } catch (e) {}
  }

  onMount(() => {
    loadState()
    process()
  })

  function parseCronField(field, min, max) {
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
        const [start, end] = range.includes('-') ? range.split('-').map(Number) : [range === '*' ? min : parseInt(range), max]
        for (let i = start; i <= end; i += stepVal) values.push(i)
      } else if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number)
        for (let i = start; i <= end; i++) values.push(i)
      } else {
        values.push(parseInt(part))
      }
    }

    return values.sort((a, b) => a - b)
  }

  function getDescription(cron) {
    const parts = cron.trim().split(/\s+/)
    if (parts.length !== 5) return 'Invalid cron expression'

    const [minute, hour, day, month, weekday] = parts

    if (cron === '* * * * *') return 'Every minute'
    if (cron === '0 * * * *') return 'Every hour'
    if (cron === '0 0 * * *') return 'Every day at midnight'
    if (cron === '0 0 * * 0') return 'Every Sunday at midnight'
    if (cron === '0 0 1 * *') return 'First day of every month at midnight'
    if (cron === '0 0 1 1 *') return 'First day of every year at midnight'

    let desc = 'Runs '

    if (minute !== '*') {
      desc += `at minute ${minute}`
    }
    if (hour !== '*') {
      desc += minute !== '*' ? ` past hour ${hour}` : `every hour at minute ${minute}`
    }
    if (day !== '*' && day !== '?') {
      desc += ` on day ${day}`
    }
    if (month !== '*') {
      const monthNames = parseCronField(month, 1, 12).map(m => MONTH_NAMES[m - 1]).join(', ')
      desc += ` in ${monthNames}`
    }
    if (weekday !== '*' && weekday !== '?') {
      const dayNames = parseCronField(weekday, 0, 6).map(d => WEEKDAY_NAMES[d]).join(', ')
      desc += ` on ${dayNames}`
    }

    if (desc === 'Runs ') desc = 'Custom schedule'

    return desc
  }

  function getNextRuns(cron, count = 5) {
    const parts = cron.trim().split(/\s+/)
    if (parts.length !== 5) return []

    const minutes = parseCronField(parts[0], 0, 59)
    const hours = parseCronField(parts[1], 0, 23)
    const days = parseCronField(parts[2], 1, 31)
    const months = parseCronField(parts[3], 1, 12)
    const weekdays = parseCronField(parts[4], 0, 6)

    const runs = []
    let date = new Date()
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

      if (parts[2] !== '?' && parts[4] !== '?') {
        if (!dayMatch || !weekdayMatch) continue
      } else if (parts[2] !== '?') {
        if (!dayMatch) continue
      } else if (parts[4] !== '?') {
        if (!weekdayMatch) continue
      }

      runs.push(new Date(date))
    }

    return runs
  }

  function validateCron(cron) {
    const parts = cron.trim().split(/\s+/)
    if (parts.length !== 5) return 'Cron expression must have exactly 5 parts'

    const ranges = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 6]]

    for (let i = 0; i < 5; i++) {
      const part = parts[i]
      if (part === '*' || part === '?') continue

      const subParts = part.split(',')
      for (const sub of subParts) {
        if (sub.includes('/')) {
          const [range, step] = sub.split('/')
          if (!/^\d+$/.test(step) || parseInt(step) < 1) return `Invalid step value in part ${i + 1}`
          if (range !== '*' && !/^\d+$/.test(range) && !/^\d+-\d+$/.test(range)) {
            return `Invalid range in part ${i + 1}`
          }
        } else if (sub.includes('-')) {
          const [start, end] = sub.split('-').map(Number)
          if (isNaN(start) || isNaN(end)) return `Invalid range in part ${i + 1}`
          if (start < ranges[i][0] || end > ranges[i][1]) return `Value out of range in part ${i + 1}`
        } else {
          const val = parseInt(sub)
          if (isNaN(val)) return `Invalid value in part ${i + 1}`
          if (val < ranges[i][0] || val > ranges[i][1]) return `Value out of range in part ${i + 1}`
        }
      }
    }

    return null
  }

  function process() {
    error = ''
    description = ''
    nextRuns = []

    if (!input.trim()) {
      error = 'Please enter a cron expression'
      return
    }

    const validationError = validateCron(input)
    if (validationError) {
      error = validationError
      return
    }

    description = getDescription(input)
    nextRuns = getNextRuns(input, 5)
  }

  function debouncedProcess() {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      process()
      saveState()
    }, 300)
  }

  function setExample(cron) {
    input = cron
    process()
    saveState()
  }

  function clear() {
    input = ''
    description = ''
    nextRuns = []
    error = ''
    try {
      localStorage.removeItem('devutils-cron-input')
    } catch (e) {}
  }

  function formatDate(date) {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
</script>

<div class="tool">
  <div class="tool-header">
    <div class="tool-meta">
      <h1 class="tool-name">Cron Expression Parser</h1>
      <p class="tool-desc">Validate, parse, and get next execution times for cron expressions</p>
    </div>
    <div class="tool-actions">
      <button class="icon-btn" on:click={clear} title="Clear">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  </div>

  <div class="cron-input-section">
    <div class="cron-parts">
      {#each CRON_PARTS as part, i}
        <div class="cron-part">
          <span class="cron-part-label">{part}</span>
          <span class="cron-part-value">{input.split(/\s+/)[i] || '*'}</span>
        </div>
      {/each}
    </div>
    <input type="text" bind:value={input} on:input={debouncedProcess} class="cron-input" placeholder="* * * * *" />
  </div>

  {#if error}
    <div class="error-display">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span>{error}</span>
    </div>
  {/if}

  {#if description && !error}
    <div class="description-panel">
      <h3>Description</h3>
      <p>{description}</p>
    </div>
  {/if}

  {#if nextRuns.length > 0 && !error}
    <div class="next-runs-panel">
      <div class="panel-header">
        <h3>Next Execution Times</h3>
      </div>
      <ul class="runs-list">
        {#each nextRuns as run}
          <li class="run-item">
            <span class="run-date">{formatDate(run)}</span>
            <CopyButton text={run.toISOString()} size="sm" />
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  <div class="examples-section">
    <h3>Common Examples</h3>
    <div class="examples-grid">
      <button class="example-btn" on:click={() => setExample('*/5 * * * *')}>Every 5 minutes</button>
      <button class="example-btn" on:click={() => setExample('0 * * * *')}>Every hour</button>
      <button class="example-btn" on:click={() => setExample('0 0 * * *')}>Daily at midnight</button>
      <button class="example-btn" on:click={() => setExample('0 0 * * 0')}>Weekly on Sunday</button>
      <button class="example-btn" on:click={() => setExample('0 0 1 * *')}>Monthly</button>
      <button class="example-btn" on:click={() => setExample('0 9 * * 1-5')}>Weekdays at 9am</button>
    </div>
  </div>
</div>

<style>
  .tool { display: flex; flex-direction: column; gap: var(--space-5); width: 100%; animation: fadeIn var(--transition) var(--ease-out); }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  .tool-header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); padding-bottom: var(--space-4); border-bottom: 1px solid var(--border-subtle); }
  .tool-meta { display: flex; flex-direction: column; gap: var(--space-1); }
  .tool-name { font-size: var(--text-xl); font-weight: var(--font-semibold); color: var(--text-primary); letter-spacing: var(--tracking-tight); margin: 0; }
  .tool-desc { font-size: var(--text-sm); color: var(--text-tertiary); margin: 0; }
  .tool-actions { display: flex; align-items: center; gap: var(--space-2); }
  .icon-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: var(--radius); background: transparent; color: var(--text-tertiary); border: none; cursor: pointer; transition: all var(--transition-fast); }
  .icon-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
  .cron-input-section { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-4); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .cron-parts { display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--space-2); }
  .cron-part { display: flex; flex-direction: column; align-items: center; gap: var(--space-1); padding: var(--space-2); background: var(--bg-elevated); border-radius: var(--radius); }
  .cron-part-label { font-size: var(--text-xs); text-transform: uppercase; letter-spacing: var(--tracking-wide); color: var(--text-tertiary); }
  .cron-part-value { font-family: var(--font-mono); font-size: var(--text-lg); font-weight: var(--font-semibold); color: var(--text-primary); }
  .cron-input { width: 100%; padding: var(--space-3); font-family: var(--font-mono); font-size: var(--text-lg); text-align: center; color: var(--text-primary); background: var(--bg-elevated); border: 1px solid var(--border-default); border-radius: var(--radius); outline: none; }
  .cron-input:focus { border-color: var(--accent); box-shadow: var(--glow-focus); }
  .error-display { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4); background: var(--error-soft); color: var(--error-text); border-radius: var(--radius-md); }
  .description-panel { padding: var(--space-4); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .description-panel h3 { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--text-tertiary); margin: 0 0 var(--space-2) 0; text-transform: uppercase; letter-spacing: var(--tracking-wide); }
  .description-panel p { font-size: var(--text-lg); color: var(--text-primary); margin: 0; }
  .next-runs-panel { background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden; }
  .panel-header { padding: var(--space-3) var(--space-4); background: var(--bg-elevated); border-bottom: 1px solid var(--border-subtle); }
  .panel-header h3 { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--text-tertiary); margin: 0; text-transform: uppercase; letter-spacing: var(--tracking-wide); }
  .runs-list { list-style: none; margin: 0; padding: 0; }
  .run-item { display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border-subtle); }
  .run-item:last-child { border-bottom: none; }
  .run-date { font-family: var(--font-mono); font-size: var(--text-sm); color: var(--text-primary); }
  .examples-section h3 { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--text-tertiary); margin-bottom: var(--space-3); text-transform: uppercase; letter-spacing: var(--tracking-wide); }
  .examples-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: var(--space-2); }
  .example-btn { padding: var(--space-2) var(--space-3); font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-secondary); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius); cursor: pointer; transition: all var(--transition-fast); }
  .example-btn:hover { background: var(--accent-soft); color: var(--accent); border-color: var(--accent-dim); }
  @media (max-width: 768px) { .cron-parts { grid-template-columns: repeat(3, 1fr); } .examples-grid { grid-template-columns: repeat(2, 1fr); } }
</style>
