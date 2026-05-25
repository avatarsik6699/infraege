import { afterEach, describe, expect, it, vi } from 'vitest';

import { timers } from '@shared/lib/timers';

describe('timers', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns null when window timers are unavailable', () => {
		vi.stubGlobal('window', undefined);

		expect(timers.setTimeout(() => undefined)).toBeNull();
		expect(timers.setInterval(() => undefined)).toBeNull();
		expect(timers.requestAnimationFrame(() => undefined)).toBeNull();
		expect(() => timers.clearTimeout(null)).not.toThrow();
		expect(() => timers.clearInterval(null)).not.toThrow();
		expect(() => timers.cancelAnimationFrame(null)).not.toThrow();
	});

	it('delegates to browser timer APIs', () => {
		const windowRef = {
			setTimeout: vi.fn(() => 1),
			clearTimeout: vi.fn(),
			setInterval: vi.fn(() => 2),
			clearInterval: vi.fn(),
			requestAnimationFrame: vi.fn(() => 3),
			cancelAnimationFrame: vi.fn(),
		} as unknown as Window;

		vi.stubGlobal('window', windowRef);

		expect(timers.setTimeout(() => undefined, 10)).toBe(1);
		timers.clearTimeout(1);
		expect(timers.setInterval(() => undefined, 20)).toBe(2);
		timers.clearInterval(2);
		expect(timers.requestAnimationFrame(() => undefined)).toBe(3);
		timers.cancelAnimationFrame(3);

		expect(windowRef.setTimeout).toHaveBeenCalled();
		expect(windowRef.clearTimeout).toHaveBeenCalledWith(1);
		expect(windowRef.setInterval).toHaveBeenCalled();
		expect(windowRef.clearInterval).toHaveBeenCalledWith(2);
		expect(windowRef.requestAnimationFrame).toHaveBeenCalled();
		expect(windowRef.cancelAnimationFrame).toHaveBeenCalledWith(3);
	});
});
