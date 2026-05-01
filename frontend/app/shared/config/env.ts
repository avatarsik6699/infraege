export namespace EnvTypes {
	export type Client = {
		apiBaseUrl: string;
	};

	export type Server = {
		apiBaseUrl: string;
	};
}

type ClientEnvSchema = {
	VITE_API_BASE_URL: string;
};

type ServerEnvSchema = {
	API_BASE_INTERNAL_URL?: string;
	API_BASE_URL?: string;
};

function readClientEnv(): ClientEnvSchema {
	const fallbackApiBaseUrl = 'http://localhost:8000/api/v1';
	const apiBaseUrlValue = import.meta.env.VITE_API_BASE_URL?.trim() || fallbackApiBaseUrl;

	return {
		VITE_API_BASE_URL: apiBaseUrlValue,
	};
}

function readServerEnv(): ServerEnvSchema {
	const nodeEnv = typeof process === 'undefined' ? undefined : process.env;

	return {
		API_BASE_INTERNAL_URL: nodeEnv?.API_BASE_INTERNAL_URL?.trim() || undefined,
		API_BASE_URL: nodeEnv?.API_BASE_URL?.trim() || undefined,
	};
}

function validateApiBaseUrl(value: string): string {
	try {
		return new URL(value).toString();
	} catch {
		throw new Error(`Invalid API base URL value: ${value}`);
	}
}

function readClientApiBaseUrl(): string {
	const clientEnv = readClientEnv();

	// Validate in all modes to avoid silently shipping broken API endpoints.
	return validateApiBaseUrl(clientEnv.VITE_API_BASE_URL);
}

function readServerApiBaseUrl(): string {
	const serverEnv = readServerEnv();
	const fallbackUrl = serverEnv.API_BASE_URL ?? readClientEnv().VITE_API_BASE_URL;

	return validateApiBaseUrl(serverEnv.API_BASE_INTERNAL_URL ?? fallbackUrl);
}

const client: EnvTypes.Client = {
	apiBaseUrl: readClientApiBaseUrl(),
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
