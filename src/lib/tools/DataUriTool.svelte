<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount } from 'svelte'

  let dataUrl = ''
  let mimeType = ''
  let fileSize = ''
  let error = ''
  let fileInput

  function handleFileSelect(event) {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      dataUrl = e.target.result
      mimeType = file.type || 'application/octet-stream'
      fileSize = formatFileSize(file.size)
    }
    reader.onerror = () => {
      error = 'Error reading file'
    }
    reader.readAsDataURL(file)
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  function clear() {
    dataUrl = ''
    mimeType = ''
    fileSize = ''
    error = ''
    if (fileInput) fileInput.value = ''
  }
</script>

<div class="tool">
  <div class="tool-header">
    <div class="tool-meta">
      <h1 class="tool-name">Data URI Generator</h1>
      <p class="tool-desc">Convert files to Data URIs</p>
    </div>
    <div class="tool-actions">
      <button class="icon-btn" on:click={clear} title="Clear">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  </div>

  <div class="upload-section">
    <input type="file" bind:this={fileInput} on:change={handleFileSelect} class="file-input" />
    <div class="upload-hint">Select a file to convert to Data URI</div>
  </div>

  {#if error}
    <div class="error-display">{error}</div>
  {/if}

  {#if dataUrl}
    <div class="result-section">
      <div class="file-info">
        <div class="info-item">
          <span class="info-label">Type:</span>
          <span class="info-value">{mimeType}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Size:</span>
          <span class="info-value">{fileSize}</span>
        </div>
      </div>

      <div class="dataurl-output">
        <div class="output-header">
          <span>Data URI</span>
          <CopyButton text={dataUrl} />
        </div>
        <textarea readonly class="dataurl-text">{dataUrl.substring(0, 200)}...</textarea>
      </div>

      {#if mimeType.startsWith('image/')}
        <div class="preview-section">
          <span class="preview-label">Preview</span>
          <img src={dataUrl} alt="Preview" class="preview-image" />
        </div>
      {/if}
    </div>
  {/if}
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
  .upload-section { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-6); background: var(--bg-surface); border: 2px dashed var(--border-subtle); border-radius: var(--radius-md); }
  .file-input { width: 100%; }
  .upload-hint { font-size: var(--text-sm); color: var(--text-secondary); }
  .error-display { padding: var(--space-3); background: var(--error-soft); color: var(--error-text); border-radius: var(--radius-md); }
  .result-section { display: flex; flex-direction: column; gap: var(--space-4); }
  .file-info { display: flex; gap: var(--space-4); padding: var(--space-3); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .info-item { display: flex; gap: var(--space-2); }
  .info-label { font-size: var(--text-sm); color: var(--text-tertiary); }
  .info-value { font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-primary); }
  .dataurl-output { background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden; }
  .output-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3); background: var(--bg-elevated); border-bottom: 1px solid var(--border-subtle); font-size: var(--text-xs); font-weight: var(--font-semibold); text-transform: uppercase; letter-spacing: var(--tracking-wide); color: var(--text-tertiary); }
  .dataurl-text { width: 100%; min-height: 100px; padding: var(--space-3); border: none; background: var(--bg-surface); color: var(--text-primary); font-family: var(--font-mono); font-size: var(--text-sm); resize: none; }
  .preview-section { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-4); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .preview-label { font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-tertiary); }
  .preview-image { max-width: 100%; max-height: 300px; border-radius: var(--radius); }
</style>
