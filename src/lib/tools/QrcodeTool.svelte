<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount, onDestroy } from 'svelte'

  let qrText = 'https://devutils.tools'
  let qrSize = 200
  let qrCanvas
  let error = ''
  let timeout = null
  let saveTimeout = null
  let canvasReady = false

  function loadState() {
    try {
      const savedText = localStorage.getItem('devutils-qr-text')
      const savedSize = localStorage.getItem('devutils-qr-size')
      if (savedText) qrText = savedText
      if (savedSize) qrSize = parseInt(savedSize)
    } catch (e) {
      // Fallback to defaults if localStorage fails
      qrText = 'https://devutils.tools'
      qrSize = 200
    }
  }

  function saveState() {
    try {
      if (saveTimeout) clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        try {
          localStorage.setItem('devutils-qr-text', qrText)
          localStorage.setItem('devutils-qr-size', qrSize.toString())
        } catch (e) {
          // Silent fail on localStorage error
        }
      }, 500)
    } catch (e) {
      // Silent fail
    }
  }

  onMount(() => {
    loadState()
    // Wait for canvas binding before generating
    setTimeout(() => {
      if (qrCanvas) {
        canvasReady = true
        generateQR()
      }
    }, 0)
  })

  onDestroy(() => {
    if (timeout) clearTimeout(timeout)
    if (saveTimeout) clearTimeout(saveTimeout)
  })

  // QR Code Mode indicators
  const MODE_NUMERIC = 1
  const MODE_ALPHANUMERIC = 2
  const MODE_BYTE = 4

  // Error correction levels - blocks: [total blocks, data blocks per group, ecc blocks per group]
  const EC_LEVELS = {
    L: { value: 0, blocks: [7, 1, 0], capacity: [19, 34, 55, 80, 108, 136] },
    M: { value: 1, blocks: [10, 1, 0], capacity: [16, 28, 44, 64, 86, 108] },
    Q: { value: 2, blocks: [13, 1, 0], capacity: [13, 22, 34, 48, 62, 76] },
    H: { value: 3, blocks: [17, 1, 0], capacity: [9, 16, 26, 36, 46, 60] }
  }

  // Version capacities for error correction level M (data codewords)
  // Version 1-6: [data codewords]
  const VERSION_CAPACITY_M = [16, 28, 44, 64, 86, 108, 124, 154, 182, 216, 240, 278, 318, 358, 400, 438, 504, 532, 588, 650, 700, 732, 788, 860, 914, 1000, 1062, 1128, 1193, 1267, 1377, 1458, 1548, 1628, 1722, 1809, 1911, 1989, 2099, 2213, 2331]

  // Total data bits per version (for padding calculation)
  const VERSION_TOTAL_BITS = [
    152, 272, 440, 640, 864, 1088, 1248, 1552, 1856, 2192,
    2496, 2800, 3112, 3568, 4000, 4288, 4928, 5312, 5728, 6256,
    6736, 7216, 7744, 8352, 8832, 9600, 10208, 10816, 11408, 12128,
    13056, 13808, 14560, 15424, 16288, 17136, 18048, 18960, 19904, 20928,
    21952
  ]

  // Galois field log/antilog tables for Reed-Solomon
  const GF_LOG = new Array(256)
  const GF_EXP = new Array(512)

  function initGF() {
    let x = 1
    for (let i = 0; i < 255; i++) {
      GF_EXP[i] = x
      GF_LOG[x] = i
      x <<= 1
      if (x & 0x100) x ^= 0x11d
    }
    for (let i = 255; i < 512; i++) {
      GF_EXP[i] = GF_EXP[i - 255]
    }
  }
  initGF()

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0
    return GF_EXP[GF_LOG[a] + GF_LOG[b]]
  }

  function gfPow(a, n) {
    if (n === 0) return 1
    if (a === 0) return 0
    return GF_EXP[(GF_LOG[a] * n) % 255]
  }

  // Generator polynomial for Reed-Solomon
  function generatorPoly(degree) {
    let g = [1]
    for (let i = 0; i < degree; i++) {
      const newG = new Array(g.length + 1).fill(0)
      for (let j = 0; j < g.length; j++) {
        newG[j] ^= g[j]
        newG[j + 1] ^= gfMul(g[j], GF_EXP[i])
      }
      g = newG
    }
    return g
  }

  // Reed-Solomon error correction
  function reedSolomon(data, ecCodewords) {
    const g = generatorPoly(ecCodewords)
    const remainder = new Array(ecCodewords).fill(0)

    for (let i = 0; i < data.length; i++) {
      const factor = data[i] ^ remainder[0]
      remainder.shift()
      remainder.push(0)

      for (let j = 0; j < ecCodewords; j++) {
        remainder[j] ^= gfMul(g[j + 1] || 0, factor)
      }
    }

    return remainder
  }

  // Get mode for text
  function getMode(text) {
    if (!text) return MODE_BYTE
    if (/^[0-9]*$/.test(text)) return MODE_NUMERIC
    if (/^[0-9A-Z $%*+\-./:]*$/.test(text)) return MODE_ALPHANUMERIC
    return MODE_BYTE
  }

  // Character count bits
  function getCharCountBits(version, mode) {
    if (mode === MODE_NUMERIC) {
      return version < 10 ? 10 : 12
    } else if (mode === MODE_ALPHANUMERIC) {
      return version < 10 ? 9 : 11
    } else {
      return version < 10 ? 8 : 16
    }
  }

  // Mode indicator bits
  function getModeIndicator(mode) {
    if (mode === MODE_NUMERIC) return [0, 0, 0, 1]
    if (mode === MODE_ALPHANUMERIC) return [0, 0, 1, 0]
    return [0, 1, 0, 0]
  }

  // Convert text to data bits
  function textToBits(text, mode) {
    const bits = []

    if (mode === MODE_NUMERIC) {
      for (let i = 0; i < text.length; i += 3) {
        const chunk = text.substring(i, i + 3)
        const num = parseInt(chunk, 10)
        const bitLen = chunk.length === 3 ? 10 : chunk.length === 2 ? 7 : 4
        for (let j = bitLen - 1; j >= 0; j--) {
          bits.push((num >> j) & 1)
        }
      }
    } else if (mode === MODE_ALPHANUMERIC) {
      const charMap = {}
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'
      for (let i = 0; i < chars.length; i++) {
        charMap[chars[i]] = i
      }

      for (let i = 0; i < text.length; i += 2) {
        if (i + 1 < text.length) {
          const num = charMap[text[i]] * 45 + charMap[text[i + 1]]
          for (let j = 10; j >= 0; j--) {
            bits.push((num >> j) & 1)
          }
        } else {
          const num = charMap[text[i]]
          for (let j = 5; j >= 0; j--) {
            bits.push((num >> j) & 1)
          }
        }
      }
    } else {
      for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i)
        for (let j = 7; j >= 0; j--) {
          bits.push((char >> j) & 1)
        }
      }
    }

    return bits
  }

  // Calculate QR version needed
  function getVersion(text, mode, ecLevel) {
    if (!text) return 1

    const bitsNeeded = 4 + getCharCountBits(1, mode) + textToBits(text, mode).length + 4

    for (let v = 1; v <= 40; v++) {
      const totalBits = VERSION_TOTAL_BITS[v - 1] || VERSION_TOTAL_BITS[VERSION_TOTAL_BITS.length - 1]
      if (bitsNeeded <= totalBits) {
        return v
      }
    }

    // Text exceeds maximum capacity
    return -1
  }

  // Convert bits to bytes
  function bitsToBytes(bits) {
    const bytes = []
    for (let i = 0; i < bits.length; i += 8) {
      let byte = 0
      for (let j = 0; j < 8 && i + j < bits.length; j++) {
        byte = (byte << 1) | bits[i + j]
      }
      bytes.push(byte)
    }
    return bytes
  }

  // Convert bytes to bits
  function bytesToBits(bytes) {
    const bits = []
    for (const byte of bytes) {
      for (let j = 7; j >= 0; j--) {
        bits.push((byte >> j) & 1)
      }
    }
    return bits
  }

  // Generate QR code data with ECC
  function generateQRData(text, version, mode, ecLevel = 'M') {
    const dataBits = []

    // Mode indicator
    dataBits.push(...getModeIndicator(mode))

    // Character count
    const countBits = getCharCountBits(version, mode)
    for (let i = countBits - 1; i >= 0; i--) {
      dataBits.push((text.length >> i) & 1)
    }

    // Data
    dataBits.push(...textToBits(text, mode))

    // Terminator (up to 4 zero bits)
    const totalBits = VERSION_TOTAL_BITS[version - 1] || VERSION_TOTAL_BITS[VERSION_TOTAL_BITS.length - 1]
    const terminatorLen = Math.min(4, totalBits - dataBits.length)
    for (let i = 0; i < terminatorLen; i++) {
      dataBits.push(0)
    }

    // Pad to byte boundary
    while (dataBits.length % 8 !== 0) {
      dataBits.push(0)
    }

    // Pad bytes (alternating 11101100 and 00010001)
    const padBytes = [0b11101100, 0b00010001]
    let padIndex = 0
    while (dataBits.length < totalBits) {
      const byte = padBytes[padIndex % 2]
      for (let j = 7; j >= 0; j--) {
        dataBits.push((byte >> j) & 1)
      }
      padIndex++
    }

    // Truncate to totalBits
    const finalDataBits = dataBits.slice(0, totalBits)

    // Convert to bytes and compute ECC
    const dataBytes = bitsToBytes(finalDataBits)

    // Get capacity for this version with EC level M
    const dataCodewords = VERSION_CAPACITY_M[version - 1] || VERSION_CAPACITY_M[VERSION_CAPACITY_M.length - 1]
    const totalCodewords = Math.floor(totalBits / 8)
    const ecCodewords = totalCodewords - dataCodewords

    // Split data into blocks and compute ECC for each
    const dataBlocks = dataBytes.slice(0, dataCodewords)
    const eccBytes = reedSolomon(dataBlocks, ecCodewords)

    // Combine data and ECC
    const allBytes = [...dataBlocks, ...eccBytes]

    return bytesToBits(allBytes)
  }

  // Get QR code matrix size
  function getMatrixSize(version) {
    return 17 + version * 4
  }

  // Position pattern
  const POSITION_PATTERN = [
    [1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1]
  ]

  // Timing pattern
  function drawTimingPattern(matrix, size) {
    for (let i = 8; i < size - 8; i++) {
      matrix[6][i] = i % 2 === 0 ? 1 : 0
      matrix[i][6] = i % 2 === 0 ? 1 : 0
    }
  }

  // Finder patterns
  function drawFinderPatterns(matrix, size) {
    // Top-left
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        matrix[y][x] = POSITION_PATTERN[y][x]
      }
    }

    // Top-right
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        matrix[y][size - 7 + x] = POSITION_PATTERN[y][x]
      }
    }

    // Bottom-left
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        matrix[size - 7 + y][x] = POSITION_PATTERN[y][x]
      }
    }

    // Separator (white border around finder patterns)
    for (let i = 0; i < 8; i++) {
      matrix[7][i] = 0
      matrix[i][7] = 0
      matrix[7][size - 8 + i] = 0
      matrix[i][size - 8] = 0
      matrix[size - 8][i] = 0
      matrix[size - 8 + i][7] = 0
    }
  }

  // Dark module (always at position (4*version+9, 8))
  function drawDarkModule(matrix, version) {
    const pos = 4 * version + 9
    if (pos < matrix.length) {
      matrix[pos][8] = 1
    }
  }

  // Check if position is reserved (finder patterns, timing patterns, etc.)
  function isReserved(size, row, col, version) {
    // Finder patterns with separators
    if (row < 9 && col < 9) return true // Top-left
    if (row < 9 && col >= size - 8) return true // Top-right
    if (row >= size - 8 && col < 9) return true // Bottom-left

    // Timing patterns
    if (row === 6 || col === 6) return true

    // Dark module
    const darkPos = 4 * version + 9
    if (row === darkPos && col === 8) return true

    // Format info areas (around finder patterns)
    if (row === 8 && col < 9) return true
    if (row < 9 && col === 8) return true
    if (row === 8 && col >= size - 8) return true
    if (row >= size - 8 && col === 8) return true

    return false
  }

  // Place data bits with proper zigzag pattern
  function placeData(matrix, size, data, version) {
    let bitIndex = 0
    let direction = -1 // Start going upward

    // Start from bottom-right, move in 2-column chunks
    for (let col = size - 1; col > 0; col -= 2) {
      // Skip timing column
      if (col === 6) col--

      // Process two columns at a time
      for (let rowPass = 0; rowPass < size; rowPass++) {
        const row = direction === -1 ? size - 1 - rowPass : rowPass

        // Process current row in both columns
        for (let c = 0; c < 2; c++) {
          const colOffset = col - c

          // Skip if reserved
          if (!isReserved(size, row, colOffset, version)) {
            if (bitIndex < data.length) {
              matrix[row][colOffset] = data[bitIndex]
              bitIndex++
            }
          }
        }
      }

      // Alternate direction
      direction = -direction
    }
  }

  // Apply mask pattern (mask 0: (row + col) % 2 === 0)
  function applyMask(matrix, size) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (matrix[y][x] !== null && matrix[y][x] !== undefined && (y + x) % 2 === 0) {
          matrix[y][x] ^= 1
        }
      }
    }
  }

  // Format info lookup table for mask 0
  const FORMAT_INFO_TABLE = {
    0: 0x77c4, // L
    1: 0x5412, // M
    2: 0x5e7c, // Q
    3: 0x5b4f  // H
  }

  // Draw format info around finder patterns
  function drawFormatInfo(matrix, size, ecLevel, maskPattern) {
    const formatInfo = FORMAT_INFO_TABLE[ecLevel] || FORMAT_INFO_TABLE[1]

    // Top-left format info (split around finder pattern)
    // Top-left: positions (8, 0) to (8, 5) and (8, 7) to (8, 8)
    // Also (0, 8) to (5, 8) and (7, 8)

    // Horizontal top-left (row 8)
    for (let i = 0; i < 6; i++) {
      matrix[8][i] = (formatInfo >> i) & 1
    }
    matrix[8][7] = (formatInfo >> 6) & 1
    matrix[8][8] = (formatInfo >> 7) & 1

    // Vertical top-left (col 8)
    for (let i = 0; i < 6; i++) {
      matrix[i][8] = (formatInfo >> i) & 1
    }
    matrix[7][8] = (formatInfo >> 6) & 1

    // Top-right format info (row 8, col size-8 to size-1)
    for (let i = 0; i < 8; i++) {
      matrix[8][size - 1 - i] = (formatInfo >> i) & 1
    }

    // Bottom-left format info (col 8, row size-8 to size-1)
    for (let i = 0; i < 8; i++) {
      matrix[size - 1 - i][8] = (formatInfo >> i) & 1
    }
  }

  function generateQR() {
    if (!qrText) {
      error = 'Please enter text'
      return
    }

    if (!qrCanvas) {
      error = 'Canvas not available'
      return
    }

    try {
      const mode = getMode(qrText)
      const version = getVersion(qrText, mode, 'M')

      if (version === -1) {
        error = 'Text too long for QR code'
        return
      }

      const size = getMatrixSize(version)

      // Create matrix
      const matrix = Array(size).fill(null).map(() => Array(size).fill(null))

      // Draw patterns
      drawFinderPatterns(matrix, size)
      drawTimingPattern(matrix, size)
      drawDarkModule(matrix, version)

      // Generate and place data
      const data = generateQRData(qrText, version, mode, 'M')
      placeData(matrix, size, data, version)
      applyMask(matrix, size)
      drawFormatInfo(matrix, size, 1, 0) // EC level M, mask 0

      // Draw on canvas
      const ctx = qrCanvas.getContext('2d')
      if (!ctx) {
        error = 'Could not get canvas context'
        return
      }

      qrCanvas.width = qrSize
      qrCanvas.height = qrSize

      // Clear canvas (white background)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, qrSize, qrSize)

      // Draw QR code
      const cellSize = qrSize / size
      ctx.fillStyle = '#000000'

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (matrix[y][x] === 1) {
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
          }
        }
      }

      error = ''
    } catch (e) {
      error = 'Error generating QR code: ' + (e.message || 'Unknown error')
    }
  }

  function debouncedGenerate() {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      generateQR()
      saveState()
    }, 300)
  }

  function downloadPNG() {
    if (!qrCanvas) {
      error = 'No QR code to download'
      return
    }

    // Verify canvas has content
    try {
      const ctx = qrCanvas.getContext('2d')
      if (!ctx) {
        error = 'Could not get canvas context'
        return
      }

      const imageData = ctx.getImageData(0, 0, qrCanvas.width, qrCanvas.height)
      const hasContent = imageData.data.some((pixel, index) => {
        // Check alpha channel or if pixel is not white
        return index % 4 === 3 ? pixel > 0 : pixel < 255
      })

      if (!hasContent) {
        error = 'No QR code content to download'
        return
      }

      const link = document.createElement('a')
      link.download = 'qrcode.png'
      link.href = qrCanvas.toDataURL('image/png')
      link.click()
      error = ''
    } catch (e) {
      error = 'Failed to download QR code'
    }
  }

  function clear() {
    qrText = ''
    try {
      localStorage.removeItem('devutils-qr-text')
      localStorage.removeItem('devutils-qr-size')
    } catch (e) {
      // Silent fail
    }
    // Clear canvas and generate error
    if (qrCanvas) {
      const ctx = qrCanvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, qrSize, qrSize)
      }
    }
    // Trigger error display
    error = 'Please enter text'
  }

  function setExample(url) {
    qrText = url
    debouncedGenerate()
  }
