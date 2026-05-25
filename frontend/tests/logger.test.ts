import { afterEach, describe, expect, it, vi } from 'vitest';

import { logger } from '@shared/lib/logger';

describe('logger', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('writes debug logs in the test dev runtime', () => {
		const debug = vi.spyOn(console, 'debug').mockImplementation(() => undefined);

		expect(() => logger.debug('debug message', { ok: true })).not.toThrow();
		expect(debug).toHaveBeenCalledWith('debug message', { ok: true });
	});

	it('does not throw when console methods fail', () => {
		vi.spyOn(console, 'error').mockImplementation(() => {
			throw new Error('console unavailable');
		});

		expect(() => logger.error('message')).not.toThrow();
	});
});
