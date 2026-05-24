import { describe, expect, it } from 'vitest';

import { normalizeApiBaseUrl } from '@shared/config/env';

describe('normalizeApiBaseUrl', () => {
	it('keeps root API base URLs', () => {
		expect(normalizeApiBaseUrl('https://example.com')).toBe('https://example.com/');
	});

	it('strips legacy /api/v1 suffixes from base URLs', () => {
		expect(normalizeApiBaseUrl('https://example.com/api/v1')).toBe('https://example.com/');
		expect(normalizeApiBaseUrl('https://example.com/api/v1/')).toBe('https://example.com/');
	});

	it('throws for invalid URLs', () => {
		expect(() => normalizeApiBaseUrl('not a url')).toThrow('Invalid API base URL value');
	});
});
