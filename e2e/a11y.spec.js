// Accessibility check of every page with axe-core (WCAG 2.1 A and AA rules).
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const BASE = 'http://localhost:4173/aeria-dashboard/#'
const PAGES = ['/', '/carte', '/prevision', '/parc', '/a-propos', '/station/FR05090']

for (const path of PAGES) {
  test(`no WCAG 2.1 AA violation on ${path}`, async ({ page }) => {
    await page.goto(BASE + path)
    await page.waitForSelector('main h1', { timeout: 20000 })
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('.leaflet-container')   // the map has an equivalent sorted list next to it
      .analyze()
    const summary = results.violations.map((v) => `${v.id} (${v.nodes.length}): ${v.help}`)
    expect(summary).toEqual([])
  })
}

test('the forecast and the station page show real data', async ({ page }) => {
  await page.goto(BASE + '/prevision')
  await expect(page.locator('tbody tr').first()).toBeVisible()
  await page.goto(BASE + '/station/FR05090')
  await expect(page.getByText('Le Havre ville-haute').first()).toBeVisible()
})
