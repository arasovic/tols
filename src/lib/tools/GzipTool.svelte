<script>
  import { onMount } from 'svelte'

  let blur = 0
  let brightness = 100
  let contrast = 100
  let grayscale = 0
  let hueRotate = 0
  let invert = 0
  let saturate = 100
  let sepia = 0

  let filterString = ''

  function updateFilter() {
    const filters = []
    if (blur > 0) filters.push(`blur(${blur}px)`)
    if (brightness !== 100) filters.push(`brightness(${brightness}%)`)
    if (contrast !== 100) filters.push(`contrast(${contrast}%)`)
    if (grayscale > 0) filters.push(`grayscale(${grayscale}%)`)
    if (hueRotate !== 0) filters.push(`hue-rotate(${hueRotate}deg)`)
    if (invert > 0) filters.push(`invert(${invert}%)`)
    if (saturate !== 100) filters.push(`saturate(${saturate}%)`)
    if (sepia > 0) filters.push(`sepia(${sepia}%)`)
    filterString = filters.join(' ') || 'none'
  }

  onMount(() => {
    updateFilter()
  })

  function reset() {
    blur = 0
    brightness = 100
    contrast = 100
    grayscale = 0
    hueRotate = 0
    invert = 0
    saturate = 100
    sepia = 0
    updateFilter()
  }
</script>

<div class="tool">
  <div class="tool-header">
    <div class="tool-meta">
      <h1 class="tool-name">CSS Filter Generator</h1>
      <p class="tool-desc">Visual controls for CSS image filters</p>
    </div>
    <div class="tool-actions">
      <button class="icon-btn" on:click={reset} title="Reset">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  </div>

  <div class="preview-section">
    <div class="preview-image" style="filter: {filterString}">
      <svg width="200" height="150" viewBox="0 0 200 150">
        <rect width="200" height="150" fill="#6366f1"/>
        <circle cx="60" cy="50" r="30" fill="#f43f5e"/>
        <circle cx="140" cy="50" r="30" fill="#10b981"/>
        <rect x="40" y="100" width="120" height="30" fill="#f59e0b"/>
      </svg>
    </div>
    <div class="filter-code">
      <code>filter: {filterString || 'none'};</code>
    </div>
  </div>

  <div class="controls-grid">
    <div class="control">
      <label>Blur: {blur}px</label>
      <input type="range" bind:value={blur} min="0" max="20" on:input={updateFilter} />
    </div>
    <div class="control">
      <label>Brightness: {brightness}%</label>
      <input type="range" bind:value={brightness} min="0" max="200" on:input={updateFilter} />
    </div>
    <div class="control">
      <label>Contrast: {contrast}%</label>
      <input type="range" bind:value={contrast} min="0" max="200" on:input={updateFilter} />
    </div>
    <div class="control">
      <label>Grayscale: {grayscale}%</label>
      <input type="range" bind:value={grayscale} min="0" max="100" on:input={updateFilter} />
    </div>
    <div class="control">
      <label>Hue Rotate: {hueRotate}deg</label>
      <input type="range" bind:value={hueRotate} min="0" max="360" on:input={updateFilter} />
    </div>
    <div class="control">
      <label>Invert: {invert}%</label>
      <input type="range" bind:value={invert} min="0" max="100" on:input={updateFilter} />
    </div>
    <div class="control">
      <label>Saturate: {saturate}%</label>
      <input type="range" bind:value={saturate} min="0" max="200" on:input={updateFilter} />
    </div>
    <div class="control">
      <label>Sepia: {sepia}%</label>
      <input type="range" bind:value={sepia} min="0" max="100" on:input={updateFilter} />
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
  .preview-section { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); padding: var(--space-6); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .preview-image { transition: filter 0.1s; }
  .preview-image svg { border-radius: var(--radius); }
  .filter-code { padding: var(--space-3) var(--space-4); background: var(--bg-elevated); border-radius: var(--radius); font-family: var(--font-mono); font-size: var(--text-sm); }
  .controls-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-4); }
  .control { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-4); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .control label { font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-secondary); }
  .control input { width: 100%; }
  @media (max-width: 768px) { .controls-grid { grid-template-columns: 1fr; } .tool-header { flex-direction: column; align-items: flex-start; } .tool-actions { width: 100%; justify-content: flex-end; } }
</style>
