import '@testing-library/jest-dom'

// Note: Svelte lifecycle functions should not be mocked globally.
// They are imported from 'svelte' and should be properly handled by the test environment.
// If tests fail due to lifecycle issues, consider using @testing-library/svelte helpers
// or ensure proper component mounting in the test setup.

// Mock crypto.getRandomValues for password generation tests
if (!global.crypto.getRandomValues) {
  Object.defineProperty(global.crypto, 'getRandomValues', {
    value: function(array) {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256)
      }
      return array
    },
    writable: true,
    configurable: true
  })
}

// Mock crypto.subtle for hash tests
Object.defineProperty(global.crypto, 'subtle', {
  value: {
    /**
     * @param {string} algorithm
     * @param {ArrayBuffer} data
     * @returns {Promise<ArrayBuffer>}
     */
    async digest(algorithm, data) {
      const algo = algorithm.toUpperCase()
      let hashLength

      switch (algo) {
        case 'SHA-256':
          hashLength = 32
          break
        case 'SHA-512':
          hashLength = 64
          break
        case 'SHA-1':
          hashLength = 20
          break
        default:
          throw new Error(`Unsupported algorithm: ${algorithm}`)
      }

      // Create a deterministic mock hash based on data
      const seed = Array.from(new Uint8Array(data)).reduce((a, b) => a + b, 0)
      const hash = new Uint8Array(hashLength)
      for (let i = 0; i < hashLength; i++) {
        hash[i] = (seed + i * 7) % 256
      }
      return hash.buffer
    }
  },
  writable: true,
  configurable: true
})
