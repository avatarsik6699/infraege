import { expect, test } from '@playwright/test';

const taskId = '11111111-1111-1111-1111-111111111111';
const itemId = '22222222-2222-2222-2222-222222222222';

test.beforeEach(async ({ page }) => {
	await page.route(/\/api\/v1\/public\/practice\/.+$/, async route => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify([
				{
					id: itemId,
					taskId,
					taskSlug: 'ege-01',
					taskTitle: 'Задание 1',
					egeNumber: 1,
					position: 1,
					year: 2024,
					promptHtml: '<p>Сколько будет 40 + 2?</p>',
					codeBlock: { language: 'python', title: 'demo.py', code: 'print(40 + 2)' },
				},
			]),
		});
	});

	await page.route(/\/api\/v1\/public\/validate$/, async route => {
		const body = route.request().postDataJSON() as { answer?: string };
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				correct: body.answer?.trim() === '42',
				expectedValue: '42',
				explanationHtml: '<p>40 + 2 = 42.</p>',
			}),
		});
	});
});

test('practice trainer validates answers and persists guest progress', async ({ page }) => {
	await page.goto(`/practice/${taskId}`);

	await expect(page.getByRole('heading', { name: 'Задание 1' })).toBeVisible();
	await expect(page.getByText('Сколько будет 40 + 2?')).toBeVisible();
	await page.getByPlaceholder('Введите краткий ответ').fill('42');
	await page.getByRole('button', { name: 'Проверить' }).click();

	await expect(page.getByText('Верно')).toBeVisible();
	await expect(page.getByText('Решено 1 из 1')).toBeVisible();

	await page.reload();
	await expect(page.getByText('Решено 1 из 1')).toBeVisible();
});

test('practice trainer fits mobile and desktop controls without horizontal overflow', async ({ page }) => {
	for (const viewport of [
		{ width: 390, height: 844 },
		{ width: 1440, height: 900 },
	]) {
		await page.setViewportSize(viewport);
		await page.goto(`/practice/${taskId}`);
		await expect(page.getByRole('heading', { name: 'Задание 1' })).toBeVisible();

		const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
		expect(hasHorizontalOverflow).toBe(false);

		for (const button of await page.getByRole('button').all()) {
			const box = await button.boundingBox();
			expect(box?.width ?? 0).toBeGreaterThan(20);
			expect(box?.height ?? 0).toBeGreaterThan(20);
		}
	}
});
