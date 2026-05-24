import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { date } from '@shared/lib/date';

describe('date helper', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-05-24T10:30:00.000Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('formats dates through a shared helper', () => {
		expect(date.formatDate('2026-05-24T10:30:00.000Z', 'en-US')).toContain('May');
	});

	it('returns today as ISO date', () => {
		expect(date.todayIso()).toBe('2026-05-24');
	});
});
