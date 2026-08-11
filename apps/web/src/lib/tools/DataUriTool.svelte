<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import ToolHeader from '$lib/ui/ToolHeader.svelte'
  import FactStrip from '$lib/ui/FactStrip.svelte'
  import ToolShell from '$lib/ui/ToolShell.svelte'
  import Panel from '$lib/ui/Panel.svelte'
  import Button from '$lib/ui/Button.svelte'
  import { onMount, onDestroy } from 'svelte'
  import { inferMimeType } from 'tols-cli/core/datauri'

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  const MAX_FILE_SIZE_MB = 10
  const DATA_URL_TRUNCATE_LIMIT = 200
  const STORAGE_KEY = 'devutils:data-uri:result'
  // Keep the persisted result small enough to fit typical storage quotas
  const MAX_PERSIST_LENGTH = 2 * 1024 * 1024
  const FILE_SIZE_UNITS = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  let dataUrl = ''
  let mimeType = ''
  let fileSize = ''
  let error = ''
  let isLoading = false
  /** @type {HTMLInputElement | undefined} */
  let fileInput
  let fileName = ''
  /** @type {FileReader | null} */
  let currentReader = null
  let truncatedDataUrl = ''

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed.dataUrl === 'string') {
        dataUrl = parsed.dataUrl
        truncatedDataUrl = typeof parsed.truncatedDataUrl === 'string'
          ? parsed.truncatedDataUrl
          : getTruncatedDataUrl(dataUrl)
        mimeType = typeof parsed.mimeType === 'string' ? parsed.mimeType : ''
        fileSize = typeof parsed.fileSize === 'string' ? parsed.fileSize : ''
        fileName = typeof parsed.fileName === 'string' ? parsed.fileName : ''
      }
    } catch (/** @type {any} */ e) {
      console.warn('Failed to load saved data URI:', e)
    }
  }

  function saveState() {
    try {
      if (dataUrl.length > MAX_PERSIST_LENGTH) {
        localStorage.removeItem(STORAGE_KEY)
        return
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        dataUrl, truncatedDataUrl, mimeType, fileSize, fileName
      }))
    } catch (/** @type {any} */ e) {
      // Quota exceeded: the result stays in memory for this visit
      console.warn('Failed to save data URI:', e)
    }
  }

  onMount(() => {
    loadState()
  })

  /**
   * @param {Event & { currentTarget: HTMLInputElement }} event
   */
  function handleFileSelect(event) {
    const file = event.currentTarget.files?.[0]
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
      const result = e.target?.result
      if (typeof result !== 'string') return
      dataUrl = result
      truncatedDataUrl = getTruncatedDataUrl(dataUrl)
      mimeType = file.type || inferMimeType(file.name)
      fileSize = formatFileSize(file.size)
      isLoading = false
      currentReader = null
      saveState()
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

  /**
   * @param {number} bytes
   */
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    const unitIndex = Math.min(i, FILE_SIZE_UNITS.length - 1)
    return parseFloat((bytes / Math.pow(k, unitIndex)).toFixed(2)) + ' ' + FILE_SIZE_UNITS[unitIndex]
  }

  /**
   * @param {string} url
   */
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
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (/** @type {any} */ e) {
      console.warn('Failed to clear saved data URI:', e)
    }
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
  <ToolHeader toolId="data-uri" />

  <ToolShell
    toolId="data-uri"
    action="enc"
    output={dataUrl}
  >
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
        <FactStrip
          facts={[
            ...(fileName ? [{ label: 'Name', value: fileName, testid: 'filename-display' }] : []),
            { label: 'Type', value: mimeType, testid: 'mime-type' },
            { label: 'Size', value: fileSize }
          ]}
        />

        <Panel label="Data URI">
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
        </Panel>

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

    <svelte:fragment slot="rail">
      <Button on:click={clear} title="Clear" data-testid="clear-button" aria-label="Clear">clear</Button>
    </svelte:fragment>

    <svelte:fragment slot="rail-end">
      {#if dataUrl}<CopyButton text={dataUrl} />{/if}
    </svelte:fragment>
  </ToolShell>
</div>

<style>
  .tool { display: flex; flex-direction: column; gap: 0; width: 100%; }
  .upload-section { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-6); background: var(--bg-surface); border: 2px dashed var(--border-subtle); border-radius: var(--radius-md); }
  .file-input { width: 100%; }
  .file-input:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .upload-hint { font-size: var(--text-sm); color: var(--text-secondary); }
  .loading-display { display: flex; align-items: center; justify-content: center; gap: var(--space-3); padding: var(--space-4); color: var(--text-secondary); }
  .loading-spinner { width: 16px; height: 16px; border: 2px solid var(--border-subtle); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .error-display { padding: var(--space-3); background: var(--error-soft); color: var(--error-text); border-radius: var(--radius-md); }
  .result-section { display: flex; flex-direction: column; gap: var(--space-4); }
  .dataurl-text { width: 100%; min-height: 100px; padding: var(--space-3); border: none; background: transparent; color: var(--text-primary); font-family: var(--font-mono); font-size: var(--text-sm); resize: none; }
  .dataurl-text:focus { outline: none; }
  .truncation-notice { padding: var(--space-2) var(--space-3); background: var(--bg-elevated); border-top: 1px solid var(--border-subtle); font-size: var(--text-xs); color: var(--text-tertiary); text-align: center; }
  .preview-section { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-4); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .preview-section.preview-unavailable { align-items: center; }
  .preview-label { font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-tertiary); }
  .preview-notice { font-size: var(--text-sm); color: var(--text-tertiary); font-style: italic; }
  .preview-image { max-width: 100%; max-height: 300px; border-radius: var(--radius); }
</style>
