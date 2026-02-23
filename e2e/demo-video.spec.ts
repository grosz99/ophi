import { test } from '@playwright/test'

/**
 * Records a demo video: paste code → Transform → browse workflow →
 * Cheat Sheet → Export PPT. Playwright saves a .webm automatically.
 */
test.use({
  viewport: { width: 1280, height: 720 },
  video: { mode: 'on', size: { width: 1280, height: 720 } },
})

const DEMO_CODE = `import pandas as pd

# Load sales data
df = pd.read_csv("quarterly_sales.csv")

# Clean column names
df.columns = df.columns.str.strip().str.lower()

# Remove rows with missing revenue
df = df.dropna(subset=["revenue"])

# Calculate profit margin
df["profit_margin"] = (df["revenue"] - df["cost"]) / df["revenue"]

# Filter high-performing regions
top = df[df["profit_margin"] > 0.3]

# Aggregate by region
summary = top.groupby("region").agg({"revenue": "sum", "profit_margin": "mean"})

# Export results
summary.to_csv("regional_performance.csv")
`

test('demo walkthrough for GIF', async ({ page }) => {
  // Skip onboarding
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('ophi-onboarding-complete', 'true'))
  await page.reload()
  await page.waitForLoadState('networkidle')

  // ─── Instant start: load sample so the product is visible immediately ──
  await page.getByRole('button', { name: 'Data Analysis', exact: true }).click()
  await page.waitForTimeout(1200)

  // ─── Scroll through workflow nodes slowly ─────────────────────
  const outputPanel = page.locator('.overflow-y-auto').last()
  await outputPanel.evaluate(el => {
    el.scrollTo({ top: el.scrollHeight / 3, behavior: 'smooth' })
  })
  await page.waitForTimeout(800)
  await outputPanel.evaluate(el => {
    el.scrollTo({ top: (el.scrollHeight * 2) / 3, behavior: 'smooth' })
  })
  await page.waitForTimeout(800)
  await outputPanel.evaluate(el => {
    el.scrollTo({ top: 0, behavior: 'smooth' })
  })
  await page.waitForTimeout(600)

  // ─── Toggle to Excel mode ──────────────────────────────────────
  await page.getByRole('button', { name: 'Excel', exact: true }).click()
  await page.waitForTimeout(1200)

  // ─── Switch back to Alteryx ────────────────────────────────────
  await page.getByRole('button', { name: 'Alteryx', exact: true }).click()
  await page.waitForTimeout(600)

  // ─── Switch to Cheat Sheet tab ────────────────────────────────
  await page.getByRole('button', { name: 'Cheat Sheet', exact: true }).click()
  await page.waitForTimeout(1500)

  // ─── Click Export PPT ─────────────────────────────────────────
  await page.getByRole('button', { name: 'Export PPT', exact: true }).click()
  await page.waitForTimeout(1500)

  // Final pause on the result
  await page.waitForTimeout(800)
})
