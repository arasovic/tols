import { describe, it, expect } from 'vitest'
import { GET } from '../src/routes/sitemap.xml/+server.js'

describe('sitemap.xml', () => {
  it('home loc ends with a trailing slash', async () => {
    const response = await GET()
    const body = await response.text()
    expect(body).toContain('<loc>https://arasovic.github.io/dev-utilities/</loc>')
  })

  it('tool locs keep their current form', async () => {
    const response = await GET()
    const body = await response.text()
    expect(body).toContain('<loc>https://arasovic.github.io/dev-utilities/json</loc>')
    expect(body).not.toContain('<loc>https://arasovic.github.io/dev-utilities/json/</loc>')
  })
})