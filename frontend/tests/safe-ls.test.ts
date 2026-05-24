import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { safeLs, type SafeLsTypes } from '@shared/lib/safe-ls';

type Payload = { value: string };

const TEST_KEY: SafeLsTypes.Key<Payload> = {
	key: 'test.safe-ls.key',
	version: 1,
	guard: isPayload,
};

function isPayload(value: unknown): value is Payload {
	return (
		typeof value === 'object' &&
		value !== null &&
		'value' in value &&
		typeof (value as Record<string, unknown>).value === 'string'
	);
}

function createStorage(): Storage {
	const values = new Map<string, string>();

	return {
		get length() {
			return values.size;
		},
		clear: vi.fn(() => values.clear()),
		getItem: vi.fn((key: string) => values.get(key) ?? null),
		key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
		removeItem: vi.fn((key: string) => {
			values.delete(key);
		}),
		setItem: vi.fn((key: string, value: string) => {
			values.set(key, value);
		}),
	};
}

describe('safeLs with window storage', () => {
	let storage: Storage;

	beforeEach(() => {
		storage = createStorage();
		vi.stubGlobal('window', { localStorage: storage });
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('round-trips versioned values', () => {
		safeLs.set(TEST_KEY, { value: 'hello' });
		expect(safeLs.get(TEST_KEY)).toEqual({ value: 'hello' });
		expect(JSON.parse(storage.getItem(TEST_KEY.key) ?? '{}')).toEqual({
			version: 1,
			data: { value: 'hello' },
		});
	});

	it('removes invalid or stale values', () => {
		storage.setItem(TEST_KEY.key, JSON.stringify({ version: 99, data: { value: 'x' } }));
		expect(safeLs.get(TEST_KEY)).toBeNull();
		expect(storage.removeItem).toHaveBeenCalledWith(TEST_KEY.key);

		storage.setItem(TEST_KEY.key, '{broken json');
		expect(safeLs.get(TEST_KEY)).toBeNull();
		expect(storage.removeItem).toHaveBeenCalledWith(TEST_KEY.key);
	});
});

describe('safeLs without window', () => {
	beforeEach(() => {
		vi.unstubAllGlobals();
	});

	it('does not throw', () => {
		expect(safeLs.get(TEST_KEY)).toBeNull();
		expect(() => safeLs.set(TEST_KEY, { value: 'x' })).not.toThrow();
		expect(() => safeLs.remove(TEST_KEY)).not.toThrow();
	});
});
