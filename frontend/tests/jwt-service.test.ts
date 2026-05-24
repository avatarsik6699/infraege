import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { authQueryKeys } from '@shared/api/keys';
import { createQueryClient } from '@shared/api/query-client';
import { jwtService } from '@shared/services/jwt-service';
import type { components } from '@shared/types/schema';

type TokenPair = components['schemas']['TokenPair'];

const tokens = {
	access_token: 'access',
	refresh_token: 'refresh',
	token_type: 'bearer',
} satisfies TokenPair;

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

describe('jwtService', () => {
	beforeEach(() => {
		vi.stubGlobal('window', { localStorage: createStorage() });
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('persists tokens and hydrates query cache', () => {
		const queryClient = createQueryClient();
		jwtService.set(queryClient, tokens);

		const hydratedClient = createQueryClient();
		jwtService.hydrate(hydratedClient);

		expect(hydratedClient.getQueryData(authQueryKeys.token)).toEqual(tokens);
		expect(jwtService.readAccessToken(queryClient)).toBe('access');
	});

	it('clears tokens from cache and storage', () => {
		const queryClient = createQueryClient();
		jwtService.set(queryClient, tokens);
		jwtService.set(queryClient, null);

		expect(queryClient.getQueryData(authQueryKeys.token)).toBeNull();
		expect(jwtService.read()).toBeNull();
	});
});
