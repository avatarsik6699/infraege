import { expect, test } from '@playwright/test';

test('home SSR HTML exposes SEO metadata', async ({ request }) => {
	const response = await request.get('/');
	const html = await response.text();

	expect(response.ok()).toBe(true);
	expect(html).toContain('<title>infraege</title>');
	expect(html).toContain('<html lang="ru"');
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
