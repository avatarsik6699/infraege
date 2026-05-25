import { isRouteErrorResponse } from 'react-router';

import { ApiError } from '@shared/api/client';
import { runtime } from '@shared/config/runtime';
import { isNonEmptyString, isRecord } from '@shared/lib/type-guards';

export namespace AppErrorTypes {
	export type Source = 'route' | 'api' | 'runtime' | 'unknown';

	export type AppUiError = {
		message: string;
		requestId?: string;
		canRetry: boolean;
		isAuthError: boolean;
		source: Source;
		status?: number;
		technicalDetails?: string;
	};
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
	if (!isRecord(value)) {
		return null;
	}
	return value;
}

function getString(record: UnknownRecord | null, key: string): string | undefined {
	const value = record?.[key];
	return isNonEmptyString(value) ? value : undefined;
}

function getRequestId(error: unknown): string | undefined {
	if (error instanceof ApiError && isNonEmptyString(error.requestId)) {
		return error.requestId;
	}

	const detail = error instanceof ApiError ? asRecord(error.detail) : asRecord(error);
	return getString(detail, 'request_id') ?? getString(detail, 'requestId');
}

function getStatus(error: unknown): number | undefined {
	if (error instanceof ApiError) {
		return error.status;
	}

	if (isRouteErrorResponse(error)) {
		return error.status;
	}

	const record = asRecord(error);
	const status = record?.status;
	return typeof status === 'number' ? status : undefined;
}

function getMessage(error: unknown): string {
	if (isRouteErrorResponse(error)) {
		return isNonEmptyString(error.statusText) ? error.statusText : 'Request failed';
	}

	if (error instanceof ApiError || error instanceof Error) {
		return error.message;
	}

	const record = asRecord(error);
	return getString(record, 'message') ?? 'Unexpected application error';
}

function getSource(error: unknown): AppErrorTypes.Source {
	if (isRouteErrorResponse(error)) {
		return 'route';
	}
	if (error instanceof ApiError) {
		return 'api';
	}
	if (error instanceof Error) {
		return 'runtime';
	}
	return 'unknown';
}

function getSanitizedMessage(status?: number): string {
	if (status === 401 || status === 403) {
		return 'Your session is no longer valid. Please sign in again.';
	}
	if (status === 404) {
		return 'The requested page was not found.';
	}
	return 'Something went wrong. Please try again.';
}

function getTechnicalDetails(error: unknown): string | undefined {
	if (!runtime.isDev) {
		return undefined;
	}

	if (error instanceof Error) {
		return error.stack ?? error.message;
	}

	if (isRouteErrorResponse(error)) {
		return `${error.status} ${error.statusText}`;
	}

	return undefined;
}

function toUiError(error: unknown): AppErrorTypes.AppUiError {
	const status = getStatus(error);
	const source = getSource(error);
	const isAuthError = status === 401 || status === 403;

	return {
		source,
		status,
		isAuthError,
		canRetry: true,
		requestId: getRequestId(error),
		message: runtime.isProd ? getSanitizedMessage(status) : getMessage(error),
		technicalDetails: getTechnicalDetails(error),
	};
}

export const appError = {
	toUiError,
};
