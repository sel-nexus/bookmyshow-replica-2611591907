import { expect, test } from '@playwright/test';

test('discovers backend movies, narrows theatres by mapping, and continues with selection', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await page.getByRole('link', { name: 'Start booking' }).click();
  await page.getByLabel('Mobile number').fill('9876543210');
  await page.getByRole('button', { name: 'Send OTP' }).click();
  await page.getByLabel('One-time password').fill('1234');
  await page.getByRole('button', { name: 'Verify and continue' }).click();
  await expect(page.getByRole('button', { name: 'Paradise' })).toBeVisible();

  await page.getByRole('button', { name: 'Paradise' }).click();
  await expect(page.getByRole('button', { name: 'Sandhya' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Allu' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sudharsham' })).not.toBeVisible();
  await page.getByRole('button', { name: 'Sandhya' }).click();
  await expect(page).toHaveURL(/\/seats$/);
  expect(errors).toEqual([]);
});
