import { test, expect } from '@playwright/test';

test.describe('Create Items', () => {
  test('open create item form', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.getByTestId('create-items').click();

    await expect(
      page.getByRole('heading', { name: 'Create Item' })
    ).toBeVisible();
  });

  test('create new item', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.getByTestId('create-items').click();

    await page
      .getByRole('heading', { name: 'Create Item' })
      .waitFor({ state: 'visible' });

    await page.waitForSelector('input[placeholder="New Item"]', {
      state: 'visible',
    });
    await page.fill('input[placeholder="New Item"] >> nth=0', 'Test Item Name');

    await page.waitForSelector('input[placeholder="New Item"]', {
      state: 'visible',
    });
    await page.fill(
      'input[placeholder="New Item"] >> nth=1',
      'Test Table Name'
    );

    await page.waitForSelector('input[placeholder="Extension Name"]', {
      state: 'visible',
    });
    await page.fill('input[placeholder="Extension Name"]', 'Extension F1');
    await page.waitForSelector('button:enabled', { state: 'visible' });
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText('Success')).toBeVisible();
  });
});
