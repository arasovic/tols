<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount, onDestroy } from 'svelte'

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  const MAX_FILE_SIZE_MB = 10
  const DATA_URL_TRUNCATE_LIMIT = 200
  const FILE_SIZE_UNITS = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  let dataUrl = ''
  let mimeType = ''
  let fileSize = ''
  let error = ''
  let isLoading = false
  let fileInput
  let fileName = ''
  let currentReader = null
  let truncatedDataUrl = ''

  function inferMimeTypeFromExtension(filename) {
    const ext = filename.split('.').pop().toLowerCase()
    const mimeMap = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'txt': 'text/plain',
      'json': 'application/json',
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript'
    }
    return mimeMap[ext] || 'application/octet-stream'
  }

  function handleFileSelect(event) {
    const file = event.target.files[0]
    if (!file) return

    // Clear any previous error and reader
    error = ''
    if (currentReader) {
      currentReader.abort()
      currentReader = null
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      error = `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB. Your file is ${formatFileSize(file.size)}.`
      return
    }

    isLoading = true
    fileName = file.name

    const reader = new FileReader()
    currentReader = reader

    reader.onload = (e) => {
      dataUrl = e.target.result
      truncatedDataUrl = getTruncatedDataUrl(dataUrl)
      mimeType = file.type || inferMimeTypeFromExtension(file.name)
      fileSize = formatFileSize(file.size)
      isLoading = false
      currentReader = null
    }

    reader.onerror = () => {
      error = 'Error reading file. Please try again with a different file.'
      isLoading = false
      currentReader = null
    }

    reader.onabort = () => {
      isLoading = false
      currentReader = null
    }

    reader.readAsDataURL(file)
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    const unitIndex = Math.min(i, FILE_SIZE_UNITS.length - 1)
    return parseFloat((bytes / Math.pow(k, unitIndex)).toFixed(2)) + ' ' + FILE_SIZE_UNITS[unitIndex]
  }

  function getTruncatedDataUrl(url) {
    if (url.length <= DATA_URL_TRUNCATE_LIMIT) return url
    return url.substring(0, DATA_URL_TRUNCATE_LIMIT) + '...'
  }

  function isImageFile() {
    return mimeType.startsWith('image/')
  }

  function clear() {
    if (currentReader) {
      currentReader.abort()
      currentReader = null
    }
    dataUrl = ''
    truncatedDataUrl = ''
    mimeType = ''
    fileSize = ''
    error = ''
    isLoading = false
    fileName = ''
    if (fileInput) {
      fileInput.value = ''
      fileInput.focus()
    }
  }

  onDestroy(() => {
    if (currentReader) {
      currentReader.abort()
    }
  })
</script>

<div class="tool">
  <div class="tool-header">
    <div class="tool-meta">
      <h1 class="tool-name">Data URI Generator</h1>
      <p class="tool-desc">Convert files to Data URIs</p>
    </div>
    <div class="tool-actions">
      <button class="icon-btn" on:click={clear} title="Clear" data-testid="clear-button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  </div>

  <div class="upload-section">
    <input
      type="file"
      bind:this={fileInput}
      on:change={handleFileSelect}
      class="file-input"
      accept="image/*,video/*,audio/*,application/pdf,text/plain,text/html,application/json"
      aria-label="Choose file to convert"
      data-testid="file-input"
    />
    <div class="upload-hint">Select a file to convert to Data URI (max {MAX_FILE_SIZE_MB}MB)</div>
  </div>

  {#if isLoading}
    <div class="loading-display" data-testid="loading-indicator">
      <span class="loading-spinner"></span>
      <span>Reading file...</span>
    </div>
  {/if}

  {#if error}
    <div class="error-display" role="alert" data-testid="error-message">{error}</div>
  {/if}

  {#if dataUrl}
    <div class="result-section" data-testid="result-section">
      <div class="file-info">
        {#if fileName}
          <div class="info-item" data-testid="filename-display">
            <span class="info-label">Name:</span>
            <span class="info-value">{fileName}</span>
          </div>
        {/if}
        <div class="info-item">
          <span class="info-label">Type:</span>
          <span class="info-value" data-testid="mime-type">{mimeType}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Size:</span>
          <span class="info-value">{fileSize}</span>
        </div>
      </div>

      <div class="dataurl-output">
        <div class="output-header">
          <span>Data URI</span>
          {#if dataUrl}
            <div data-testid="copy-button">
              <CopyButton text={dataUrl} />
            </div>
          {/if}
        </div>
        <textarea
          readonly
          class="dataurl-text"
          aria-label="Data URI output (truncated for display)"
          data-testid="data-url-output"
          value={truncatedDataUrl}
        ></textarea>
        {#if dataUrl.length > DATA_URL_TRUNCATE_LIMIT}
          <div class="truncation-notice">Showing first {DATA_URL_TRUNCATE_LIMIT} characters of {dataUrl.length} total</div>
        {/if}
      </div>

      {#if isImageFile()}
        <div class="preview-section" data-testid="image-preview">
          <span class="preview-label">Preview</span>
          <img src={dataUrl} alt="Preview of {fileName}" class="preview-image" />
        </div>
      {:else}
        <div class="preview-section preview-unavailable" data-testid="preview-unavailable">
          <span class="preview-label">Preview</span>
          <span class="preview-notice">Preview not available for this file type</span>
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
  .icon-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .upload-section { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-6); background: var(--bg-surface); border: 2px dashed var(--border-subtle); border-radius: var(--radius-md); }
  .file-input { width: 100%; }
  .file-input:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .upload-hint { font-size: var(--text-sm); color: var(--text-secondary); }
  .loading-display { display: flex; align-items: center; justify-content: center; gap: var(--space-3); padding: var(--space-4); color: var(--text-secondary); }
  .loading-spinner { width: 16px; height: 16px; border: 2px solid var(--border-subtle); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .error-display { padding: var(--space-3); background: var(--error-soft); color: var(--error-text); border-radius: var(--radius-md); }
  .result-section { display: flex; flex-direction: column; gap: var(--space-4); }
  .file-info { display: flex; flex-wrap: wrap; gap: var(--space-4); padding: var(--space-3); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .info-item { display: flex; gap: var(--space-2); }
  .info-label { font-size: var(--text-sm); color: var(--text-tertiary); }
  .info-value { font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-primary); }
  .dataurl-output { background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden; }
  .output-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3); background: var(--bg-elevated); border-bottom: 1px solid var(--border-subtle); font-size: var(--text-xs); font-weight: var(--font-semibold); text-transform: uppercase; letter-spacing: var(--tracking-wide); color: var(--text-tertiary); }
  .dataurl-text { width: 100%; min-height: 100px; padding: var(--space-3); border: none; background: var(--bg-surface); color: var(--text-primary); font-family: var(--font-mono); font-size: var(--text-sm); resize: none; }
  .dataurl-text:focus { outline: none; }
  .truncation-notice { padding: var(--space-2) var(--space-3); background: var(--bg-elevated); border-top: 1px solid var(--border-subtle); font-size: var(--text-xs); color: var(--text-tertiary); text-align: center; }
  .preview-section { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-4); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .preview-section.preview-unavailable { align-items: center; }
  .preview-label { font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-tertiary); }
  .preview-notice { font-size: var(--text-sm); color: var(--text-tertiary); font-style: italic; }
  .preview-image { max-width: 100%; max-height: 300px; border-radius: var(--radius); }
</style>
