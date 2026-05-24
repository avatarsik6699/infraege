import { describe, expect, it } from 'vitest';

import { shouldRedirectToLogin } from '@features/auth/use-auth-guard';

describe('shouldRedirectToLogin', () => {
	it('redirects when access token is missing or empty', () => {
		expect(shouldRedirectToLogin()).toBe(true);
		expect(shouldRedirectToLogin('')).toBe(true);
	});

	it('does not redirect when access token is present', () => {
		expect(shouldRedirectToLogin('access-token')).toBe(false);
	});
});
