import { expect, test } from '@playwright/test';

test('home SSR HTML exposes SEO metadata', async ({ request }) => {
	const response = await request.get('/');
	const html = await response.text();

	expect(response.ok()).toBe(true);
	expect(html).toContain('<title>Template App</title>');
	expect(html).toContain('name="description"');
	expect(html).toContain('rel="canonical"');
	expect(html).toContain('property="og:title"');
});

for (const path of ['/login', '/register', '/dashboard']) {
	test(`${path} is marked noindex in SSR HTML`, async ({ request }) => {
		const response = await request.get(path);
		const html = await response.text();

		expect(response.ok()).toBe(true);
		expect(html).toContain('name="robots"');
		expect(html).toContain('noindex,nofollow');
	});
}

test('html lang updates after language switch', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	await page.getByRole('button', { name: 'RU' }).click();
	await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
});