</script>

<div class="tool">
  <div class="tool-header">
    <div class="tool-meta">
      <h1 class="tool-name">QR Code Generator</h1>
      <p class="tool-desc">Generate QR codes from text or URLs</p>
    </div>
    <div class="tool-actions">
      <button class="icon-btn" on:click={clear} title="Clear">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  </div>

  {#if error}
    <div class="error-display" role="alert">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span>{error}</span>
    </div>
  {/if}

  <div class="qr-input-section">
    <div class="input-group">
      <label for="qr-text-input">Text or URL</label>
      <input id="qr-text-input" type="text" bind:value={qrText} on:input={debouncedGenerate} placeholder="Enter text or URL..." />
    </div>
    <div class="input-group size-group">
      <label for="qr-size-slider">Size: {qrSize}px</label>
      <input id="qr-size-slider" type="range" bind:value={qrSize} min="100" max="500" step="50" on:input={debouncedGenerate} />
    </div>
  </div>

  <div class="qr-preview">
    <canvas bind:this={qrCanvas} width={qrSize} height={qrSize} aria-label="Generated QR code"></canvas>
    {#if qrText}
      <button class="download-btn" on:click={downloadPNG}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Download PNG
      </button>
    {/if}
  </div>

  <div class="examples-section">
    <h3>Quick Examples</h3>
    <div class="examples">
      <button class="example-btn" on:click={() => setExample('https://github.com')}>GitHub</button>
      <button class="example-btn" on:click={() => setExample('https://google.com')}>Google</button>
      <button class="example-btn" on:click={() => setExample('mailto:hello@example.com')}>Email</button>
      <button class="example-btn" on:click={() => setExample('tel:+1234567890')}>Phone</button>
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
  .icon-btn:focus { outline: 2px solid var(--accent); outline-offset: 2px; }
  .error-display { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4); background: var(--error-soft); color: var(--error-text); border-radius: var(--radius-md); }
  .qr-input-section { display: flex; flex-direction: column; gap: var(--space-4); padding: var(--space-4); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .input-group { display: flex; flex-direction: column; gap: var(--space-2); }
  .input-group label { font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-secondary); }
  .input-group input[type="text"] { padding: var(--space-3); border: 1px solid var(--border-default); border-radius: var(--radius); background: var(--bg-base); color: var(--text-primary); font-size: var(--text-base); outline: none; }
  .input-group input[type="text"]:focus { border-color: var(--accent); box-shadow: var(--glow-focus); }
  .size-group input[type="range"] { width: 100%; }
  .qr-preview { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); padding: var(--space-6); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .qr-preview canvas { background: white; border-radius: var(--radius); box-shadow: var(--shadow-sm); }
  .download-btn { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); font-size: var(--text-sm); font-weight: var(--font-medium); color: white; background: var(--accent); border: none; border-radius: var(--radius); cursor: pointer; transition: all var(--transition-fast); }
  .download-btn:hover { background: var(--accent-hover); }
  .download-btn:focus { outline: 2px solid var(--accent); outline-offset: 2px; }
  .examples-section h3 { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--text-tertiary); margin-bottom: var(--space-3); text-transform: uppercase; letter-spacing: var(--tracking-wide); }
  .examples { display: flex; flex-wrap: wrap; gap: var(--space-2); }
  .example-btn { padding: var(--space-2) var(--space-3); font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-secondary); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius); cursor: pointer; transition: all var(--transition-fast); }
  .example-btn:hover { background: var(--accent-soft); color: var(--accent); border-color: var(--accent-dim); }
  .example-btn:focus { outline: 2px solid var(--accent); outline-offset: 2px; }
</style>
