import { api } from '@shared/api/client';

import type {
	PracticeValidationRequest,
	PracticeValidationResponse,
	PublicPracticeItem,
} from '../model/practice.types';

export function getPublicPractice(taskId: string, signal?: AbortSignal): Promise<PublicPracticeItem[]> {
	return api.get('/api/v1/public/practice/{task_id}', {
		signal,
		params: {
			path: { task_id: taskId },
		},
	});
}

export function validatePracticeAnswer(
	payload: PracticeValidationRequest,
	signal?: AbortSignal
): Promise<PracticeValidationResponse> {
	return api.post('/api/v1/public/validate', {
		signal,
		body: payload,
	});
}
