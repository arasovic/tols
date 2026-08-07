<script>
  import { onMount, onDestroy } from 'svelte'
  import CopyButton from '$lib/components/CopyButton.svelte'
  import ToolHeader from '$lib/ui/ToolHeader.svelte'
  import ToolShell from '$lib/ui/ToolShell.svelte'
  import Button from '$lib/ui/Button.svelte'
  import { DEFAULTS, clampValue, buildFilter } from 'tols-cli/core/cssfilter'

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
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let updateTimeout
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let saveTimeout
  let prefersReducedMotion = false

  // Derived once so the command strip and the ⌘⇧C payload cannot disagree. The
  // CLI flag is kebab-cased --hue-rotate (packages/tols/src/tools/cssfilter.js),
  // and the output is the CSS declaration the preview shows.
  $: cliFlags = {
    blur,
    brightness,
    contrast,
    grayscale,
    'hue-rotate': hueRotate,
    invert,
    saturate,
    sepia
  }
  $: cliOutput = `filter: ${filterString};`

  function updateFilter() {
    filterString = buildFilter({ blur, brightness, contrast, grayscale, hueRotate, invert, saturate, sepia })
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
      } catch (/** @type {any} */ e) {
        console.warn('Failed to save to localStorage:', e)
      }
    }, SAVE_DELAY)
  }

  function loadState() {
    try {
      blur = clampValue('blur', localStorage.getItem('devutils-cssfilter-blur') || 0)
      brightness = clampValue('brightness', localStorage.getItem('devutils-cssfilter-brightness') || 100)
      contrast = clampValue('contrast', localStorage.getItem('devutils-cssfilter-contrast') || 100)
      grayscale = clampValue('grayscale', localStorage.getItem('devutils-cssfilter-grayscale') || 0)
      hueRotate = clampValue('hueRotate', localStorage.getItem('devutils-cssfilter-hueRotate') || 0)
      invert = clampValue('invert', localStorage.getItem('devutils-cssfilter-invert') || 0)
      saturate = clampValue('saturate', localStorage.getItem('devutils-cssfilter-saturate') || 100)
      sepia = clampValue('sepia', localStorage.getItem('devutils-cssfilter-sepia') || 0)
    } catch (/** @type {any} */ e) {
      console.warn('Failed to load from localStorage:', e)
    }
    updateFilter()
  }

  function reset() {
    blur = DEFAULTS.blur
    brightness = DEFAULTS.brightness
    contrast = DEFAULTS.contrast
    grayscale = DEFAULTS.grayscale
    hueRotate = DEFAULTS.hueRotate
    invert = DEFAULTS.invert
    saturate = DEFAULTS.saturate
    sepia = DEFAULTS.sepia
    updateFilter()
  }

  /**
   * @param {Event & { currentTarget: HTMLInputElement }} event
   */
  function handleBlurInput(event) {
    blur = clampValue('blur', event.currentTarget.value)
    debouncedUpdate()
  }

  /**
   * @param {Event & { currentTarget: HTMLInputElement }} event
   */
  function handleBrightnessInput(event) {
    brightness = clampValue('brightness', event.currentTarget.value)
    debouncedUpdate()
  }

  /**
   * @param {Event & { currentTarget: HTMLInputElement }} event
   */
  function handleContrastInput(event) {
    contrast = clampValue('contrast', event.currentTarget.value)
    debouncedUpdate()
  }

  /**
   * @param {Event & { currentTarget: HTMLInputElement }} event
   */
  function handleGrayscaleInput(event) {
    grayscale = clampValue('grayscale', event.currentTarget.value)
    debouncedUpdate()
  }

  /**
   * @param {Event & { currentTarget: HTMLInputElement }} event
   */
  function handleHueRotateInput(event) {
    hueRotate = clampValue('hueRotate', event.currentTarget.value)
    debouncedUpdate()
  }

  /**
   * @param {Event & { currentTarget: HTMLInputElement }} event
   */
  function handleInvertInput(event) {
    invert = clampValue('invert', event.currentTarget.value)
    debouncedUpdate()
  }

  /**
   * @param {Event & { currentTarget: HTMLInputElement }} event
   */
  function handleSaturateInput(event) {
    saturate = clampValue('saturate', event.currentTarget.value)
    debouncedUpdate()
  }

  /**
   * @param {Event & { currentTarget: HTMLInputElement }} event
   */
  function handleSepiaInput(event) {
    sepia = clampValue('sepia', event.currentTarget.value)
    debouncedUpdate()
  }

  onMount(() => {
    loadState()

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion = mediaQuery.matches

    /** @param {MediaQueryListEvent} e */
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
  <ToolHeader toolId="css-filter" />

  <ToolShell
    toolId="css-filter"
    action="gen"
    flags={cliFlags}
    output={cliOutput}
  >
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

    <svelte:fragment slot="rail">
      <Button on:click={reset} title="Reset" aria-label="Reset all filters to default values">reset</Button>
    </svelte:fragment>
  </ToolShell>
</div>

<style>
  .tool {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    width: 100%;
  }

  @media (prefers-reduced-motion: reduce) {
    .tool {
      animation: none;
    }
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
  }
</style>