import { isNonEmptyString } from '@shared/lib/type-guards';

export namespace EnvTypes {
	export type Client = {
		apiBaseUrl: string;
		appName: string;
		siteUrl: string;
	};

	export type Server = {
		apiBaseUrl: string;
	};
}

type ClientEnvSchema = {
	VITE_API_BASE_URL: string;
	VITE_PUBLIC_APP_NAME: string;
	VITE_PUBLIC_SITE_URL: string;
};

type ServerEnvSchema = {
	API_BASE_INTERNAL_URL?: string;
	API_BASE_URL?: string;
};

function readClientEnv(): ClientEnvSchema {
	const fallbackApiBaseUrl = 'http://localhost:8000';
	const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
	if (import.meta.env.PROD === true && !isNonEmptyString(configuredApiBaseUrl)) {
		throw new Error('VITE_API_BASE_URL is required for production builds');
	}

	const fallbackSiteUrl = 'http://localhost:3000';
	const configuredSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL?.trim();
	if (import.meta.env.PROD === true && !isNonEmptyString(configuredSiteUrl)) {
		throw new Error('VITE_PUBLIC_SITE_URL is required for production builds');
	}

	const configuredAppName = import.meta.env.VITE_PUBLIC_APP_NAME?.trim();

	return {
		VITE_API_BASE_URL: isNonEmptyString(configuredApiBaseUrl) ? configuredApiBaseUrl : fallbackApiBaseUrl,
		VITE_PUBLIC_APP_NAME: isNonEmptyString(configuredAppName) ? configuredAppName : 'infraege',
		VITE_PUBLIC_SITE_URL: isNonEmptyString(configuredSiteUrl) ? configuredSiteUrl : fallbackSiteUrl,
	};
}

function readServerEnv(): ServerEnvSchema {
	const nodeEnv = typeof process === 'undefined' ? undefined : process.env;

	const apiBaseInternalUrl = nodeEnv?.API_BASE_INTERNAL_URL?.trim();
	const apiBaseUrl = nodeEnv?.API_BASE_URL?.trim();

	return {
		API_BASE_INTERNAL_URL: isNonEmptyString(apiBaseInternalUrl) ? apiBaseInternalUrl : undefined,
		API_BASE_URL: isNonEmptyString(apiBaseUrl) ? apiBaseUrl : undefined,
	};
}

export function normalizeApiBaseUrl(value: string): string {
	try {
		const url = new URL(value);
		url.pathname = url.pathname.replace(/\/api\/v1\/?$/, '/');
		return url.toString();
	} catch {
		throw new Error(`Invalid API base URL value: ${value}`);
	}
}

export function normalizeSiteUrl(value: string): string {
	try {
		const url = new URL(value);
		url.hash = '';
		url.search = '';
		url.pathname = url.pathname.replace(/\/+$/, '');
		return url.toString().replace(/\/$/, '');
	} catch {
		throw new Error(`Invalid site URL value: ${value}`);
	}
}

function readClientApiBaseUrl(): string {
	const clientEnv = readClientEnv();

	// Validate in all modes to avoid silently shipping broken API endpoints.
	return normalizeApiBaseUrl(clientEnv.VITE_API_BASE_URL);
}

function readServerApiBaseUrl(): string {
	const serverEnv = readServerEnv();
	const fallbackUrl = serverEnv.API_BASE_URL ?? readClientEnv().VITE_API_BASE_URL;

	return normalizeApiBaseUrl(serverEnv.API_BASE_INTERNAL_URL ?? fallbackUrl);
}

const client: EnvTypes.Client = {
	apiBaseUrl: readClientApiBaseUrl(),
	appName: readClientEnv().VITE_PUBLIC_APP_NAME,
	siteUrl: normalizeSiteUrl(readClientEnv().VITE_PUBLIC_SITE_URL),
};

const server: EnvTypes.Server = {
	get apiBaseUrl() {
		return readServerApiBaseUrl();
	},
};

export const env = {
	client,
	server,
} as const;
