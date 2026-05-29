import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginForm } from '@features/auth/login-form';
import { RegisterForm } from '@features/auth/register-form';
import { computePasswordStrength } from '@shared/ui/password-strength';

class MemoryStorage implements Storage {
	private values = new Map<string, string>();
	get length() { return this.values.size; }
	clear() { this.values.clear(); }
	getItem(key: string) { return this.values.get(key) ?? null; }
	key(index: number) { return [...this.values.keys()][index] ?? null; }
	removeItem(key: string) { this.values.delete(key); }
	setItem(key: string, value: string) { this.values.set(key, value); }
}

function wrapWithDataRouter(element: React.ReactElement): string {
	const router = createMemoryRouter([
		{ path: '/', element: <QueryClientProvider client={new QueryClient()}>{element}</QueryClientProvider> },
		{ path: '/register', element: null },
		{ path: '/topics', element: null },
		{ path: '/login', element: null },
		{ path: '/profile', element: null },
	]);
	return renderToStaticMarkup(<RouterProvider router={router} />);
}

describe('LoginForm', () => {
	beforeEach(() => {
		vi.stubGlobal('window', { localStorage: new MemoryStorage() });
	});
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('renders email, password, remember-me, and guest link', () => {
		const html = wrapWithDataRouter(<LoginForm />);
		expect(html).toContain('login-email');
		expect(html).toContain('login-password');
		expect(html).toContain('Запомнить меня');
		expect(html).toContain('Решать как гость');
	});

	it('renders registration link', () => {
		const html = wrapWithDataRouter(<LoginForm />);
		expect(html).toContain('/register');
	});
});

describe('RegisterForm', () => {
	beforeEach(() => {
		vi.stubGlobal('window', { localStorage: new MemoryStorage() });
	});
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('renders email, password, consent checkbox, and guest link', () => {
		const html = wrapWithDataRouter(<RegisterForm />);
		expect(html).toContain('register-email');
		expect(html).toContain('register-password');
		expect(html).toContain('152');
		expect(html).toContain('Продолжить как гость');
	});

	it('renders login link', () => {
		const html = wrapWithDataRouter(<RegisterForm />);
		expect(html).toContain('/login');
	});
});

describe('computePasswordStrength', () => {
	it('returns 0 for empty string', () => {
		expect(computePasswordStrength('')).toBe(0);
	});

	it('returns 1 for short lowercase-only', () => {
		expect(computePasswordStrength('abcdefgh')).toBe(1);
	});

	it('returns 4 for complex password', () => {
		expect(computePasswordStrength('Secure1!')).toBe(4);
	});

	it('increments score for each complexity criterion', () => {
		expect(computePasswordStrength('aaaaaaaa')).toBe(1);
		expect(computePasswordStrength('Aaaaaaaa')).toBe(2);
		expect(computePasswordStrength('Aaaaaaa1')).toBe(3);
		expect(computePasswordStrength('Aaaaaa1!')).toBe(4);
	});
});
