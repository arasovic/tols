<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import ToolHeader from '$lib/ui/ToolHeader.svelte'
  import ToolShell from '$lib/ui/ToolShell.svelte'
  import Button from '$lib/ui/Button.svelte'
  import { onMount } from 'svelte'
  import { ZONES, convert as convertTime, zoneNow } from 'tols-cli/core/timezone'

  let baseDate = new Date()
  let fromZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  let toZone = 'UTC'
  /** @type {{ offset: string, formatted: string } | null} */
  let convertedTime = null
  /** @type {{ name: string, time: string, date: string }[]} */
  let commonZones = []
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeout
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let saveTimeout

  // Derived once so the command strip and the ⌘⇧C payload cannot disagree. The
  // CLI converts "now" when no input is given, which is all this tool ever does
  // (packages/tols/src/tools/timezone.js).
  $: cliFlags = { from: fromZone, to: toZone }

  function loadState() {
    try {
      const savedFrom = localStorage.getItem('devutils-tz-from')
      const savedTo = localStorage.getItem('devutils-tz-to')
      if (savedFrom) fromZone = savedFrom
      if (savedTo) toZone = savedTo
    } catch (/** @type {any} */ e) {}
  }

  function saveState() {
    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem('devutils-tz-from', fromZone)
        localStorage.setItem('devutils-tz-to', toZone)
      } catch (/** @type {any} */ e) {
        console.warn('Failed to save to localStorage:', e)
      }
    }, 500)
  }

  onMount(() => {
    loadState()
    convert()
    updateCommonZones()
  })

  function convert() {
    try {
      const c = convertTime(new Date(baseDate), fromZone, toZone)
      convertedTime = {
        offset: c.offset,
        formatted: c.toFormatted
      }
    } catch (/** @type {any} */ e) {
      convertedTime = null
    }
  }

  function updateCommonZones() {
    commonZones = ZONES.map(zone => zoneNow(zone.name))
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
    } catch (/** @type {any} */ e) {}
  }

  function setNow() {
    baseDate = new Date()
    convert()
  }
</script>

<div class="tool">
  <ToolHeader toolId="timezone" />

  <ToolShell
    toolId="timezone"
    action="conv"
    flags={cliFlags}
    output={convertedTime ? convertedTime.formatted : ''}
    onRun={convert}
  >
    <div class="converter-section">
      <div class="time-inputs">
        <div class="input-group">
          <label for="from-zone">From Time Zone</label>
          <select id="from-zone" bind:value={fromZone} on:change={debouncedConvert}>
            {#each ZONES as zone}
              <option value={zone.name}>{zone.label || zone.name}</option>
            {/each}
          </select>
        </div>
        <div class="input-group">
          <label for="to-zone">To Time Zone</label>
          <select id="to-zone" bind:value={toZone} on:change={debouncedConvert}>
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

    <svelte:fragment slot="rail">
      <Button on:click={setNow} title="Set to Now">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        Now
      </Button>
      <Button on:click={clear} title="Clear">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        clear
      </Button>
    </svelte:fragment>
  </ToolShell>
</div>

<style>
  .tool { display: flex; flex-direction: column; gap: var(--space-4); width: 100%; }
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
  @media (max-width: 768px) { .time-inputs { grid-template-columns: 1fr; } }
</style>