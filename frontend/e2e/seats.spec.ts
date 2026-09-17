import { expect, test } from '@playwright/test';

test('shows an unselected grid before applying the prescribed seats', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await page.getByRole('link', { name: 'Start booking' }).click();
  const loginResponse = page.waitForResponse((response) => response.url().endsWith('/api/auth/login'));
  await page.getByLabel('Mobile number').fill('9876543210');
  await page.getByRole('button', { name: 'Send OTP' }).click();
  expect((await loginResponse).status()).toBe(200);
  const verifyResponse = page.waitForResponse((response) => response.url().endsWith('/api/auth/verify'));
  await page.getByLabel('One-time password').fill('1234');
  await page.getByRole('button', { name: 'Verify and continue' }).click();
  expect((await verifyResponse).status()).toBe(200);
  await page.waitForResponse((response) => response.url().endsWith('/api/movies'));
  const theatresResponse = page.waitForResponse((response) => response.url().endsWith('/api/movies/1/theatres'));
  await page.getByRole('button', { name: 'Paradise' }).click();
  expect((await theatresResponse).status()).toBe(200);
  await page.getByRole('button', { name: 'Sandhya 70mm' }).click();

  await expect(page.getByText('No seats selected yet.')).toBeVisible();
  await expect(page.getByLabel('A1 unselected')).toBeVisible();
  await page.getByRole('button', { name: 'Select Seats' }).click();
  await expect(page).toHaveURL(/\/payment$/);
  await expect(page.getByRole('heading', { name: 'Choose a dummy payment method' })).toBeVisible();
  await page.screenshot({ path: 'test-results/seats-payment.png', fullPage: true });
  expect(errors).toEqual([]);
});
