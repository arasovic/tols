import { expect } from '@playwright/test'

async function expectCanvasChanged(canvas, action) {
  const before = await canvas.evaluate(element => element.toDataURL())
  await action()
  await expect.poll(() => canvas.evaluate(element => element.toDataURL())).not.toBe(before)
  await expect.poll(() => canvas.evaluate(element => element.toDataURL().length)).toBeGreaterThan(300)
}

export const toolCases = [
  {
    id: 'json',
    run: async page => {
      await page.getByLabel('JSON input').fill('{"browser": true, "count": 2}')
      await page.getByRole('tab', { name: 'Minify' }).click()
      await expect(page.locator('.output-display')).toHaveText('{"browser":true,"count":2}')
    }
  },
  {
    id: 'yaml',
    run: async page => {
      await page.getByRole('tab', { name: 'Convert JSON to YAML' }).click()
      await page.getByLabel('JSON input').fill('{"browser":"proof","count":2}')
      await page.keyboard.press('Meta+Enter')
      await expect(page.getByRole('region', { name: 'Output' })).toContainText('browser: proof')
    }
  },
  {
    id: 'xml',
    run: async page => {
      await page.getByRole('button', { name: 'Minify' }).click()
      await page.getByLabel('XML Input').fill('<root>  <item>proof</item>  </root>')
      await expect(page.getByRole('region', { name: 'XML Output' })).toHaveText('<root><item>proof</item></root>')
    }
  },
  {
    id: 'html',
    run: async page => {
      await page.getByRole('button', { name: 'Minify' }).click()
      await page.getByLabel('HTML input').fill('<main>  <p>proof</p>  </main>')
      await expect(page.locator('.output-display')).toHaveText('<main><p>proof</p></main>')
    }
  },
  {
    id: 'markdown',
    run: async page => {
      await page.getByLabel('Markdown input').fill('# Browser proof')
      await page.keyboard.press('Meta+Enter')
      await expect(page.getByRole('region', { name: 'Preview' }).getByRole('heading', { name: 'Browser proof' })).toBeVisible()
      await expect(page.locator('.html-code')).toContainText('<h1>Browser proof</h1>')
    }
  },
  {
    id: 'regex',
    run: async page => {
      await page.getByLabel('Regex pattern', { exact: true }).fill('tols')
      await page.getByLabel('Text to match against regex pattern', { exact: true }).fill('tols and tols')
      await page.keyboard.press('Meta+Enter')
      await expect(page.locator('.match-text')).toHaveCount(2)
      await expect(page.locator('.match-text').first()).toHaveText('tols')
    }
  },
  {
    id: 'diff',
    run: async page => {
      await page.getByLabel('Original text input').fill('alpha\nold value')
      await page.getByLabel('Modified text input').fill('alpha\nnew value')
      const result = page.getByTestId('diff-result')
      await expect(result).toContainText('old')
      await expect(result).toContainText('new')
    }
  },
  {
    id: 'sql',
    run: async page => {
      await page.getByLabel('SQL Input').fill('select id,name from users where id=1')
      await expect(page.locator('.output-display')).toContainText('SELECT')
      await expect(page.locator('.output-display')).toContainText('FROM users')
    }
  },
  {
    id: 'base64',
    run: async page => {
      await page.getByLabel('Text input to encode').fill('browser proof')
      await expect(page.locator('.output-display')).toHaveText('YnJvd3NlciBwcm9vZg==')
      await page.getByRole('button', { name: 'Decode', exact: true }).click()
      await page.getByLabel('Base64 input to decode').fill('YnJvd3NlciBwcm9vZg==')
      await expect(page.locator('.output-display')).toHaveText('browser proof')
    }
  },
  {
    id: 'url',
    run: async page => {
      await page.getByLabel('Text to encode').fill('https://example.com/a path?q=one two')
      const encoded = page.getByTestId('output-content')
      await expect(encoded).toContainText('%20')
      await page.getByRole('tab', { name: 'Decode' }).click()
      await page.getByLabel('URL-encoded text to decode').fill('browser%20proof%3Fok%3Dyes')
      await expect(page.getByTestId('output-content')).toHaveText('browser proof?ok=yes')
    }
  },
  {
    id: 'jwt',
    run: async page => {
      await page.getByRole('button', { name: 'Load example JWT token' }).click()
      await expect(page.getByTestId('jwt-header-panel')).toContainText('HS256')
      await expect(page.getByTestId('jwt-payload-panel')).toContainText('John Doe')
    }
  },
  {
    id: 'jwt-encoder',
    run: async page => {
      await page.getByRole('button', { name: 'Load example' }).click()
      const token = page.getByTestId('jwt-token-panel').locator('.token-value')
      await expect(token).toHaveText(/^[^.]+\.[^.]+\.[^.]+$/)
    }
  },
  {
    id: 'jsonp',
    run: async page => {
      await page.getByLabel('Callback Function').fill('browserCallback')
      await page.getByLabel('Simulated Response (JSON)').fill('{"browser":"proof"}')
      await expect(page.locator('.code-block')).toContainText('callback=browserCallback')
      await expect(page.locator('.result-display')).toContainText('"browser": "proof"')
    }
  },
  {
    id: 'gzip',
    run: async page => {
      await page.locator('#gzip-input').fill('browser proof '.repeat(200))
      await expect(page.locator('.results-card')).toContainText('Compressed size:')
      await expect(page.locator('.results-card')).toContainText('Savings:')
    }
  },
  {
    id: 'data-uri',
    run: async page => {
      await page.getByTestId('file-input').setInputFiles({
        name: 'proof.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('browser proof')
      })
      await expect(page.getByTestId('data-url-output')).toHaveValue(/^data:text\/plain;base64,/)
      await expect(page.getByTestId('result-section')).toContainText('proof.txt')
    }
  },
  {
    id: 'uuid',
    run: async page => {
      await page.getByRole('button', { name: 'Generate UUIDs' }).click()
      await expect(page.locator('.uuid-single')).toHaveText(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    }
  },
  {
    id: 'hash',
    run: async page => {
      await page.getByRole('radio', { name: 'SHA-256 256-bit hash algorithm' }).click()
      await page.getByTestId('hash-input').fill('hello')
      await expect(page.getByTestId('hash-output')).toContainText('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')
    }
  },
  {
    id: 'lorem',
    run: async page => {
      await page.getByRole('button', { name: 'Increase paragraph count' }).click()
      await expect(page.getByTestId('lorem-output-panel').locator('.panel-meta')).toHaveText('4 paragraphs')
      await expect(page.getByTestId('lorem-output-panel').locator('.output-content')).not.toBeEmpty()
    }
  },
  {
    id: 'qrcode',
    run: async page => {
      const canvas = page.getByLabel('Generated QR code')
      await expectCanvasChanged(canvas, () => page.getByLabel('Text or URL').fill('https://tols.test/browser-proof'))
    }
  },
  {
    id: 'barcode',
    run: async page => {
      const canvas = page.getByLabel(/Barcode representing|Barcode preview area/)
      await expectCanvasChanged(canvas, () => page.getByLabel('Text to encode').fill('1234567890'))
    }
  },
  {
    id: 'password',
    run: async page => {
      await page.getByRole('button', { name: 'Regenerate password' }).click()
      await expect(page.locator('.password-value')).toHaveText(/^.{16}$/)
      await expect(page.locator('.entropy')).toHaveText(/\d+ bits/)
    }
  },
  {
    id: 'placeholder',
    run: async page => {
      await page.getByLabel('Image width in pixels').fill('240')
      await page.getByLabel('Image height in pixels').fill('120')
      await page.getByLabel('Custom placeholder text').fill('browser proof')
      const canvas = page.getByTestId('preview-canvas')
      await expect(canvas).toHaveAttribute('width', '240')
      await expect(canvas).toHaveAttribute('height', '120')
      await expect.poll(() => canvas.evaluate(element => element.toDataURL().length)).toBeGreaterThan(300)
    }
  },
  {
    id: 'color',
    run: async page => {
      await page.getByLabel('HEX color value').fill('#ff0000')
      await expect(page.getByLabel('RGB color value')).toHaveValue('rgb(255, 0, 0)')
      await expect(page.getByLabel('HSL color value')).toHaveValue('hsl(0, 100%, 50%)')
    }
  },
  {
    id: 'timestamp',
    run: async page => {
      await page.getByPlaceholder(/Enter Unix timestamp/).fill('1704067200')
      await expect(page.locator('.output-content')).toContainText('2024-01-01T00:00:00.000Z')
    }
  },
  {
    id: 'timezone',
    run: async page => {
      await page.getByLabel('From Time Zone').selectOption('UTC')
      await page.getByLabel('To Time Zone').selectOption('America/New_York')
      await expect(page.locator('.time-value')).not.toBeEmpty()
      await expect(page.locator('.time-offset')).toContainText('-4.0h')
    }
  },
  {
    id: 'base-converter',
    run: async page => {
      await page.getByLabel('Decimal number input', { exact: true }).fill('42')
      await expect(page.getByLabel('Binary number input', { exact: true })).toHaveValue('101010')
      await expect(page.getByLabel('Hexadecimal number input', { exact: true })).toHaveValue('2A')
    }
  },
  {
    id: 'cron',
    run: async page => {
      await page.getByPlaceholder('* * * * *').fill('*/5 * * * *')
      await expect(page.getByTestId('description-panel')).toContainText('Runs at minute */5')
      await expect(page.getByTestId('next-runs-panel').locator('.run-item')).toHaveCount(5)
    }
  },
  {
    id: 'unicode',
    run: async page => {
      await page.getByLabel('Unicode code point').fill('A')
      await expect(page.locator('.codepoint')).toHaveText('U+0041')
      await page.getByRole('tab', { name: 'Search' }).click()
      await page.getByLabel('Common character search').fill('arrow')
      await expect(page.locator('.char-card')).not.toHaveCount(0)
    }
  },
  {
    id: 'css',
    run: async page => {
      await page.getByRole('button', { name: 'Minify' }).click()
      await page.getByLabel('CSS input').fill('.proof { color: red; margin: 0 1px; }')
      await expect(page.locator('.output-display')).toHaveText('.proof{color:red;margin:0 1px}')
    }
  },
  {
    id: 'css-filter',
    run: async page => {
      await page.getByLabel('Blur filter amount').fill('5')
      await expect(page.locator('.filter-code code')).toContainText('blur(5px)')
      await expect(page.getByLabel('Sample image for filter preview').locator('..')).toHaveAttribute('style', /blur\(5px\)/)
    }
  }
]
