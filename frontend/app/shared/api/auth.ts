import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@shared/api/client';
import { authQueryKeys } from '@shared/api/keys';
import { useClientMounted } from '@shared/hooks/use-client-mounted';
import { jwtService } from '@shared/services/jwt-service';
import type { components } from '@shared/types/schema';

type TokenPair = components['schemas']['TokenPair'];

export function useAuthToken() {
	const queryClient = useQueryClient();

	return useQuery<TokenPair | null>({
		queryKey: authQueryKeys.token,
		queryFn: async () => jwtService.read(),
		initialData: () => queryClient.getQueryData<TokenPair | null>(authQueryKeys.token) ?? jwtService.read(),
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	});
}

export function useMe() {
	const tokenQuery = useAuthToken();

	return useQuery({
		queryKey: authQueryKeys.me,
		enabled: Boolean(tokenQuery.data?.access_token),
		queryFn: () => api.get('/api/v1/public/auth/me'),
	});
}

export function useLoginMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: components['schemas']['LoginRequest']) =>
			api.post('/api/v1/public/auth/login', { body: payload }),
		onSuccess: tokens => {
			jwtService.set(queryClient, tokens);
			queryClient.invalidateQueries({ queryKey: authQueryKeys.me });
		},
	});
}

export function useRegisterMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: components['schemas']['RegisterRequest']) =>
			api.post('/api/v1/public/auth/register', { body: payload }),
		onSuccess: tokens => {
			jwtService.set(queryClient, tokens);
			queryClient.invalidateQueries({ queryKey: authQueryKeys.me });
		},
	});
}

export function useRefreshMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: components['schemas']['RefreshRequest']) =>
			api.post('/api/v1/public/auth/refresh', { body: payload }),
		onSuccess: tokens => {
			jwtService.set(queryClient, tokens);
			queryClient.invalidateQueries({ queryKey: authQueryKeys.me });
		},
	});
}

export function useLogoutMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => api.post('/api/v1/public/auth/logout', {}),
		onSettled: () => {
			jwtService.set(queryClient, null);
			queryClient.removeQueries({ queryKey: authQueryKeys.me });
		},
	});
}

export function useDeleteAccountMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => api.delete('/api/v1/public/auth/me'),
		onSuccess: () => {
			jwtService.set(queryClient, null);
			queryClient.clear();
		},
	});
}

export function useSessionSummary() {
	const isClientMounted = useClientMounted();
	const tokenQuery = useAuthToken();
	const meQuery = useMe();

	const accessToken = tokenQuery.data?.access_token ?? null;
	const isAuthenticated = Boolean(accessToken);
	const isAuthReady = isClientMounted;

	return {
		accessToken,
		isAuthenticated,
		isAuthReady,
		tokenQuery,
		meQuery,
	};
}
