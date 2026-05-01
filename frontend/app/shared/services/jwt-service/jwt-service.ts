import type { QueryClient } from '@tanstack/react-query';

import { authQueryKeys } from '@shared/api/keys';
import { safeLs, type SafeLsTypes } from '@shared/lib/safe-ls';
import type { components } from '@shared/types/schema';

type TokenPair = components['schemas']['TokenPair'];

const AUTH_TOKEN_STORAGE: SafeLsTypes.Key<TokenPair> = {
	key: 'template_app.auth.token',
	version: 1,
	guard: isTokenPair,
};

export const jwtService = {
	read(): TokenPair | null {
		return safeLs.get(AUTH_TOKEN_STORAGE);
	},
	persist(token: TokenPair | null): void {
		if (token) {
			safeLs.set(AUTH_TOKEN_STORAGE, token);
		} else {
			safeLs.remove(AUTH_TOKEN_STORAGE);
		}
	},
	set(queryClient: QueryClient, token: TokenPair | null): void {
		queryClient.setQueryData(authQueryKeys.token, token);
		jwtService.persist(token);
	},
	hydrate(queryClient: QueryClient): void {
		queryClient.setQueryData(authQueryKeys.token, jwtService.read());
	},
	readAccessToken(queryClient: QueryClient): string | null {
		const token = queryClient.getQueryData<TokenPair | null>(authQueryKeys.token);
		return token?.access_token ?? null;
	},
};

export type JwtService = typeof jwtService;

function isTokenPair(value: unknown): value is TokenPair {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return false;
	}

	const token = value as Record<string, unknown>;
	return (
		typeof token.access_token === 'string' && typeof token.refresh_token === 'string' && token.token_type === 'bearer'
	);
}
