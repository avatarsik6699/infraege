import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@shared/api/client';
import { authQueryKeys } from '@shared/api/keys';
import { jwtService } from '@shared/services/jwt-service';
import type { components } from '@shared/types/schema';

type LoginRequest = components['schemas']['LoginRequest'];
type RefreshRequest = components['schemas']['RefreshRequest'];
type RegisterRequest = components['schemas']['RegisterRequest'];
type TokenPair = components['schemas']['TokenPair'];
type User = components['schemas']['UserOut'];

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
	const { data: token } = useAuthToken();

	return useQuery<User>({
		queryKey: authQueryKeys.me,
		enabled: Boolean(token?.access_token),
		queryFn: () => api.get<User>('/public/auth/me'),
	});
}

export function useLoginMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: LoginRequest) =>
			api.post<TokenPair, LoginRequest>('/public/auth/login', {
				body: payload,
			}),
		onSuccess: tokens => {
			jwtService.set(queryClient, tokens);
			queryClient.invalidateQueries({ queryKey: authQueryKeys.me });
		},
	});
}

export function useRegisterMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: RegisterRequest) =>
			api.post<TokenPair, RegisterRequest>('/public/auth/register', {
				body: payload,
			}),
		onSuccess: tokens => {
			jwtService.set(queryClient, tokens);
			queryClient.invalidateQueries({ queryKey: authQueryKeys.me });
		},
	});
}

export function useRefreshMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: RefreshRequest) =>
			api.post<TokenPair, RefreshRequest>('/public/auth/refresh', {
				body: payload,
			}),
		onSuccess: tokens => {
			jwtService.set(queryClient, tokens);
			queryClient.invalidateQueries({ queryKey: authQueryKeys.me });
		},
	});
}

export function useLogoutMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => api.post<{ message: string }, never>('/public/auth/logout', {}),
		onSettled: () => {
			jwtService.set(queryClient, null);
			queryClient.removeQueries({ queryKey: authQueryKeys.me });
		},
	});
}

export function useSessionSummary() {
	const tokenQuery = useAuthToken();
	const meQuery = useMe();

	const accessToken = tokenQuery.data?.access_token ?? null;
	const isAuthenticated = Boolean(accessToken);

	return {
		accessToken,
		isAuthenticated,
		tokenQuery,
		meQuery,
	};
}
