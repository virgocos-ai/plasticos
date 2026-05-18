import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('debe mostrar el formulario de login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h2')).toContainText('Iniciar sesión');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('debe redirigir al dashboard con credenciales válidas', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@plasticos.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('debe mostrar error con credenciales inválidas', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Credenciales inválidas')).toBeVisible();
  });
});
