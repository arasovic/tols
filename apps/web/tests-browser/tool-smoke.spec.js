import { expect, test } from '@playwright/test'
import { openStablePage, routesFromSitemap } from './helpers.js'
import { toolCases } from './tool-cases.js'

test.describe('tool smoke', () => {
  test('manifest covers every canonical tool route exactly once', async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium')
    const routes = (await routesFromSitemap(request)).filter(route => route !== '/')
    const caseRoutes = toolCases.map(toolCase => `/${toolCase.id}`)

    expect(new Set(caseRoutes).size).toBe(caseRoutes.length)
    expect(caseRoutes.slice().sort()).toEqual(routes.slice().sort())
  })

  for (const toolCase of toolCases) {
    test(`${toolCase.id} produces meaningful browser output`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop-chromium')
      await openStablePage(page, `/${toolCase.id}`, 'dark')
      await toolCase.run(page)
    })
  }
})
