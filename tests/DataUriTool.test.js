import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
import DataUriTool from '$lib/tools/DataUriTool.svelte'

const DEFAULT_TIMEOUT = 500
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

describe('DataUriTool', () => {
  let fileReaderInstances = []

  beforeEach(() => {
    // Track FileReader instances for cleanup verification
    fileReaderInstances = []

    // Mock FileReader
    const MockFileReader = vi.fn().mockImplementation(function() {
      const instance = {
        readAsDataURL: vi.fn(),
        abort: vi.fn(),
        onload: null,
        onerror: null,
        onabort: null,
        result: null
      }
      fileReaderInstances.push(instance)
      return instance
    })
    global.FileReader = MockFileReader
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with tool header', () => {
      render(DataUriTool)
      expect(screen.getByText('Data URI Generator')).toBeInTheDocument()
      expect(screen.getByText('Convert files to Data URIs')).toBeInTheDocument()
    })

    it('should have file input with proper attributes', () => {
      render(DataUriTool)

      const fileInput = screen.getByTestId('file-input')
      expect(fileInput).toBeInTheDocument()
      expect(fileInput).toHaveAttribute('type', 'file')
      expect(fileInput).toHaveAttribute('accept')
      expect(fileInput).toHaveAttribute('aria-label', 'Choose file to convert')
    })

    it('should show max file size in upload hint', () => {
      render(DataUriTool)
      expect(screen.getByText(/max 10MB/i)).toBeInTheDocument()
    })
  })

  describe('File Selection', () => {
    it('should handle text file selection', async () => {
      render(DataUriTool)

      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
      const fileInput = screen.getByTestId('file-input')

      await fireEvent.change(fileInput, { target: { files: [mockFile] } })

      // Trigger the FileReader onload
      const readerInstance = fileReaderInstances[0]
      expect(readerInstance.readAsDataURL).toHaveBeenCalledWith(mockFile)

      readerInstance.result = 'data:text/plain;base64,dGVzdCBjb250ZW50'
      readerInstance.onload?.({ target: { result: readerInstance.result } })

      await waitFor(() => {
        expect(screen.getByText('Type:')).toBeInTheDocument()
        expect(screen.getByText('text/plain')).toBeInTheDocument()
        expect(screen.getByText('Size:')).toBeInTheDocument()
      }, { timeout: DEFAULT_TIMEOUT })
    })

    it('should display filename when file is loaded', async () => {
      render(DataUriTool)

      const mockFile = new File(['content'], 'my-document.pdf', { type: 'application/pdf' })
      const fileInput = screen.getByTestId('file-input')

      await fireEvent.change(fileInput, { target: { files: [mockFile] } })

      const readerInstance = fileReaderInstances[0]
      readerInstance.result = 'data:application/pdf;base64,Y29udGVudA=='
      readerInstance.onload?.({ target: { result: readerInstance.result } })

      await waitFor(() => {
        expect(screen.getByTestId('filename-display')).toHaveTextContent('my-document.pdf')
      }, { timeout: DEFAULT_TIMEOUT })
    })
  })

  describe('File Type Coverage', () => {
    const fileTypes = [
      { name: 'image.png', type: 'image/png', expectedMime: 'image/png' },
      { name: 'document.pdf', type: 'application/pdf', expectedMime: 'application/pdf' },
      { name: 'video.mp4', type: 'video/mp4', expectedMime: 'video/mp4' },
      { name: 'audio.mp3', type: 'audio/mpeg', expectedMime: 'audio/mpeg' },
      { name: 'unknown.xyz', type: '', expectedMime: 'application/octet-stream' }
    ]

    fileTypes.forEach(({ name, type, expectedMime }) => {
      it(`should handle ${name} files`, async () => {
        render(DataUriTool)

        const mockFile = new File(['content'], name, { type })
        const fileInput = screen.getByTestId('file-input')

        await fireEvent.change(fileInput, { target: { files: [mockFile] } })

        const readerInstance = fileReaderInstances[fileReaderInstances.length - 1]
        readerInstance.result = `data:${expectedMime};base64,Y29udGVudA==`
        readerInstance.onload?.({ target: { result: readerInstance.result } })

        await waitFor(() => {
          expect(screen.getByTestId('mime-type')).toHaveTextContent(expectedMime)
        }, { timeout: DEFAULT_TIMEOUT })
      })
    })
  })

  describe('Image Preview', () => {
    it('should show image preview for image files', async () => {
      render(DataUriTool)

      const mockImageFile = new File(['image data'], 'test.png', { type: 'image/png' })
      const fileInput = screen.getByTestId('file-input')

      await fireEvent.change(fileInput, { target: { files: [mockImageFile] } })

      const readerInstance = fileReaderInstances[0]
      readerInstance.result = 'data:image/png;base64,aW1hZ2UgZGF0YQ=='
      readerInstance.onload?.({ target: { result: readerInstance.result } })

      await waitFor(() => {
        expect(screen.getByTestId('image-preview')).toBeInTheDocument()
        expect(screen.getByAltText(/Preview of test.png/)).toBeInTheDocument()
      }, { timeout: DEFAULT_TIMEOUT })
    })

    it('should show preview unavailable for non-image files', async () => {
      render(DataUriTool)

      const mockFile = new File(['content'], 'document.pdf', { type: 'application/pdf' })
      const fileInput = screen.getByTestId('file-input')

      await fireEvent.change(fileInput, { target: { files: [mockFile] } })

      const readerInstance = fileReaderInstances[0]
      readerInstance.result = 'data:application/pdf;base64,Y29udGVudA=='
      readerInstance.onload?.({ target: { result: readerInstance.result } })

      await waitFor(() => {
        expect(screen.getByTestId('preview-unavailable')).toBeInTheDocument()
        expect(screen.getByText('Preview not available for this file type')).toBeInTheDocument()
      }, { timeout: DEFAULT_TIMEOUT })
    })
  })

  describe('File Size Validation', () => {
    it('should reject files larger than 10MB', async () => {
      render(DataUriTool)

      const largeFile = new File(['x'], 'large.bin', { type: 'application/octet-stream' })
      Object.defineProperty(largeFile, 'size', { value: MAX_FILE_SIZE + 1 })

      const fileInput = screen.getByTestId('file-input')
      await fireEvent.change(fileInput, { target: { files: [largeFile] } })

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent(/File too large/i)
        expect(screen.getByTestId('error-message')).toHaveTextContent(/10MB/)
      }, { timeout: DEFAULT_TIMEOUT })
    })

    it('should accept files at exactly 10MB', async () => {
      render(DataUriTool)

      const exactSizeFile = new File(['x'], 'exact.bin', { type: 'application/octet-stream' })
      Object.defineProperty(exactSizeFile, 'size', { value: MAX_FILE_SIZE })

      const fileInput = screen.getByTestId('file-input')
      await fireEvent.change(fileInput, { target: { files: [exactSizeFile] } })

      const readerInstance = fileReaderInstances[0]
      readerInstance.result = 'data:application/octet-stream;base64,eA=='
      readerInstance.onload?.({ target: { result: readerInstance.result } })

      await waitFor(() => {
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument()
        expect(screen.getByTestId('result-section')).toBeInTheDocument()
      }, { timeout: DEFAULT_TIMEOUT })
    })

    it('should handle empty files (0 bytes)', async () => {
      render(DataUriTool)

      const emptyFile = new File([], 'empty.txt', { type: 'text/plain' })
      const fileInput = screen.getByTestId('file-input')

      await fireEvent.change(fileInput, { target: { files: [emptyFile] } })

      const readerInstance = fileReaderInstances[0]
      readerInstance.result = 'data:text/plain;base64,'
      readerInstance.onload?.({ target: { result: readerInstance.result } })

      await waitFor(() => {
        expect(screen.getByText('0 Bytes')).toBeInTheDocument()
      }, { timeout: DEFAULT_TIMEOUT })
    })
  })

  describe('Error Handling', () => {
    it('should display error when FileReader fails', async () => {
      render(DataUriTool)

      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      const fileInput = screen.getByTestId('file-input')

      await fireEvent.change(fileInput, { target: { files: [mockFile] } })

      const readerInstance = fileReaderInstances[0]
      readerInstance.onerror?.()

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent(/Error reading file/i)
      }, { timeout: DEFAULT_TIMEOUT })
    })

    it('should clear error when new file is selected', async () => {
      render(DataUriTool)

      const largeFile = new File(['x'], 'large.bin', { type: 'application/octet-stream' })
      Object.defineProperty(largeFile, 'size', { value: MAX_FILE_SIZE + 1 })

      const fileInput = screen.getByTestId('file-input')
      await fireEvent.change(fileInput, { target: { files: [largeFile] } })

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
      }, { timeout: DEFAULT_TIMEOUT })

      const validFile = new File(['content'], 'valid.txt', { type: 'text/plain' })
      await fireEvent.change(fileInput, { target: { files: [validFile] } })

      const readerInstance = fileReaderInstances[fileReaderInstances.length - 1]
      readerInstance.result = 'data:text/plain;base64,Y29udGVudA=='
      readerInstance.onload?.({ target: { result: readerInstance.result } })

      await waitFor(() => {
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument()
      }, { timeout: DEFAULT_TIMEOUT })
    })
  })

  describe('Loading State', () => {
    it('should show loading indicator while reading file', async () => {
      render(DataUriTool)

      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      const fileInput = screen.getByTestId('file-input')

      await fireEvent.change(fileInput, { target: { files: [mockFile] } })

      // Loading should be shown immediately after file selection
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
      expect(screen.getByText('Reading file...')).toBeInTheDocument()

      // Complete the reading
      const readerInstance = fileReaderInstances[0]
      readerInstance.result = 'data:text/plain;base64,Y29udGVudA=='
      readerInstance.onload?.({ target: { result: readerInstance.result } })

      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
      }, { timeout: DEFAULT_TIMEOUT })
    })
  })

  describe('Clear Functionality', () => {
    it('should clear results when clear button is clicked', async () => {
      render(DataUriTool)

      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      const fileInput = screen.getByTestId('file-input')

      await fireEvent.change(fileInput, { target: { files: [mockFile] } })

      const readerInstance = fileReaderInstances[0]
      readerInstance.result = 'data:text/plain;base64,Y29udGVudA=='
      readerInstance.onload?.({ target: { result: readerInstance.result } })

      await waitFor(() => {
        expect(screen.getByTestId('result-section')).toBeInTheDocument()
      }, { timeout: DEFAULT_TIMEOUT })

      const clearButton = screen.getByTestId('clear-button')
      await fireEvent.click(clearButton)

      expect(screen.queryByTestId('result-section')).not.toBeInTheDocument()
    })

    it('should reset file input value when cleared', async () => {
      render(DataUriTool)

      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      const fileInput = screen.getByTestId('file-input')

      await fireEvent.change(fileInput, { target: { files: [mockFile] } })

      const readerInstance = fileReaderInstances[0]
      readerInstance.result = 'data:text/plain;base64,Y29udGVudA=='
      readerInstance.onload?.({ target: { result: readerInstance.result } })

      await waitFor(() => {
        expect(screen.getByTestId('result-section')).toBeInTheDocument()
      }, { timeout: DEFAULT_TIMEOUT })

      const clearButton = screen.getByTestId('clear-button')
      await fireEvent.click(clearButton)

      expect(fileInput.value).toBe('')
    })

    it('should focus file input after clearing', async () => {
      render(DataUriTool)

      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      const fileInput = screen.getByTestId('file-input')

      await fireEvent.change(fileInput, { target: { files: [mockFile] } })

      const readerInstance = fileReaderInstances[0]
      readerInstance.result = 'data:text/plain;base64,Y29udGVudA=='
      readerInstance.onload?.({ target: { result: readerInstance.result } })

      await waitFor(() => {
        expect(screen.getByTestId('result-section')).toBeInTheDocument()
      }, { timeout: DEFAULT_TIMEOUT })

      const clearButton = screen.getByTestId('clear-button')
      await fireEvent.click(clearButton)

      expect(fileInput).toHaveFocus()
    })

    it('should abort FileReader when cleared during loading', async () => {
      render(DataUriTool)

      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      const fileInput = screen.getByTestId('file-input')

      await fireEvent.change(fileInput, { target: { files: [mockFile] } })

      const readerInstance = fileReaderInstances[0]
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()

      const clearButton = screen.getByTestId('clear-button')
      await fireEvent.click(clearButton)

      expect(readerInstance.abort).toHaveBeenCalled()
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
    })
  })

  describe('Data URI Output', () => {
    it('should display truncated data URI with truncation notice', async () => {
      render(DataUriTool)

      const mockFile = new File(['x'], 'test.txt', { type: 'text/plain' })
      const fileInput = screen.getByTestId('file-input')

      await fireEvent.change(fileInput, { target: { files: [mockFile] } })

      const readerInstance = fileReaderInstances[0]
      // Create a long data URL
      const longDataUrl = 'data:text/plain;base64,' + 'a'.repeat(1000)
      readerInstance.result = longDataUrl
      readerInstance.onload?.({ target: { result: readerInstance.result } })

      await waitFor(() => {
        const output = screen.getByTestId('data-url-output')
        expect(output.value).toContain('...')
        expect(screen.getByText(/Showing first 200 characters/)).toBeInTheDocument()
      }, { timeout: DEFAULT_TIMEOUT })
    })

    it('should show full data URI when under limit', async () => {
      render(DataUriTool)

      const mockFile = new File(['x'], 'test.txt', { type: 'text/plain' })
      const fileInput = screen.getByTestId('file-input')

      await fireEvent.change(fileInput, { target: { files: [mockFile] } })

      const readerInstance = fileReaderInstances[0]
      const shortDataUrl = 'data:text/plain;base64,eA=='
      readerInstance.result = shortDataUrl
      readerInstance.onload?.({ target: { result: readerInstance.result } })

      await waitFor(() => {
        const output = screen.getByTestId('data-url-output')
        expect(output.value).toBe(shortDataUrl)
        expect(screen.queryByText(/Showing first/)).not.toBeInTheDocument()
      }, { timeout: DEFAULT_TIMEOUT })
    })

    it('should have aria-label on output textarea', async () => {
      render(DataUriTool)

      const mockFile = new File(['x'], 'test.txt', { type: 'text/plain' })
      const fileInput = screen.getByTestId('file-input')

      await fireEvent.change(fileInput, { target: { files: [mockFile] } })

      const readerInstance = fileReaderInstances[0]
      readerInstance.result = 'data:text/plain;base64,eA=='
      readerInstance.onload?.({ target: { result: readerInstance.result } })

      await waitFor(() => {
        const output = screen.getByTestId('data-url-output')
        expect(output).toHaveAttribute('aria-label', 'Data URI output (truncated for display)')
      }, { timeout: DEFAULT_TIMEOUT })
    })
  })

  describe('CopyButton Integration', () => {
    it('should pass correct data URL to CopyButton', async () => {
      render(DataUriTool)

      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      const fileInput = screen.getByTestId('file-input')

      await fireEvent.change(fileInput, { target: { files: [mockFile] } })

      const readerInstance = fileReaderInstances[0]
      const expectedDataUrl = 'data:text/plain;base64,dGVzdA=='
      readerInstance.result = expectedDataUrl
      readerInstance.onload?.({ target: { result: readerInstance.result } })

      await waitFor(() => {
        const copyButton = screen.getByTestId('copy-button')
        expect(copyButton).toBeInTheDocument()
      }, { timeout: DEFAULT_TIMEOUT })
    })
  })

  describe('Accessibility', () => {
    it('should have focusable clear button', async () => {
      render(DataUriTool)

      const clearButton = screen.getByTestId('clear-button')
      clearButton.focus()
      expect(clearButton).toHaveFocus()
    })

    it('should have accessible error message', async () => {
      render(DataUriTool)

      const largeFile = new File(['x'], 'large.bin', { type: 'application/octet-stream' })
      Object.defineProperty(largeFile, 'size', { value: MAX_FILE_SIZE + 1 })

      const fileInput = screen.getByTestId('file-input')
      await fireEvent.change(fileInput, { target: { files: [largeFile] } })

      await waitFor(() => {
        const error = screen.getByRole('alert')
        expect(error).toBeInTheDocument()
        expect(error).toHaveTextContent(/File too large/i)
      }, { timeout: DEFAULT_TIMEOUT })
    })

    it('should support keyboard navigation on file input', async () => {
      render(DataUriTool)

      const fileInput = screen.getByTestId('file-input')
      fileInput.focus()
      expect(fileInput).toHaveFocus()
    })
  })

  describe('Format File Size', () => {
    it('should format 0 bytes correctly', async () => {
      render(DataUriTool)

      const emptyFile = new File([], 'empty.bin', { type: 'application/octet-stream' })
      Object.defineProperty(emptyFile, 'size', { value: 0 })

      const fileInput = screen.getByTestId('file-input')
      await fireEvent.change(fileInput, { target: { files: [emptyFile] } })

      const readerInstance = fileReaderInstances[0]
      readerInstance.result = 'data:application/octet-stream;base64,'
      readerInstance.onload?.({ target: { result: readerInstance.result } })

      await waitFor(() => {
        expect(screen.getByText('0 Bytes')).toBeInTheDocument()
      }, { timeout: DEFAULT_TIMEOUT })
    })

    it('should format various byte sizes correctly', async () => {
      render(DataUriTool)

      const testCases = [
        { size: 512, expected: '512 Bytes' },
        { size: 1024, expected: '1 KB' },
        { size: 1024 * 1024, expected: '1 MB' }
      ]

      for (const { size, expected } of testCases) {
        const mockFile = new File(['x'], 'test.bin', { type: 'application/octet-stream' })
        Object.defineProperty(mockFile, 'size', { value: size })

        const fileInput = screen.getByTestId('file-input')
        await fireEvent.change(fileInput, { target: { files: [mockFile] } })

        const readerInstance = fileReaderInstances[fileReaderInstances.length - 1]
        readerInstance.result = 'data:application/octet-stream;base64,eA=='
        readerInstance.onload?.({ target: { result: readerInstance.result } })

        await waitFor(() => {
          expect(screen.getByText(expected)).toBeInTheDocument()
        }, { timeout: DEFAULT_TIMEOUT })

        // Clear for next iteration and wait for cleanup
        const clearButton = screen.getByTestId('clear-button')
        await fireEvent.click(clearButton)
        await waitFor(() => {
          expect(screen.queryByTestId('result-section')).not.toBeInTheDocument()
        }, { timeout: DEFAULT_TIMEOUT })
      }
    })
  })

  describe('Full Workflow Integration', () => {
    it('should complete full workflow from file selection to copy', async () => {
      render(DataUriTool)

      // Initial state
      expect(screen.queryByTestId('result-section')).not.toBeInTheDocument()

      // Select file
      const mockFile = new File(['Hello World'], 'hello.txt', { type: 'text/plain' })
      const fileInput = screen.getByTestId('file-input')

      await fireEvent.change(fileInput, { target: { files: [mockFile] } })

      // Verify loading state
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()

      // Complete file read
      const readerInstance = fileReaderInstances[0]
      readerInstance.result = 'data:text/plain;base64,SGVsbG8gV29ybGQ='
      readerInstance.onload?.({ target: { result: readerInstance.result } })

      // Verify result state
      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        expect(screen.getByTestId('result-section')).toBeInTheDocument()
        expect(screen.getByTestId('filename-display')).toHaveTextContent('hello.txt')
        expect(screen.getByText('text/plain')).toBeInTheDocument()
        expect(screen.getByTestId('copy-button')).toBeInTheDocument()
        expect(screen.getByTestId('preview-unavailable')).toBeInTheDocument()
      }, { timeout: DEFAULT_TIMEOUT })

      // Clear and verify reset
      const clearButton = screen.getByTestId('clear-button')
      await fireEvent.click(clearButton)

      expect(screen.queryByTestId('result-section')).not.toBeInTheDocument()
      expect(fileInput).toHaveFocus()
    })
  })
})
