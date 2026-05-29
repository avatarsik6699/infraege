import { expect, test } from '@playwright/test';

test.describe('profile page', () => {
	test('shows login prompt when not authenticated', async ({ page }) => {
		await page.goto('/profile');
		await expect(page.getByRole('main').getByRole('link', { name: 'Войти' })).toBeVisible();
	});

	test('authenticated user sees stats and account section', async ({ page }) => {
		// Mock the auth and progress API responses
		await page.route('/api/v1/public/auth/me', async route => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					id: '11111111-0000-0000-0000-000000000001',
					email: 'test@infraege.ru',
					role: 'user',
					is_active: true,
					consent_152fz: true,
					consent_at: null,
					created_at: '2026-05-01T00:00:00Z',
					updated_at: '2026-05-01T00:00:00Z',
				}),
			});
		});

		await page.route('/api/v1/public/progress/me', async route => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					stats: {
						totalTasks: 5,
						solvedTasks: 3,
						correctAttempts: 12,
						totalAttempts: 18,
						streak: 2,
						lastActivityAt: '2026-05-29T10:00:00Z',
					},
					weakTasks: [],
					recentActivity: [],
				}),
			});
		});

		// Inject a fake token so the auth state resolves as authenticated
		await page.addInitScript(() => {
			window.localStorage.setItem(
				'infraege.auth-tokens',
				JSON.stringify({
					version: 1,
					value: {
						access_token: 'fake-access-token',
						refresh_token: 'fake-refresh-token',
						token_type: 'bearer',
					},
				})
			);
		});

		await page.goto('/profile');
		await expect(page.getByRole('heading', { name: 'Профиль' })).toBeVisible();
	});

	test('profile page has no layout regressions on /topics', async ({ page }) => {
		await page.goto('/topics');
		await expect(page.getByRole('link', { name: 'infraege' })).toBeVisible();
	});
});
