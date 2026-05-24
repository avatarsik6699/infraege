import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { ApiError } from '@shared/api/client';
import { globalErrorNotifier } from '@shared/lib/global-error-notifier';
import { jwtService } from '@shared/services/jwt-service';

const QUERY_STALE_TIME_MS = 1000 * 60 * 5;
const QUERY_GC_TIME_MS = 1000 * 60 * 10;
const RETRYABLE_SERVER_STATUSES = new Set([502, 503, 504]);
const MAX_QUERY_RETRIES = 2;

export function createQueryClient(): QueryClient {
	return new QueryClient({
		queryCache: new QueryCache({
			onError: (error, query) => {
				if (query.meta?.disableGlobalErrorHandler === true) {
					return;
				}

				console.debug('Query error captured', error);
			},
		}),
		mutationCache: new MutationCache({
			onError: (error, _variables, _context, mutation) => {
				if (mutation.meta?.disableGlobalErrorHandler === true) {
					return;
				}

				if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
					return;
				}

				if (error instanceof ApiError) {
					if (typeof error.detail === 'string' && error.detail.length > 0) {
						globalErrorNotifier.notifyError(error.detail);
						return;
					}

					if (error.status > 0) {
						globalErrorNotifier.notifyError(`Request failed with status ${error.status}`);
						return;
					}
				}

				if (error instanceof Error && error.message.length > 0) {
					globalErrorNotifier.notifyError(error.message);
					return;
				}

				globalErrorNotifier.notifyError('Request failed');
			},
		}),
		defaultOptions: {
			queries: {
				staleTime: QUERY_STALE_TIME_MS,
				gcTime: QUERY_GC_TIME_MS,
				refetchOnWindowFocus: false,
				refetchOnReconnect: false,
				refetchOnMount: false,
				retry: (failureCount, error) => {
					if (failureCount >= MAX_QUERY_RETRIES) {
						return false;
					}

					if (!(error instanceof ApiError)) {
						return true;
					}

					return RETRYABLE_SERVER_STATUSES.has(error.status);
				},
				retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
			},
			mutations: {
				retry: 0,
			},
		},
	});
}

export const queryClient = createQueryClient();

jwtService.hydrate(queryClient);
