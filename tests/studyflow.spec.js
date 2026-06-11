import { expect, test } from '@playwright/test';

test('muestra StudyFlow y actualiza el plan de estudio', async ({ page }) => {
  const requests = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/study-plans')) {
      requests.push(request);
    }
  });

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'StudyFlow' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Crear plan' })).toBeVisible();
  await page.getByRole('button', { name: 'Noche' }).click();
  await expect(page.getByRole('button', { name: 'Manana' })).toBeVisible();

  await page.getByLabel('Materia').fill('Programacion');
  await page.getByLabel('Temas pendientes').fill('Funciones, Arrays, APIs');

  await expect(page.getByRole('heading', { name: 'Tu ruta para Programacion' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Funciones' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Arrays' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Checklist para llegar con calma' })).toBeVisible();
  expect(requests.length).toBeGreaterThan(0);
});
