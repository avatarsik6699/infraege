import type { QueryClient } from '@tanstack/react-query';

import { authQueryKeys } from '@shared/api/keys';
import { safeLs, type SafeLsTypes } from '@shared/lib/safe-ls';
import { isNonNil, isRecord, isString } from '@shared/lib/type-guards';
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
		if (isNonNil(token)) {
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
	if (!isRecord(value)) {
		return false;
	}

	return isString(value.access_token) && isString(value.refresh_token) && value.token_type === 'bearer';
}
