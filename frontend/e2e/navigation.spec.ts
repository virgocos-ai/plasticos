import { test, expect } from '@playwright/test';

test.describe('Navegación', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@plasticos.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('debe navegar a Clientes', async ({ page }) => {
    await page.click('text=Clientes');
    await expect(page).toHaveURL('/clientes');
    await expect(page.locator('h1')).toContainText('Clientes');
  });

  test('debe navegar a Productos', async ({ page }) => {
    await page.click('text=Productos');
    await expect(page).toHaveURL('/productos');
    await expect(page.locator('h1')).toContainText('Productos');
  });

  test('debe navegar a Facturas', async ({ page }) => {
    await page.click('text=Facturas');
    await expect(page).toHaveURL('/facturas');
    await expect(page.locator('h1')).toContainText('Facturas');
  });
});
