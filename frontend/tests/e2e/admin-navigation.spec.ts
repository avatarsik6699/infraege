import { expect, test, type Page } from '@playwright/test';

async function mockAdminSession(page: Page) {
	await page.route('**/api/v1/public/events/pageview', async route => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ ok: true }),
		});
	});

	await page.route('**/api/v1/public/auth/me', async route => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				id: '11111111-0000-0000-0000-000000000007',
				email: 'admin@example.com',
				role: 'admin',
				is_active: true,
				consent_152fz: true,
				consent_at: null,
				created_at: '2026-05-01T00:00:00Z',
				updated_at: '2026-05-01T00:00:00Z',
			}),
		});
	});

	await page.route('**/api/v1/admin/feedback**', async route => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ items: [], total: 0, page: 1, per_page: 20 }),
		});
	});

	await page.route('**/api/v1/health/detailed', async route => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				db: 'ok',
				redis: 'ok',
				disk: { used_gb: 12.3, free_gb: 87.7, pct: 12 },
			}),
		});
	});

	await page.route('**/api/v1/admin/analytics/pageviews', async route => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				top_pages: [{ path: '/topics', views: 14 }],
				daily: [{ date: '2026-05-29', views: 14 }],
			}),
		});
	});

	await page.addInitScript(() => {
		window.localStorage.setItem(
			'infraege.auth-tokens',
			JSON.stringify({
				version: 1,
				value: {
					access_token: 'fake-admin-access-token',
					refresh_token: 'fake-admin-refresh-token',
					token_type: 'bearer',
				},
			})
		);
	});
}

test.describe('admin navigation', () => {
	test('admin can reach phase 07 admin pages from the admin area', async ({ page }) => {
		await mockAdminSession(page);

		await page.goto('/admin/feedback');
		await expect(page.getByRole('heading', { name: 'Обратная связь' })).toBeVisible();

		await page.getByRole('navigation', { name: 'Администрирование' }).getByRole('link', { name: 'Статус' }).click();
		await expect(page).toHaveURL(/\/admin\/status$/);
		await expect(page.getByRole('heading', { name: 'Состояние системы' })).toBeVisible();
		await expect(page.getByRole('status', { name: /База данных: ok/ })).toBeVisible();

		await page.getByRole('navigation', { name: 'Администрирование' }).getByRole('link', { name: 'Аналитика' }).click();
		await expect(page).toHaveURL(/\/admin\/analytics$/);
		await expect(page.getByRole('heading', { name: 'Аналитика просмотров' })).toBeVisible();
		await expect(page.getByRole('table', { name: 'Топ страниц' })).toBeVisible();

		await page
			.getByRole('navigation', { name: 'Администрирование' })
			.getByRole('link', { name: 'Обратная связь' })
			.click();
		await expect(page).toHaveURL(/\/admin\/feedback$/);
		await expect(page.getByRole('heading', { name: 'Обратная связь' })).toBeVisible();
	});
});
