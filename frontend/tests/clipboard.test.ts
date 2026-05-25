import { afterEach, describe, expect, it, vi } from 'vitest';

import { clipboard } from '@shared/lib/clipboard';

describe('clipboard', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('writes text when the clipboard API is available', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		vi.stubGlobal('navigator', { clipboard: { writeText } });

		await expect(clipboard.writeText('token')).resolves.toBe(true);
		expect(writeText).toHaveBeenCalledWith('token');
	});

	it('returns false when clipboard is unavailable or rejects', async () => {
		vi.stubGlobal('navigator', {});
		await expect(clipboard.writeText('token')).resolves.toBe(false);

		vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
		await expect(clipboard.writeText('token')).resolves.toBe(false);
	});
});
