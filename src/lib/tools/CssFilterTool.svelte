<script>
  import { onMount, onDestroy } from 'svelte'
  import CopyButton from '$lib/components/CopyButton.svelte'

  const DEBOUNCE_WAIT = 50
  const SAVE_DELAY = 300

  let blur = 0
  let brightness = 100
  let contrast = 100
  let grayscale = 0
  let hueRotate = 0
  let invert = 0
  let saturate = 100
  let sepia = 0

  let filterString = 'none'
  let updateTimeout
  let saveTimeout
  let prefersReducedMotion = false

  const FILTER_LIMITS = {
    blur: { min: 0, max: 20 },
    brightness: { min: 0, max: 200 },
    contrast: { min: 0, max: 200 },
    grayscale: { min: 0, max: 100 },
    hueRotate: { min: 0, max: 360 },
    invert: { min: 0, max: 100 },
    saturate: { min: 0, max: 200 },
    sepia: { min: 0, max: 100 }
  }

  function validateValue(name, value) {
    const limits = FILTER_LIMITS[name]
    if (!limits) return value
    return Math.max(limits.min, Math.min(limits.max, Number(value) || 0))
  }

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
    debouncedSave()
  }

  function debouncedUpdate() {
    if (updateTimeout) {
      clearTimeout(updateTimeout)
    }
    updateTimeout = setTimeout(updateFilter, DEBOUNCE_WAIT)
  }

  function debouncedSave() {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem('devutils-cssfilter-blur', blur.toString())
        localStorage.setItem('devutils-cssfilter-brightness', brightness.toString())
        localStorage.setItem('devutils-cssfilter-contrast', contrast.toString())
        localStorage.setItem('devutils-cssfilter-grayscale', grayscale.toString())
        localStorage.setItem('devutils-cssfilter-hueRotate', hueRotate.toString())
        localStorage.setItem('devutils-cssfilter-invert', invert.toString())
        localStorage.setItem('devutils-cssfilter-saturate', saturate.toString())
        localStorage.setItem('devutils-cssfilter-sepia', sepia.toString())
      } catch (e) {
        console.warn('Failed to save to localStorage:', e)
      }
    }, SAVE_DELAY)
  }

  function loadState() {
    try {
      blur = validateValue('blur', localStorage.getItem('devutils-cssfilter-blur') || 0)
      brightness = validateValue('brightness', localStorage.getItem('devutils-cssfilter-brightness') || 100)
      contrast = validateValue('contrast', localStorage.getItem('devutils-cssfilter-contrast') || 100)
      grayscale = validateValue('grayscale', localStorage.getItem('devutils-cssfilter-grayscale') || 0)
      hueRotate = validateValue('hueRotate', localStorage.getItem('devutils-cssfilter-hueRotate') || 0)
      invert = validateValue('invert', localStorage.getItem('devutils-cssfilter-invert') || 0)
      saturate = validateValue('saturate', localStorage.getItem('devutils-cssfilter-saturate') || 100)
      sepia = validateValue('sepia', localStorage.getItem('devutils-cssfilter-sepia') || 0)
    } catch (e) {
      console.warn('Failed to load from localStorage:', e)
    }
    updateFilter()
  }

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

  function handleBlurInput(event) {
    blur = validateValue('blur', event.target.value)
    debouncedUpdate()
  }

  function handleBrightnessInput(event) {
    brightness = validateValue('brightness', event.target.value)
    debouncedUpdate()
  }

  function handleContrastInput(event) {
    contrast = validateValue('contrast', event.target.value)
    debouncedUpdate()
  }

  function handleGrayscaleInput(event) {
    grayscale = validateValue('grayscale', event.target.value)
    debouncedUpdate()
  }

  function handleHueRotateInput(event) {
    hueRotate = validateValue('hueRotate', event.target.value)
    debouncedUpdate()
  }

  function handleInvertInput(event) {
    invert = validateValue('invert', event.target.value)
    debouncedUpdate()
  }

  function handleSaturateInput(event) {
    saturate = validateValue('saturate', event.target.value)
    debouncedUpdate()
  }

  function handleSepiaInput(event) {
    sepia = validateValue('sepia', event.target.value)
    debouncedUpdate()
  }

  onMount(() => {
    loadState()

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion = mediaQuery.matches

    const handleChange = (e) => {
      prefersReducedMotion = e.matches
    }
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  })

  onDestroy(() => {
    if (updateTimeout) clearTimeout(updateTimeout)
    if (saveTimeout) clearTimeout(saveTimeout)
  })
</script>

