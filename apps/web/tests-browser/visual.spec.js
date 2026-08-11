import { expect, test } from '@playwright/test'
import { openStablePage, routesFromSitemap, snapshotName } from './helpers.js'

const inverseRoutes = ['/', '/json', '/diff', '/qrcode', '/cron']

test('visual matrix covers every canonical route', async ({ page, request }, testInfo) => {
  const routes = await routesFromSitemap(request)
  const mainTheme = testInfo.project.name === 'desktop-chromium' ? 'dark' : 'light'
  const inverseTheme = mainTheme === 'dark' ? 'light' : 'dark'

  for (const route of routes) {
    await test.step(`${route} / ${mainTheme}`, async () => {
      await openStablePage(page, route, mainTheme, { deterministic: true })
      await expect(page).toHaveScreenshot(snapshotName(route, mainTheme), {
        animations: 'disabled',
        fullPage: true,
        maxDiffPixelRatio: 0.01
      })
    })
  }

  for (const route of inverseRoutes) {
    await test.step(`${route} / ${inverseTheme}`, async () => {
      await openStablePage(page, route, inverseTheme, { deterministic: true })
      await expect(page).toHaveScreenshot(snapshotName(route, inverseTheme), {
        animations: 'disabled',
        fullPage: true,
        maxDiffPixelRatio: 0.01
      })
    })
  }
})

test('tool index and not-found surfaces have visual coverage', async ({ page }, testInfo) => {
  const theme = testInfo.project.name === 'desktop-chromium' ? 'dark' : 'light'

  await openStablePage(page, '/', theme, { deterministic: true })
  await page.getByRole('button', { name: /all tools/i }).click()
  const toolIndex = page.getByRole('dialog', { name: 'Search tools' })
  await expect(toolIndex).toBeVisible()
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden')
  await expect(page.locator('[data-search-background]')).toHaveAttribute('inert', '')
  await expect(page.locator('[data-search-background]')).toHaveAttribute('aria-hidden', 'true')
  await expect(page.locator('.index-count')).toHaveCount(0)
  await expect(toolIndex).toHaveScreenshot(`tool-index-${theme}.png`, {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01
  })

  await page.keyboard.press('Escape')
  await expect(page.locator('[data-search-background]')).not.toHaveAttribute('inert', '')
  await page.goto('/route-that-does-not-exist', { waitUntil: 'networkidle' })
  await expect(page.locator('.site-header')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: '404' })).toBeVisible()
  await expect(page.getByRole('link', { name: /back to tols/i })).toBeVisible()
  await expect(page).toHaveScreenshot(`not-found-${theme}.png`, {
    animations: 'disabled',
    fullPage: true,
    maxDiffPixelRatio: 0.01
  })
})
