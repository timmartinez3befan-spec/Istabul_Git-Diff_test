import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://elevateyourgame.website/');
  await page.getByRole('button', { name: 'Theme umschalten' }).click();
  await page.getByLabel('Navigation', { exact: true }).getByRole('link', { name: 'FAQs' }).click();
  await page.getByText('Wie läuft eine Session ab?').click();
  await expect(page.getByText('Warm-up, Technikfokus,')).toBeVisible();
  await page.getByText('Wie läuft eine Session ab?').click();
});
