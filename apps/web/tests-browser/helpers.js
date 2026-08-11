import { expect } from '@playwright/test'

const FIXED_TIME = new Date('2026-08-11T12:00:00.000Z')

export async function routesFromSitemap(request) {
  const response = await request.get('/sitemap.xml')
  expect(response.ok()).toBe(true)
  const xml = await response.text()
  const routes = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(([, location]) => new URL(location).pathname)
  expect(routes.length).toBeGreaterThan(1)
  return routes
}

export async function openStablePage(page, route, theme, { deterministic = false } = {}) {
  if (page.url() === 'about:blank') {
    await page.addInitScript(({ defaultTheme, deterministic }) => {
      const selectedTheme = sessionStorage.getItem('tols-visual-theme') || defaultTheme
      localStorage.setItem('tols-theme', selectedTheme)

      if (!deterministic) return

      let randomState = 0x5eed1234
      const nextRandom = () => {
        randomState = (randomState * 1664525 + 1013904223) >>> 0
        return randomState / 0x100000000
      }

      Math.random = nextRandom
      Object.defineProperty(window.crypto, 'getRandomValues', {
        configurable: true,
        value: array => {
          const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength)
          for (let index = 0; index < bytes.length; index += 1) {
            bytes[index] = Math.floor(nextRandom() * 256)
          }
          return array
        }
      })
      Object.defineProperty(window.crypto, 'randomUUID', {
        configurable: true,
        value: () => '5eed1234-5eed-4234-8eed-5eed12345eed'
      })
    }, { defaultTheme: theme, deterministic })
    if (deterministic) await page.clock.setFixedTime(FIXED_TIME)
  } else {
    await page.evaluate((selectedTheme) => {
      sessionStorage.setItem('tols-visual-theme', selectedTheme)
    }, theme)
  }

  await page.goto(route, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        caret-color: transparent !important;
        transition: none !important;
      }
    `
  })
  await expect(page.locator('main')).toBeVisible()
}

export function snapshotName(route, theme) {
  const name = route === '/'
    ? 'home'
    : route.replace(/^\//, '').replace(/\//g, '-')
  return `${name}-${theme}.png`
}
