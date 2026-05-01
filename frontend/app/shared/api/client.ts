import { queryClient } from '@shared/api/query-client';
import { env } from '@shared/config/env';
import { runtime } from '@shared/config/runtime';
import { jwtService } from '@shared/services/jwt-service';

type QueryValue = string | number | boolean | null | undefined;
type PathParamValue = string | number | boolean;

interface RequestOptions<TBody> {
	headers?: HeadersInit;
	signal?: AbortSignal;
	body?: TBody;
	rawBody?: BodyInit;
	query?: Record<string, QueryValue>;
	params?: {
		query?: Record<string, QueryValue>;
		path?: Record<string, PathParamValue>;
	};
}

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

function buildUrl(path: string, query?: Record<string, QueryValue>, pathParams?: Record<string, PathParamValue>): string {
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

async function request<TResponse, TBody = unknown>(
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
	path: string,
	options: RequestOptions<TBody> = {}
): Promise<TResponse> {
	const headers = new Headers(options.headers);
	const token = jwtService.readAccessToken(queryClient);
	if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
	if (options.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

	const requestBody = options.rawBody ?? (options.body === undefined ? undefined : JSON.stringify(options.body));
	const query = options.query ?? options.params?.query;
	const pathParams = options.params?.path;

	const response = await fetch(buildUrl(path, query, pathParams), {
		method,
		headers,
		body: requestBody,
		signal: options.signal,
	});

	if (!response.ok) {
		let detail: unknown;
		try {
			detail = await response.json();
		} catch {
			detail = await response.text();
		}
		throw new ApiError(response.status, detail, response.headers.get('X-Request-ID') ?? undefined);
	}

	if (response.status === 204) return undefined as TResponse;
	return (await response.json()) as TResponse;
}

export const api = {
	get: <TResponse = unknown>(path: string, options?: Omit<RequestOptions<never>, 'body' | 'rawBody'>) => request<TResponse>('GET', path, options),
	post: <TResponse = unknown, TBody = unknown>(path: string, options: RequestOptions<TBody>) => request<TResponse, TBody>('POST', path, options),
	postForm: <TResponse = unknown>(path: string, options: { formData: FormData; signal?: AbortSignal; headers?: HeadersInit; params?: RequestOptions<never>['params'] }) =>
		request<TResponse>('POST', path, { ...options, rawBody: options.formData }),
	put: <TResponse = unknown, TBody = unknown>(path: string, options: RequestOptions<TBody>) => request<TResponse, TBody>('PUT', path, options),
	patch: <TResponse = unknown, TBody = unknown>(path: string, options: RequestOptions<TBody>) => request<TResponse, TBody>('PATCH', path, options),
	delete: <TResponse = unknown>(path: string, options?: Omit<RequestOptions<never>, 'body' | 'rawBody'>) => request<TResponse>('DELETE', path, options),
};
