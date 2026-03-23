<script>
  import { onMount } from 'svelte'

  let width = 400
  let height = 300
  let bgColor = '#E5E7EB'
  let textColor = '#374151'
  let placeholderText = ''
  let canvas
  let timeout
  let saveTimeout

  function loadState() {
    try {
      const savedWidth = localStorage.getItem('devutils-placeholder-width')
      const savedHeight = localStorage.getItem('devutils-placeholder-height')
      const savedBg = localStorage.getItem('devutils-placeholder-bg')
      const savedText = localStorage.getItem('devutils-placeholder-text')
      if (savedWidth) width = parseInt(savedWidth)
      if (savedHeight) height = parseInt(savedHeight)
      if (savedBg) bgColor = savedBg
      if (savedText) placeholderText = savedText
    } catch (e) {}
  }

  function saveState() {
    try {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        localStorage.setItem('devutils-placeholder-width', width.toString())
        localStorage.setItem('devutils-placeholder-height', height.toString())
        localStorage.setItem('devutils-placeholder-bg', bgColor)
        localStorage.setItem('devutils-placeholder-text', placeholderText)
      }, 500)
    } catch (e) {}
  }

  onMount(() => {
    loadState()
    if (canvas) drawPlaceholder()
  })

  function drawPlaceholder() {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = width
    canvas.height = height

    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, width, height)

    ctx.strokeStyle = textColor
    ctx.lineWidth = 2
    ctx.strokeRect(20, 20, width - 40, height - 40)

    const displayText = placeholderText || `${width}x${height}`
    ctx.fillStyle = textColor
    ctx.font = 'bold 24px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(displayText, width / 2, height / 2)

    ctx.font = '14px sans-serif'
    ctx.fillText('Placeholder', width / 2, height / 2 + 30)
  }

  function debouncedDraw() {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      drawPlaceholder()
      saveState()
    }, 300)
  }

  function downloadPNG() {
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `placeholder-${width}x${height}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  function clear() {
    width = 400
    height = 300
    bgColor = '#E5E7EB'
    textColor = '#374151'
    placeholderText = ''
    try {
      localStorage.removeItem('devutils-placeholder-width')
      localStorage.removeItem('devutils-placeholder-height')
      localStorage.removeItem('devutils-placeholder-bg')
      localStorage.removeItem('devutils-placeholder-text')
    } catch (e) {}
    drawPlaceholder()
  }
</script>

<div class="tool">
  <div class="tool-header">
    <div class="tool-meta">
      <h1 class="tool-name">Image Placeholder</h1>
      <p class="tool-desc">Generate colored placeholder images</p>
    </div>
    <div class="tool-actions">
      <button class="icon-btn" on:click={clear} title="Clear">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  </div>

  <div class="controls">
    <div class="control-group">
      <label>Width</label>
      <input type="number" bind:value={width} min="50" max="2000" on:input={debouncedDraw} />
    </div>
    <div class="control-group">
      <label>Height</label>
      <input type="number" bind:value={height} min="50" max="2000" on:input={debouncedDraw} />
    </div>
    <div class="control-group">
      <label>Background</label>
      <input type="color" bind:value={bgColor} on:input={debouncedDraw} />
    </div>
    <div class="control-group">
      <label>Text Color</label>
      <input type="color" bind:value={textColor} on:input={debouncedDraw} />
    </div>
    <div class="control-group wide">
      <label>Custom Text</label>
      <input type="text" bind:value={placeholderText} on:input={debouncedDraw} placeholder="Leave empty for dimensions..." />
    </div>
  </div>

  <div class="preview">
    <canvas bind:this={canvas}></canvas>
    <button class="download-btn" on:click={downloadPNG}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Download PNG
    </button>
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
  .controls { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--space-4); padding: var(--space-4); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .control-group { display: flex; flex-direction: column; gap: var(--space-1); }
  .control-group.wide { grid-column: 1 / -1; }
  .control-group label { font-size: var(--text-xs); font-weight: var(--font-medium); text-transform: uppercase; letter-spacing: var(--tracking-wide); color: var(--text-tertiary); }
  .control-group input { padding: var(--space-2); border: 1px solid var(--border-default); border-radius: var(--radius); background: var(--bg-base); color: var(--text-primary); font-size: var(--text-sm); outline: none; }
  .control-group input:focus { border-color: var(--accent); }
  .control-group input[type="color"] { height: 38px; cursor: pointer; }
  .preview { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); padding: var(--space-6); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .preview canvas { border-radius: var(--radius); box-shadow: var(--shadow-sm); }
  .download-btn { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); font-size: var(--text-sm); font-weight: var(--font-medium); color: white; background: var(--accent); border: none; border-radius: var(--radius); cursor: pointer; transition: all var(--transition-fast); }
  .download-btn:hover { background: var(--accent-hover); }
  @media (max-width: 768px) { .controls { grid-template-columns: 1fr; } .tool-header { flex-direction: column; align-items: flex-start; } .tool-actions { width: 100%; justify-content: flex-end; } }
</style>
