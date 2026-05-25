import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ApiError } from '@shared/api/client';
import { api } from '@shared/api/client';
import { authQueryKeys } from '@shared/api/keys';
import { queryClient } from '@shared/api/query-client';
import { isNonNil } from '@shared/lib/type-guards';
import { jwtService } from '@shared/services/jwt-service';
import type { components } from '@shared/types/schema';

type TokenPair = components['schemas']['TokenPair'];

const STORAGE_KEY = 'template_app.auth.token';

const expiredTokens = {
	access_token: 'expired-access',
	refresh_token: 'refresh-token',
	token_type: 'bearer',
} satisfies TokenPair;

const refreshedTokens = {
	access_token: 'fresh-access',
	refresh_token: 'fresh-refresh',
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

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
	const headers = new Headers(init.headers);
	if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
	return new Response(JSON.stringify(body), { ...init, headers });
}

function textResponse(body: string, init: ResponseInit = {}): Response {
	return new Response(body, init);
}

function readRequestInit(callIndex: number): RequestInit {
	const init = fetchMock.mock.calls[callIndex]?.[1];
	if (!isNonNil(init)) throw new Error(`Missing fetch init for call ${callIndex}`);
	return init;
}

function readRequestHeaders(callIndex: number): Headers {
	return readRequestInit(callIndex).headers as Headers;
}

let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;
let storage: Storage;

describe('api client', () => {
	beforeEach(() => {
		queryClient.clear();
		storage = createStorage();
		vi.stubGlobal('window', { localStorage: storage });
		fetchMock = vi.fn<typeof fetch>();
		vi.stubGlobal('fetch', fetchMock);
	});

	afterEach(() => {
		queryClient.clear();
		vi.unstubAllGlobals();
	});

	it('builds URLs with query params and returns JSON', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ status: 'ok', db: 'connected' }));

		await expect(
			api.get('/api/v1/health', {
				query: { search: 'one two', page: 2, active: true, skip: null, omit: undefined },
			})
		).resolves.toEqual({ status: 'ok', db: 'connected' });

		const url = new URL(fetchMock.mock.calls[0]?.[0] as string);
		expect(url.toString()).toBe('http://localhost:8000/api/v1/health?search=one+two&page=2&active=true');
		expect(readRequestInit(0).method).toBe('GET');
	});

	it('serializes JSON bodies and sets Content-Type', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse(refreshedTokens));

		await api.post('/api/v1/public/auth/login', {
			body: { email: 'admin@example.com', password: 'changeme123' },
		});

		expect(readRequestInit(0).method).toBe('POST');
		expect(readRequestHeaders(0).get('Content-Type')).toBe('application/json');
		expect(readRequestInit(0).body).toBe(JSON.stringify({ email: 'admin@example.com', password: 'changeme123' }));
	});

	it('adds cached access token without overwriting caller Authorization', async () => {
		jwtService.set(queryClient, expiredTokens);
		fetchMock.mockResolvedValueOnce(jsonResponse({ status: 'ok', db: 'connected' }));
		await api.get('/api/v1/health', { headers: { Authorization: 'Bearer custom-token' } });
		expect(readRequestHeaders(0).get('Authorization')).toBe('Bearer custom-token');
	});

	it('returns undefined for 204 responses', async () => {
		fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
		await expect(api.delete('/api/v1/public/auth/me')).resolves.toBeUndefined();
	});

	it('throws ApiError with parsed detail and request id', async () => {
		fetchMock.mockResolvedValueOnce(
			jsonResponse({ detail: 'Forbidden' }, { status: 403, headers: { 'X-Request-ID': 'request-1' } })
		);

		await expect(api.get('/api/v1/public/auth/me')).rejects.toMatchObject({
			status: 403,
			detail: { detail: 'Forbidden' },
			requestId: 'request-1',
		} satisfies Partial<ApiError>);
	});

	it('throws ApiError with text detail when response is not JSON', async () => {
		fetchMock.mockResolvedValueOnce(textResponse('Service unavailable', { status: 503 }));
		await expect(api.get('/api/v1/health')).rejects.toMatchObject({ status: 503, detail: 'Service unavailable' });
	});

	it('refreshes tokens on 401, persists them, and retries with new access token', async () => {
		jwtService.set(queryClient, expiredTokens);
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ detail: 'Expired' }, { status: 401 }))
			.mockResolvedValueOnce(jsonResponse(refreshedTokens))
			.mockResolvedValueOnce(jsonResponse({ id: 'user-1', role: 'user' }));

		await expect(api.get('/api/v1/public/auth/me')).resolves.toEqual({ id: 'user-1', role: 'user' });

		expect(fetchMock).toHaveBeenCalledTimes(3);
		expect(fetchMock.mock.calls[1]?.[0]).toBe('http://localhost:8000/api/v1/public/auth/refresh');
		expect(readRequestInit(1).body).toBe(JSON.stringify({ refresh_token: 'refresh-token' }));
		expect(readRequestHeaders(2).get('Authorization')).toBe('Bearer fresh-access');
		expect(queryClient.getQueryData(authQueryKeys.token)).toEqual(refreshedTokens);
		expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}')).toEqual({ version: 1, data: refreshedTokens });
	});

	it('uses a single refresh request for parallel 401 responses', async () => {
		jwtService.set(queryClient, expiredTokens);
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ detail: 'Expired' }, { status: 401 }))
			.mockResolvedValueOnce(jsonResponse({ detail: 'Expired' }, { status: 401 }))
			.mockResolvedValueOnce(jsonResponse(refreshedTokens))
			.mockResolvedValueOnce(jsonResponse({ status: 'ok', db: 'connected' }))
			.mockResolvedValueOnce(jsonResponse({ id: 'user-1', role: 'user' }));

		await expect(Promise.all([api.get('/api/v1/health'), api.get('/api/v1/public/auth/me')])).resolves.toEqual([
			{ status: 'ok', db: 'connected' },
			{ id: 'user-1', role: 'user' },
		]);

		const refreshCalls = fetchMock.mock.calls.filter(
			([url]) => url === 'http://localhost:8000/api/v1/public/auth/refresh'
		);
		expect(refreshCalls).toHaveLength(1);
		expect(readRequestHeaders(3).get('Authorization')).toBe('Bearer fresh-access');
		expect(readRequestHeaders(4).get('Authorization')).toBe('Bearer fresh-access');
	});

	it('clears tokens and propagates the original 401 when refresh fails', async () => {
		jwtService.set(queryClient, expiredTokens);
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ detail: 'Expired' }, { status: 401 }))
			.mockResolvedValueOnce(jsonResponse({ detail: 'Invalid refresh' }, { status: 401 }));

		await expect(api.get('/api/v1/public/auth/me')).rejects.toMatchObject({ status: 401 });
		expect(queryClient.getQueryData(authQueryKeys.token)).toBeNull();
		expect(storage.getItem(STORAGE_KEY)).toBeNull();
	});
});
