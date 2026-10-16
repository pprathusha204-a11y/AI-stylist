import { test, expect } from '@playwright/test';
for (const viewport of [{ width: 1280, height: 800 }, { width: 375, height: 667 }, { width: 320, height: 568 }]) {
  test(`callback interaction and layout ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.route('**/callback/services', route => route.fulfill({ json: { services: ['Virtual Try-On', 'Measurement Help', 'Customize Design', 'Order Support', 'Corporate Orders'] } }));
    let fail = true; let posts = 0; const keys: string[] = [];
    await page.route('**/api/callback', async route => {
      posts++; keys.push(route.request().postDataJSON().requestId);
      await new Promise(resolve => setTimeout(resolve, 300));
      await route.fulfill({ status: fail ? 503 : 201, json: fail ? { message: 'Please retry shortly.' } : { success: true, id: 'saved-id' } });
    });
    await page.goto('/');
    const launcher = page.getByRole('button', { name: 'Request a callback', exact: true });
    const composer = page.getByRole('textbox', { name: 'Message', exact: true });
    const a = await launcher.boundingBox(); const b = await composer.boundingBox();
    expect(a!.y + a!.height < b!.y || a!.x > b!.x + b!.width).toBe(true);
    await launcher.click();
    const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible();
    await expect(page.getByLabel('Name', { exact: false }).first()).toBeFocused();
    const box = await dialog.boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
    const submitBox = await page.getByRole('button', { name: 'Call Me Back', exact: true }).boundingBox();
    expect(submitBox!.y + submitBox!.height).toBeLessThanOrEqual(viewport.height - 16);
    await page.screenshot({ path: testInfo.outputPath('callback.png') });
    for (let index = 0; index < 9; index++) { await page.keyboard.press('Tab'); expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true); }
    await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible(); await expect(launcher).toBeFocused();
    await launcher.click();
    await page.getByRole('button', { name: 'Call Me Back', exact: true }).click(); expect(posts).toBe(0);
    await page.getByLabel('Name', { exact: false }).first().fill('Test Customer');
    await page.getByLabel('Phone number').fill('123');
    await page.getByLabel('Service required').selectOption('Order Support');
    await page.getByRole('button', { name: 'Call Me Back', exact: true }).click(); await expect(page.getByRole('alert')).toContainText('valid phone'); expect(posts).toBe(0);
    await page.getByLabel('Phone number').fill('9876543210');
    await page.waitForTimeout(1600);
    await page.getByRole('button', { name: /Call Me Back/ }).click();
    await expect(page.getByRole('button', { name: 'Sending…' })).toBeDisabled();
    await dialog.locator('form').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await expect(page.getByRole('alert')).toContainText('Please retry shortly'); await expect(page.getByText('Thank you!')).toHaveCount(0);
    expect(posts).toBe(1);
    fail = false;
    await page.getByRole('button', { name: /Retry — Call Me Back/ }).click();
    await expect(page.getByRole('status')).toHaveText('Thank you! Our team will contact you shortly.'); expect(posts).toBe(2); expect(keys[0]).toBe(keys[1]);
    await page.getByRole('button', { name: 'Close callback popup' }).click(); await expect(dialog).not.toBeVisible();
    // A future cookie banner must move the launcher above its controls.
    await page.evaluate(() => { const banner = document.createElement('div'); banner.id = 'cookie-banner'; banner.style.cssText = 'position:fixed;bottom:0;left:0;width:100%;height:150px;background:white'; document.getElementById('root')!.append(banner); });
    await expect.poll(async () => (await launcher.boundingBox())!.y + (await launcher.boundingBox())!.height).toBeLessThan(viewport.height - 150);
  });
}
test('services endpoint failure offers retry', async ({ page }) => {
  let fail = true;
  await page.route('**/callback/services', route => route.fulfill({ status: fail ? 503 : 200, json: fail ? {} : { services: ['Order Support'] } }));
  await page.goto('/'); await page.getByRole('button', { name: 'Request a callback', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Call Me Back', exact: true })).toBeDisabled();
  fail = false; await page.getByRole('button', { name: 'Retry loading services' }).click();
  await expect(page.getByLabel('Service required')).toContainText('Order Support');
});
