<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount } from 'svelte'

  let baseDate = new Date()
  let fromZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  let toZone = 'UTC'
  let convertedTime = null
  let commonZones = []
  let timeout
  let saveTimeout

  const ZONES = [
    { name: 'UTC', offset: '+00:00' },
    { name: 'America/New_York', label: 'New York' },
    { name: 'America/Los_Angeles', label: 'Los Angeles' },
    { name: 'America/Chicago', label: 'Chicago' },
    { name: 'Europe/London', label: 'London' },
    { name: 'Europe/Paris', label: 'Paris' },
    { name: 'Europe/Berlin', label: 'Berlin' },
    { name: 'Asia/Tokyo', label: 'Tokyo' },
    { name: 'Asia/Shanghai', label: 'Shanghai' },
    { name: 'Asia/Singapore', label: 'Singapore' },
    { name: 'Asia/Dubai', label: 'Dubai' },
    { name: 'Australia/Sydney', label: 'Sydney' },
    { name: 'Pacific/Auckland', label: 'Auckland' },
  ]

  function loadState() {
    try {
      const savedFrom = localStorage.getItem('devutils-tz-from')
      const savedTo = localStorage.getItem('devutils-tz-to')
      if (savedFrom) fromZone = savedFrom
      if (savedTo) toZone = savedTo
    } catch (e) {}
  }

  function saveState() {
    try {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        localStorage.setItem('devutils-tz-from', fromZone)
        localStorage.setItem('devutils-tz-to', toZone)
      }, 500)
    } catch (e) {}
  }

  onMount(() => {
    loadState()
    convert()
    updateCommonZones()
  })

  function convert() {
    try {
      const date = new Date(baseDate)
      const fromTime = new Date(date.toLocaleString('en-US', { timeZone: fromZone }))
      const toTime = new Date(date.toLocaleString('en-US', { timeZone: toZone }))
      const diffMs = toTime.getTime() - fromTime.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      
      convertedTime = {
        result: toTime,
        offset: diffHours >= 0 ? `+${diffHours.toFixed(1)}` : diffHours.toFixed(1),
        formatted: toTime.toLocaleString('en-US', { 
          timeZone: toZone,
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      }
    } catch (e) {
      convertedTime = null
    }
  }

  function updateCommonZones() {
    commonZones = ZONES.map(zone => {
      const now = new Date()
      return {
        name: zone.label || zone.name,
        time: now.toLocaleString('en-US', { 
          timeZone: zone.name,
          hour: '2-digit',
          minute: '2-digit'
        }),
        date: now.toLocaleString('en-US', { 
          timeZone: zone.name,
          month: 'short',
          day: 'numeric'
        })
      }
    })
  }

  function debouncedConvert() {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      convert()
      saveState()
    }, 300)
  }

  function clear() {
    baseDate = new Date()
    fromZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    toZone = 'UTC'
    convert()
    try {
      localStorage.removeItem('devutils-tz-from')
      localStorage.removeItem('devutils-tz-to')
    } catch (e) {}
  }

  function setNow() {
    baseDate = new Date()
    convert()
  }
</script>

<div class="tool">
  <div class="tool-header">
    <div class="tool-meta">
      <h1 class="tool-name">Time Zone Converter</h1>
      <p class="tool-desc">Convert times between different time zones</p>
    </div>
    <div class="tool-actions">
      <button class="icon-btn" on:click={setNow} title="Set to Now">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </button>
      <button class="icon-btn" on:click={clear} title="Clear">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  </div>

  <div class="converter-section">
    <div class="time-inputs">
      <div class="input-group">
        <label>From Time Zone</label>
        <select bind:value={fromZone} on:change={debouncedConvert}>
          {#each ZONES as zone}
            <option value={zone.name}>{zone.label || zone.name}</option>
          {/each}
        </select>
      </div>
      <div class="input-group">
        <label>To Time Zone</label>
        <select bind:value={toZone} on:change={debouncedConvert}>
          {#each ZONES as zone}
            <option value={zone.name}>{zone.label || zone.name}</option>
          {/each}
        </select>
      </div>
    </div>

    {#if convertedTime}
      <div class="result-display">
        <div class="time-result">
          <span class="time-value">{convertedTime.formatted}</span>
          <span class="time-offset">({convertedTime.offset}h)</span>
        </div>
        <CopyButton text={convertedTime.formatted} />
      </div>
    {/if}
  </div>

  <div class="common-times">
    <h3>Current Times Around the World</h3>
    <div class="times-grid">
      {#each commonZones as zone}
        <div class="zone-card">
          <span class="zone-name">{zone.name}</span>
          <span class="zone-time">{zone.time}</span>
          <span class="zone-date">{zone.date}</span>
        </div>
      {/each}
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
  .converter-section { display: flex; flex-direction: column; gap: var(--space-4); padding: var(--space-4); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .time-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
  .input-group { display: flex; flex-direction: column; gap: var(--space-1); }
  .input-group label { font-size: var(--text-xs); font-weight: var(--font-medium); text-transform: uppercase; letter-spacing: var(--tracking-wide); color: var(--text-tertiary); }
  .input-group select { padding: var(--space-3); border: 1px solid var(--border-default); border-radius: var(--radius); background: var(--bg-base); color: var(--text-primary); font-size: var(--text-base); outline: none; }
  .input-group select:focus { border-color: var(--accent); }
  .result-display { display: flex; align-items: center; justify-content: space-between; padding: var(--space-4); background: var(--accent-soft); border-radius: var(--radius-md); }
  .time-result { display: flex; align-items: center; gap: var(--space-2); }
  .time-value { font-family: var(--font-mono); font-size: var(--text-lg); font-weight: var(--font-semibold); color: var(--text-primary); }
  .time-offset { font-size: var(--text-sm); color: var(--text-secondary); }
  .common-times h3 { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--text-tertiary); margin-bottom: var(--space-3); text-transform: uppercase; letter-spacing: var(--tracking-wide); }
  .times-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: var(--space-2); }
  .zone-card { display: flex; flex-direction: column; padding: var(--space-3); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .zone-name { font-size: var(--text-xs); color: var(--text-tertiary); }
  .zone-time { font-family: var(--font-mono); font-size: var(--text-lg); font-weight: var(--font-semibold); color: var(--text-primary); }
  .zone-date { font-size: var(--text-xs); color: var(--text-secondary); }
  @media (max-width: 768px) { .time-inputs { grid-template-columns: 1fr; } .tool-header { flex-direction: column; align-items: flex-start; } .tool-actions { width: 100%; justify-content: flex-end; } }
</style>
