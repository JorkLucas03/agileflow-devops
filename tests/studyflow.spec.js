import { expect, test } from '@playwright/test';

test('crea un plan con FastAPI, lo guarda y persiste checklist', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('studyflow-e2e-cleared')) {
      localStorage.removeItem('studyflow-theme');
      localStorage.removeItem('studyflow-plans');
      localStorage.removeItem('studyflow-active-plan-id');
      sessionStorage.setItem('studyflow-e2e-cleared', 'true');
    }
  });

  const requests = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/study-plans')) {
      requests.push(request);
    }
  });

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'StudyFlow' })).toBeVisible();
  await page.getByRole('button', { name: 'Noche' }).click();
  await expect(page.getByRole('button', { name: 'Dia' })).toBeVisible();

  await page.getByLabel('Materia').fill('Programacion');
  await page.getByLabel('Temas pendientes').fill('Funciones, Arrays, APIs');

  await page.locator('.plannerPanel').getByRole('button', { name: 'Crear plan' }).click();

  await expect(page.getByText('Plan creado con FastAPI')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tu ruta para Programacion' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Funciones' })).toBeVisible();
  expect(requests.length).toBeGreaterThan(0);

  await expect(page.getByText('Planes guardados en este navegador')).toBeVisible();
  await expect(page.locator('.savedPlan').filter({ hasText: 'Programacion' })).toBeVisible();

  await page.locator('.routeCard').filter({ hasText: 'Funciones' }).getByRole('checkbox').first().check();
  await expect(page.getByText('1 de 9 tareas completadas')).toBeVisible();

  await page.reload();

  await expect(page.getByRole('button', { name: 'Dia' })).toBeVisible();
  await expect(page.locator('.savedPlan').filter({ hasText: 'Programacion' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tu ruta para Programacion' })).toBeVisible();
  await expect(page.getByText('1 de 9 tareas completadas')).toBeVisible();
  await expect(page.locator('.routeCard').filter({ hasText: 'Funciones' }).getByRole('checkbox').first()).toBeChecked();
});

test('muestra en el frontend un plan creado directamente en la API', async ({ page, request }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('studyflow-api-e2e-cleared')) {
      localStorage.removeItem('studyflow-plans');
      localStorage.removeItem('studyflow-active-plan-id');
      sessionStorage.setItem('studyflow-api-e2e-cleared', 'true');
    }
  });

  const subject = `Fisica API ${Date.now()}`;
  const response = await request.post('http://127.0.0.1:8000/api/study-plans', {
    data: {
      subject,
      examDate: '2027-07-15',
      hoursPerDay: 3,
      difficulty: 'Alta',
      focus: 'Final acumulativo',
      topics: 'Vectores, Cinematica, Dinamica',
    },
  });

  expect(response.status()).toBe(201);

  await page.goto('/');

  await expect(page.getByText(`Plan de ${subject} sincronizado desde la API.`)).toHaveCount(0);
  await expect(page.locator('.savedPlan').filter({ hasText: subject })).toHaveCount(0);

  await page.getByRole('button', { name: 'Sincronizar API' }).click();
  await expect(page.getByText(`Plan de ${subject} sincronizado desde la API.`)).toBeVisible({
    timeout: 8000,
  });
  await expect(page.locator('.savedPlan').filter({ hasText: subject })).toBeVisible();
  await expect(page.getByRole('heading', { name: `Tu ruta para ${subject}` })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Vectores' })).toBeVisible();

  await page.getByRole('button', { name: `Eliminar ${subject}` }).click();
  await expect(page.getByText(`Plan de ${subject} eliminado.`)).toBeVisible();
  await expect(page.locator('.savedPlan').filter({ hasText: subject })).toHaveCount(0);

  await page.reload();
  await page.getByRole('button', { name: 'Sincronizar API' }).click();
  await expect(page.locator('.savedPlan').filter({ hasText: subject })).toHaveCount(0);
});
