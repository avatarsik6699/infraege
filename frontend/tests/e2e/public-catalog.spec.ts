import { expect, test } from '@playwright/test';

test('public catalog SSR exposes indexable metadata shell', async ({ request }) => {
	const response = await request.get('/topics');
	const html = await response.text();

	expect(response.ok()).toBe(true);
	expect(html).toContain('<html lang="ru"');
	expect(html).toContain('Каталог заданий');
	expect(html).toContain('name="robots"');
	expect(html).toContain('index,follow');
});
