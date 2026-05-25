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
	if (import.meta.env.PROD && !configuredApiBaseUrl) {
		throw new Error('VITE_API_BASE_URL is required for production builds');
	}

	const fallbackSiteUrl = 'http://localhost:3000';
	const configuredSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL?.trim();
	if (import.meta.env.PROD && !configuredSiteUrl) {
		throw new Error('VITE_PUBLIC_SITE_URL is required for production builds');
	}

	return {
		VITE_API_BASE_URL: configuredApiBaseUrl || fallbackApiBaseUrl,
		VITE_PUBLIC_APP_NAME: import.meta.env.VITE_PUBLIC_APP_NAME?.trim() || 'Template App',
		VITE_PUBLIC_SITE_URL: configuredSiteUrl || fallbackSiteUrl,
	};
}

function readServerEnv(): ServerEnvSchema {
	const nodeEnv = typeof process === 'undefined' ? undefined : process.env;

	return {
		API_BASE_INTERNAL_URL: nodeEnv?.API_BASE_INTERNAL_URL?.trim() || undefined,
		API_BASE_URL: nodeEnv?.API_BASE_URL?.trim() || undefined,
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
