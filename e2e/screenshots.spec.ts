import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SHOTS = path.resolve(__dirname, '..', 'screenshots')

/** Helper: viewport screenshot with a descriptive name. */
async function snap(page: import('@playwright/test').Page, name: string) {
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false })
}

/** Click a view tab by exact label (Workflow, Cheat Sheet, Analysis, Annotated). */
function clickTab(page: import('@playwright/test').Page, label: string) {
  return page.getByRole('button', { name: label, exact: true }).click()
}

test('capture all app states for blog screenshots', async ({ page }) => {
  // Dismiss onboarding tutorial by setting localStorage before page loads
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('ophi-onboarding-complete', 'true'))
  await page.reload()
  await page.waitForLoadState('networkidle')

  // ─── 1. Empty state ───────────────────────────────────────────
  await snap(page, '01-empty-state')

  // ─── 2. Load "Data Analysis" sample (auto-translates) ────────
  await page.getByRole('button', { name: 'Data Analysis', exact: true }).click()
  await page.waitForTimeout(800)
  await snap(page, '02-data-analysis-workflow')

  // ─── 3. Click a workflow node to see detail view ──────────────
  const nodes = page.locator('.animate-node-in')
  await expect(nodes.first()).toBeVisible({ timeout: 5000 })
  await nodes.nth(2).click()
  await page.waitForTimeout(500)
  await snap(page, '03-node-detail')

  // ─── 4. Back to workflow, then Cheat Sheet tab ────────────────
  await page.getByRole('button', { name: /back to workflow/i }).click()
  await page.waitForTimeout(300)
  await clickTab(page, 'Cheat Sheet')
  await page.waitForTimeout(500)
  await snap(page, '04-cheatsheet-alteryx')

  // ─── 5. Analysis / Recommendations tab ────────────────────────
  await clickTab(page, 'Analysis')
  await page.waitForTimeout(500)
  await snap(page, '05-recommendations')

  // ─── 6. Annotated code view ───────────────────────────────────
  await clickTab(page, 'Annotated')
  await page.waitForTimeout(500)
  await snap(page, '06-annotated-code')

  // ─── 7. Toggle to Excel terminology — Workflow view ───────────
  await clickTab(page, 'Workflow')
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: 'Excel', exact: true }).click()
  await page.waitForTimeout(500)
  await snap(page, '07-excel-workflow')

  // ─── 8. Excel mode — Cheat Sheet ─────────────────────────────
  await clickTab(page, 'Cheat Sheet')
  await page.waitForTimeout(500)
  await snap(page, '08-excel-cheatsheet')

  // ─── 9. Switch back to Alteryx, load Polars sample ───────────
  await page.getByRole('button', { name: 'Alteryx', exact: true }).click()
  await page.waitForTimeout(200)
  await clickTab(page, 'Workflow')
  await page.waitForTimeout(200)
  await page.getByRole('button', { name: 'Polars Big Data Analysis', exact: true }).click()
  await page.waitForTimeout(800)
  await snap(page, '09-polars-workflow')

  // ─── 10. ETL Pipeline sample ──────────────────────────────────
  await page.getByRole('button', { name: 'ETL Pipeline', exact: true }).click()
  await page.waitForTimeout(800)
  await snap(page, '10-etl-workflow')

  // ─── 11. ETL Cheat Sheet ──────────────────────────────────────
  await clickTab(page, 'Cheat Sheet')
  await page.waitForTimeout(500)
  await snap(page, '11-etl-cheatsheet')
})
