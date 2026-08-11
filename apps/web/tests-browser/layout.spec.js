import { expect, test } from '@playwright/test'
import { openStablePage, routesFromSitemap } from './helpers.js'

test('layout invariants hold for every canonical route', async ({ page, request }, testInfo) => {
  const routes = await routesFromSitemap(request)
  const theme = testInfo.project.name === 'desktop-chromium' ? 'dark' : 'light'
  const isMobile = testInfo.project.name === 'mobile-chromium'

  for (const route of routes) {
    await test.step(route, async () => {
      await openStablePage(page, route, theme)
      await expect(page.locator('main')).toHaveCount(1)
      await expect(page.locator('.site-header')).toBeVisible()

      const overflow = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: innerWidth
      }))
      expect(overflow.documentWidth).toBeLessThanOrEqual(overflow.viewportWidth)

      if (route !== '/') {
        await expect(page.locator('.tool-header')).toBeVisible()
        // JSONP simulates a browser callback exchange. The CLI only wraps or
        // emits script tags, so claiming an equivalent command would be false.
        await expect(page.locator('.command-strip')).toHaveCount(route === '/jsonp' ? 0 : 1)
      }

      const input = page.locator('section[aria-label="stdin"]')
      const output = page.locator('section[aria-label="stdout"]')
      if (await input.count() && await output.count()) {
        const inputBox = await input.boundingBox()
        const outputBox = await output.boundingBox()
        expect(inputBox).not.toBeNull()
        expect(outputBox).not.toBeNull()
        if (isMobile) {
          expect(outputBox.y).toBeGreaterThan(inputBox.y)
        } else {
          expect(outputBox.x).toBeGreaterThan(inputBox.x)
        }
      }
    })
  }
})

test('320px safety sweep has no horizontal page overflow', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium')
  await page.setViewportSize({ width: 320, height: 700 })
  const routes = await routesFromSitemap(request)

  for (const route of routes) {
    await test.step(route, async () => {
      await openStablePage(page, route, 'dark')
      const overflow = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: innerWidth
      }))
      expect(overflow.documentWidth).toBeLessThanOrEqual(overflow.viewportWidth)
    })
  }
})

test('search and shortcut polish has visible spacing and active states', async ({ page }, testInfo) => {
  const isMobile = testInfo.project.name === 'mobile-chromium'
  await openStablePage(page, '/json', 'dark')

  const commandShortcut = page.locator('.command-copy kbd')
  const commandResting = await commandShortcut.evaluate(element => {
    const style = getComputedStyle(element)
    return { background: style.backgroundColor, color: style.color }
  })
  await page.locator('.command-copy').hover()
  const commandActive = await commandShortcut.evaluate(element => {
    const style = getComputedStyle(element)
    return { background: style.backgroundColor, color: style.color }
  })

  expect.soft(commandActive.background).not.toBe(commandResting.background)
  expect.soft(commandActive.color).not.toBe(commandResting.color)

  await page.getByRole('button', { name: /all tools/i }).click()
  const searchInput = page.getByRole('textbox', { name: 'Search tools' })
  expect.soft(await searchInput.evaluate(element => getComputedStyle(element).paddingLeft)).toBe('8px')

  if (!isMobile) {
    const result = page.locator('.result-item').nth(1)
    const resultShortcut = result.locator('.result-shortcut')
    const resultResting = await resultShortcut.evaluate(element => {
      const style = getComputedStyle(element)
      return { background: style.backgroundColor, color: style.color }
    })
    await result.hover()
    const resultActive = await resultShortcut.evaluate(element => {
      const style = getComputedStyle(element)
      return { background: style.backgroundColor, color: style.color }
    })

    expect.soft(resultActive.background).not.toBe(resultResting.background)
    expect.soft(resultActive.color).not.toBe(resultResting.color)
  }
})
