import { expect, test } from '@playwright/test';

const TEST_EMAIL = `e2e_${Date.now()}@test.infraege.ru`;
const TEST_PASSWORD = 'TestPass1!';

test.describe('auth flow', () => {
	test('register page renders split layout and step indicator', async ({ page }) => {
		await page.goto('/register');
		await expect(page.getByRole('heading', { name: /Создай аккаунт/i })).toBeVisible();
		await expect(page.getByText(/ШАГ 1/)).toBeVisible();
	});

	test('register shows password strength meter on input', async ({ page }) => {
		await page.goto('/register');
		await page.waitForLoadState('networkidle');
		const passwordInput = page.locator('#register-password');
		await passwordInput.fill('weakpass');
		await expect(page.getByText(/слабый|средний|хороший|надёжный/)).toBeVisible();
	});

	test('register blocks submission without 152-FZ consent', async ({ page }) => {
		await page.goto('/register');
		await page.waitForLoadState('networkidle');
		await page.getByLabel('Email').fill(TEST_EMAIL);
		await page.locator('#register-password').fill(TEST_PASSWORD);
		await page.getByRole('button', { name: 'Создать аккаунт' }).click();
		await expect(page.getByText(/Согласие обязательно/)).toBeVisible();
	});

	test('login page renders split layout and shows guest CTA', async ({ page }) => {
		await page.goto('/login');
		await expect(page.getByRole('heading', { name: /возвращением/i })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Решать как гость' })).toBeVisible();
	});

	test('login page has show/hide password toggle', async ({ page }) => {
		await page.goto('/login');
		await page.waitForLoadState('networkidle');
		const passwordInput = page.locator('#login-password');
		await passwordInput.fill('mypassword');
		await expect(passwordInput).toHaveAttribute('type', 'password');
		await page.getByRole('button', { name: /показать пароль/i }).click();
		await expect(passwordInput).toHaveAttribute('type', 'text');
	});

	test('login with wrong credentials shows error', async ({ page }) => {
		await page.goto('/login');
		await page.waitForLoadState('networkidle');
		await page.getByLabel('Email').fill('nobody@nowhere.com');
		await page.locator('#login-password').fill('wrongpassword');
		// Verify fields are stable before submitting (guards against Vite HMR reloads under parallel load)
		await expect(page.locator('#login-password')).toHaveValue('wrongpassword');
		await page.getByRole('button', { name: 'Войти' }).click();
		await expect(page.getByText(/Не удалось войти/)).toBeVisible();
	});

	test('login page has register link and vice versa', async ({ page }) => {
		await page.goto('/login');
		await page.getByRole('link', { name: 'Создать' }).first().click();
		await expect(page).toHaveURL(/\/register/);

		await page.getByRole('link', { name: 'Войти' }).first().click();
		await expect(page).toHaveURL(/\/login/);
	});
});
