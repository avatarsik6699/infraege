import { queryClient } from '@shared/api/query-client';
import { env } from '@shared/config/env';
import { runtime } from '@shared/config/runtime';
import { jwtService } from '@shared/services/jwt-service';
import type { components, paths } from '@shared/types/schema';

type TokenPair = components['schemas']['TokenPair'];

const REFRESH_PATH = '/api/v1/public/auth/refresh';

let refreshPromise: Promise<TokenPair | null> | null = null;

type QueryValue = string | number | boolean | null | undefined;
type PathParamValue = string | number | boolean;

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
type ApiPath = keyof paths;

type PathsWithMethod<M extends HttpMethod> = {
	[P in ApiPath]: M extends keyof paths[P] ? P : never;
}[ApiPath];

type RequestBody<P extends ApiPath, M extends HttpMethod> = M extends keyof paths[P]
	? paths[P][M] extends { requestBody: { content: { 'application/json': infer B } } }
		? B
		: never
	: never;

type SuccessResponse<P extends ApiPath, M extends HttpMethod> = M extends keyof paths[P]
	? paths[P][M] extends { responses: infer R }
		? R extends { 200: { content: { 'application/json': infer T } } }
			? T
			: R extends { 201: { content: { 'application/json': infer T } } }
				? T
				: R extends { 204: unknown }
					? undefined
					: never
		: never
	: never;

type RequestOptions<TBody> = {
	headers?: HeadersInit;
	signal?: AbortSignal;
	body?: TBody;
	rawBody?: BodyInit;
	query?: Record<string, QueryValue>;
	params?: {
		query?: Record<string, QueryValue>;
		path?: Record<string, PathParamValue>;
	};
};

export class ApiError extends Error {
	status: number;
	detail: unknown;
	requestId?: string;

	constructor(status: number, detail: unknown, requestId?: string) {
		super(typeof detail === 'string' ? detail : 'API request failed');
		this.status = status;
		this.detail = detail;
		this.requestId = requestId;
	}
}

function getApiBaseUrl(): string {
	return runtime.isServer ? env.server.apiBaseUrl : env.client.apiBaseUrl;
}

function resolvePath(path: string, pathParams?: Record<string, PathParamValue>): string {
	if (!pathParams) return path;
	return path.replace(/\{([^}]+)\}/g, (_match, rawName: string) => {
		const name = rawName.trim();
		const value = pathParams[name];
		if (value === undefined || value === null) throw new Error(`Missing path param: ${name}`);
		return encodeURIComponent(String(value));
	});
}

function buildUrl(
	path: string,
	query?: Record<string, QueryValue>,
	pathParams?: Record<string, PathParamValue>
): string {
	const apiBaseUrl = getApiBaseUrl();
	const normalizedBase = apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`;
	const resolvedPath = resolvePath(path, pathParams);
	const normalizedPath = resolvedPath.startsWith('/') ? resolvedPath.slice(1) : resolvedPath;
	const url = new URL(normalizedPath, normalizedBase);

	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
		}
	}
	return url.toString();
}

async function readErrorDetail(response: Response): Promise<unknown> {
	try {
		return await response.clone().json();
	} catch {
		return response.text();
	}
}

async function attemptRefresh(): Promise<TokenPair | null> {
	if (refreshPromise !== null) return refreshPromise;

	refreshPromise = (async () => {
		const current = jwtService.read();
		if (!current?.refresh_token) return null;

		try {
			const response = await fetch(buildUrl(REFRESH_PATH), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refresh_token: current.refresh_token }), // HTTP body, not storage.
			});

			if (!response.ok) {
				jwtService.set(queryClient, null);
				return null;
			}

			const tokens = (await response.json()) as TokenPair;
			jwtService.set(queryClient, tokens);
			return tokens;
		} catch {
			jwtService.set(queryClient, null);
			return null;
		}
	})().finally(() => {
		refreshPromise = null;
	});

	return refreshPromise;
}

async function request<TResponse, TBody = unknown>(
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
	path: string,
	options: RequestOptions<TBody> = {}
): Promise<TResponse> {
	const headers = new Headers(options.headers);
	const token = jwtService.readAccessToken(queryClient);
	if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
	if (options.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

	const requestBody = options.rawBody ?? (options.body === undefined ? undefined : JSON.stringify(options.body)); // HTTP body, not storage.
	const query = options.query ?? options.params?.query;
	const pathParams = options.params?.path;

	const response = await fetch(buildUrl(path, query, pathParams), {
		method,
		headers,
		body: requestBody,
		signal: options.signal,
	});

	if (!response.ok) {
		if (response.status === 401 && path !== REFRESH_PATH) {
			const tokens = await attemptRefresh();
			if (tokens) {
				const retryHeaders = new Headers(options.headers);
				retryHeaders.set('Authorization', `Bearer ${tokens.access_token}`);
				if (options.body !== undefined && !retryHeaders.has('Content-Type')) {
					retryHeaders.set('Content-Type', 'application/json');
				}

				const retryResponse = await fetch(buildUrl(path, query, pathParams), {
					method,
					headers: retryHeaders,
					body: requestBody,
					signal: options.signal,
				});

				if (!retryResponse.ok) {
					const retryDetail = await readErrorDetail(retryResponse);
					throw new ApiError(retryResponse.status, retryDetail, retryResponse.headers.get('X-Request-ID') ?? undefined);
				}

				if (retryResponse.status === 204) return undefined as TResponse;
				return (await retryResponse.json()) as TResponse;
			}
		}

		const detail = await readErrorDetail(response);
		throw new ApiError(response.status, detail, response.headers.get('X-Request-ID') ?? undefined);
	}

	if (response.status === 204) return undefined as TResponse;
	return (await response.json()) as TResponse;
}

export const api = {
	get: <P extends PathsWithMethod<'get'>>(path: P, options?: Omit<RequestOptions<never>, 'body' | 'rawBody'>) =>
		request<SuccessResponse<P, 'get'>>('GET', path, options),

	post: <P extends PathsWithMethod<'post'>>(path: P, options: RequestOptions<RequestBody<P, 'post'>>) =>
		request<SuccessResponse<P, 'post'>, RequestBody<P, 'post'>>('POST', path, options),

	postForm: <TResponse = unknown>(
		path: string,
		options: {
			formData: FormData;
			signal?: AbortSignal;
			headers?: HeadersInit;
			params?: RequestOptions<never>['params'];
		}
	) => request<TResponse>('POST', path, { ...options, rawBody: options.formData }),

	put: <P extends PathsWithMethod<'put'>>(path: P, options: RequestOptions<RequestBody<P, 'put'>>) =>
		request<SuccessResponse<P, 'put'>, RequestBody<P, 'put'>>('PUT', path, options),

	patch: <P extends PathsWithMethod<'patch'>>(path: P, options: RequestOptions<RequestBody<P, 'patch'>>) =>
		request<SuccessResponse<P, 'patch'>, RequestBody<P, 'patch'>>('PATCH', path, options),

	delete: <P extends PathsWithMethod<'delete'>>(path: P, options?: Omit<RequestOptions<never>, 'body' | 'rawBody'>) =>
		request<SuccessResponse<P, 'delete'>>('DELETE', path, options),
};
