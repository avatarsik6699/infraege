import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { progressQueryKeys } from '@shared/api/keys';

import { getProgressMe, syncProgress } from './users';

export function useProgressMeQuery() {
	return useQuery({
		queryKey: progressQueryKeys.me,
		queryFn: getProgressMe,
	});
}

export function useSyncProgressMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: syncProgress,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: progressQueryKeys.me });
		},
	});
}
