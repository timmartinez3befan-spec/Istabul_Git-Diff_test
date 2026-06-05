import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://elevateyourgame.website/');
  await page.getByRole('button', { name: 'Alle akzeptieren' }).click();
  await expect(page.locator('div').filter({ hasText: 'Schnell starten Buche dein 1:' }).nth(1)).toBeVisible();
  await page.getByLabel('Navigation', { exact: true }).getByRole('link', { name: 'Preise' }).click();
  await page.locator('#digital-weekly').getByRole('link', { name: 'Details ansehen' }).click();
  await page.getByRole('link', { name: 'Jetzt starten' }).click();
  await page.getByRole('textbox', { name: 'E-Mail' }).click();
  await page.getByRole('textbox', { name: 'E-Mail' }).fill('tim.martinez@gmail.com');
  await page.getByRole('textbox', { name: 'E-Mail' }).press('Tab');
  await page.getByRole('textbox', { name: 'Passwort' }).fill('Test');
  await page.getByRole('button', { name: 'Einloggen' }).click();
  await page.getByRole('textbox', { name: 'Passwort' }).click();
  await page.getByRole('textbox', { name: 'Passwort' }).fill('Test1234');
  await page.getByRole('button', { name: 'Einloggen' }).click();
});