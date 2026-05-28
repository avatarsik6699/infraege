import { queryOptions } from '@tanstack/react-query';

import { practiceQueryKeys } from '@shared/api/keys';
import { runtime } from '@shared/config/runtime';

import type { PracticeValidationRequest } from '../model/practice.types';

import { getPublicPractice, validatePracticeAnswer } from './practice';

export function publicPracticeQueryOptions(taskId: string) {
	return queryOptions({
		queryKey: practiceQueryKeys.publicPractice(taskId),
		queryFn: ({ signal }) => getPublicPractice(taskId, signal),
		enabled: runtime.isClient,
		refetchOnMount: true,
	});
}

export const practiceMutationKeys = {
	validate: ['practice', 'validate'] as const,
};

export function validatePracticeAnswerMutation(input: PracticeValidationRequest) {
	return validatePracticeAnswer(input);
}
