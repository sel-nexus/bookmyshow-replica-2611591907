import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('authenticates with the prescribed OTP on a mobile viewport and protects direct routes', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Enter your mobile number' })).toBeVisible();

  const loginResponse = page.waitForResponse((response) => (
    response.url().endsWith('/api/auth/login') && response.request().method() === 'POST'
  ));
  await page.getByLabel('Mobile number').fill('9876543210');
  await page.getByRole('button', { name: 'Send OTP' }).click();
  expect((await loginResponse).status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Verify your OTP' })).toBeVisible();

  const verifyResponse = page.waitForResponse((response) => (
    response.url().endsWith('/api/auth/verify') && response.request().method() === 'POST'
  ));
  await page.getByLabel('One-time password').fill('1234');
  await page.getByRole('button', { name: 'Verify and continue' }).click();
  expect((await verifyResponse).status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Choose a film' })).toBeVisible();
  await page.screenshot({ path: 'test-results/auth-mobile-dashboard.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('shows the backend rejection for an invalid OTP without creating a session', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('status of 401')) {
      errors.push(message.text());
    }
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/login');
  await page.getByLabel('Mobile number').fill('9876543210');
  await page.getByRole('button', { name: 'Send OTP' }).click();
  await expect(page.getByRole('heading', { name: 'Verify your OTP' })).toBeVisible();

  const verifyResponse = page.waitForResponse((response) => (
    response.url().endsWith('/api/auth/verify') && response.request().method() === 'POST'
  ));
  await page.getByLabel('One-time password').fill('0000');
  await page.getByRole('button', { name: 'Verify and continue' }).click();

  expect((await verifyResponse).status()).toBe(401);
  await expect(page.getByRole('alert')).toHaveText('OTP could not be verified.');
  await expect(page).toHaveURL(/\/otp$/);
  expect(errors).toEqual([]);
});

test('disposes the transient session on reload and redirects the protected route to login', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/login');
  await page.getByLabel('Mobile number').fill('9876543210');
  await page.getByRole('button', { name: 'Send OTP' }).click();
  await page.getByLabel('One-time password').fill('1234');
  await page.getByRole('button', { name: 'Verify and continue' }).click();
  await expect(page.getByRole('heading', { name: 'Choose a film' })).toBeVisible();

  await page.reload();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Enter your mobile number' })).toBeVisible();
  expect(errors).toEqual([]);
});
