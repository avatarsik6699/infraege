import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { guestProgressStore } from '@features/guest-progress/guest-progress-store';

class MemoryStorage implements Storage {
	private values = new Map<string, string>();

	get length(): number {
		return this.values.size;
	}

	clear(): void {
		this.values.clear();
	}

	getItem(key: string): string | null {
		return this.values.get(key) ?? null;
	}

	key(index: number): string | null {
		return [...this.values.keys()][index] ?? null;
	}

	removeItem(key: string): void {
		this.values.delete(key);
	}

	setItem(key: string, value: string): void {
		this.values.set(key, value);
	}
}

let storage: MemoryStorage;

describe('guest progress store', () => {
	beforeEach(() => {
		storage = new MemoryStorage();
		vi.stubGlobal('window', { localStorage: storage });
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('persists attempts, streak, solved state, and attempt counts', () => {
		const first = guestProgressStore.recordAttempt({
			itemId: 'item-1',
			taskId: 'task-1',
			answer: '41',
			isCorrect: false,
			answeredAt: '2026-05-28T10:00:00.000Z',
		});
		const second = guestProgressStore.recordAttempt({
			itemId: 'item-1',
			taskId: 'task-1',
			answer: '42',
			isCorrect: true,
			answeredAt: '2026-05-28T10:01:00.000Z',
		});

		expect(first.streak).toBe(0);
		expect(second.streak).toBe(1);
		expect(second.attempts['item-1']).toMatchObject({
			answer: '42',
			isCorrect: true,
			attemptsCount: 2,
		});
		expect(guestProgressStore.read()).toEqual(second);
		expect(guestProgressStore.isItemSolved('item-1')).toBe(true);
		expect(guestProgressStore.getSolvedCount(['item-1', 'item-2'])).toBe(1);
	});

	it('uses migration-safe reads for invalid or old data', () => {
		storage.setItem(guestProgressStore.key, JSON.stringify({ version: 0, data: { stale: true } }));

		const state = guestProgressStore.read();

		expect(state.version).toBe(1);
		expect(state.attempts).toEqual({});
		expect(storage.getItem(guestProgressStore.key)).toBeNull();
	});

	it('notifies subscribers after writes and clears', () => {
		const listener = vi.fn();
		const unsubscribe = guestProgressStore.subscribe(listener);

		guestProgressStore.recordAttempt({
			itemId: 'item-1',
			taskId: 'task-1',
			answer: '42',
			isCorrect: true,
			answeredAt: '2026-05-28T10:01:00.000Z',
		});
		guestProgressStore.clear();
		unsubscribe();
		guestProgressStore.reset();

		expect(listener).toHaveBeenCalledTimes(2);
	});
});