<div class="tool">
  <div class="tool-header">
    <div class="tool-meta">
      <h1 class="tool-name">CSS Filter Generator</h1>
      <p class="tool-desc">Visual controls for CSS image filters</p>
    </div>
    <div class="tool-actions">
      <button
        class="icon-btn"
        on:click={reset}
        title="Reset"
        aria-label="Reset all filters to default values"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    </div>
  </div>

  <div class="preview-section">
    <div class="preview-image" style="filter: {filterString}; transition: {prefersReducedMotion ? 'none' : 'filter 0.1s'}">
      <svg width="200" height="150" viewBox="0 0 200 150" aria-label="Sample image for filter preview">
        <rect width="200" height="150" fill="#6366f1"/>
        <circle cx="60" cy="50" r="30" fill="#f43f5e"/>
        <circle cx="140" cy="50" r="30" fill="#10b981"/>
        <rect x="40" y="100" width="120" height="30" fill="#f59e0b"/>
      </svg>
    </div>
    <div class="filter-code">
      <code>filter: {filterString || 'none'};</code>
      <CopyButton text={`filter: ${filterString || 'none'};`} />
    </div>
  </div>

  <div class="controls-grid">
    <div class="control">
      <label for="blur-control">Blur: {blur}px</label>
      <input
        id="blur-control"
        type="range"
        value={blur}
        min="0"
        max="20"
        on:input={handleBlurInput}
        aria-label="Blur filter amount"
        aria-valuemin="0"
        aria-valuemax="20"
        aria-valuenow={blur}
      />
    </div>
    <div class="control">
      <label for="brightness-control">Brightness: {brightness}%</label>
      <input
        id="brightness-control"
        type="range"
        value={brightness}
        min="0"
        max="200"
        on:input={handleBrightnessInput}
        aria-label="Brightness filter amount"
        aria-valuemin="0"
        aria-valuemax="200"
        aria-valuenow={brightness}
      />
    </div>
    <div class="control">
      <label for="contrast-control">Contrast: {contrast}%</label>
      <input
        id="contrast-control"
        type="range"
        value={contrast}
        min="0"
        max="200"
        on:input={handleContrastInput}
        aria-label="Contrast filter amount"
        aria-valuemin="0"
        aria-valuemax="200"
        aria-valuenow={contrast}
      />
    </div>
    <div class="control">
      <label for="grayscale-control">Grayscale: {grayscale}%</label>
      <input
        id="grayscale-control"
        type="range"
        value={grayscale}
        min="0"
        max="100"
        on:input={handleGrayscaleInput}
        aria-label="Grayscale filter amount"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={grayscale}
      />
    </div>
    <div class="control">
      <label for="hue-rotate-control">Hue Rotate: {hueRotate}deg</label>
      <input
        id="hue-rotate-control"
        type="range"
        value={hueRotate}
        min="0"
        max="360"
        on:input={handleHueRotateInput}
        aria-label="Hue rotation filter amount"
        aria-valuemin="0"
        aria-valuemax="360"
        aria-valuenow={hueRotate}
      />
    </div>
    <div class="control">
      <label for="invert-control">Invert: {invert}%</label>
      <input
        id="invert-control"
        type="range"
        value={invert}
        min="0"
        max="100"
        on:input={handleInvertInput}
        aria-label="Invert filter amount"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={invert}
      />
    </div>
    <div class="control">
      <label for="saturate-control">Saturate: {saturate}%</label>
      <input
        id="saturate-control"
        type="range"
        value={saturate}
        min="0"
        max="200"
        on:input={handleSaturateInput}
        aria-label="Saturation filter amount"
        aria-valuemin="0"
        aria-valuemax="200"
        aria-valuenow={saturate}
      />
    </div>
    <div class="control">
      <label for="sepia-control">Sepia: {sepia}%</label>
      <input
        id="sepia-control"
        type="range"
        value={sepia}
        min="0"
        max="100"
        on:input={handleSepiaInput}
        aria-label="Sepia filter amount"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={sepia}
      />
    </div>
  </div>
</div>

<style>
  .tool {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    width: 100%;
    animation: fadeIn var(--transition) var(--ease-out);
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .tool {
      animation: none;
    }
  }

  .tool-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-4);
    padding-bottom: var(--space-4);
    border-bottom: 1px solid var(--border-subtle);
  }

  .tool-meta {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .tool-name {
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    letter-spacing: var(--tracking-tight);
    margin: 0;
  }

  .tool-desc {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    margin: 0;
  }

  .tool-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius);
    background: transparent;
    color: var(--text-tertiary);
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .icon-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .preview-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-6);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
  }

  .preview-image {
    transition: filter 0.1s;
  }

  .preview-image svg {
    border-radius: var(--radius);
  }

  @media (prefers-reduced-motion: reduce) {
    .preview-image {
      transition: none;
    }
  }

  .filter-code {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--bg-elevated);
    border-radius: var(--radius);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
  }

  .controls-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);
  }

  .control {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-4);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
  }

  .control label {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
  }

  .control input {
    width: 100%;
  }

  @media (max-width: 768px) {
    .controls-grid {
      grid-template-columns: 1fr;
    }

    .tool-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .tool-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
</style>
