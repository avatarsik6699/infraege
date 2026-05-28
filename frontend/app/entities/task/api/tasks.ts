import { api } from '@shared/api/client';

import type { PublicTaskDetail, PublicTaskSummary, TaskDifficulty } from '../model/task.types';

type ListPublicTasksInput = {
	search?: string;
	difficulty?: TaskDifficulty;
	signal?: AbortSignal;
};

export function listPublicTasks(input: ListPublicTasksInput = {}): Promise<PublicTaskSummary[]> {
	return api.get('/api/v1/public/tasks', {
		signal: input.signal,
		query: {
			search: input.search,
			difficulty: input.difficulty,
		},
	});
}

export function getPublicTask(slug: string, signal?: AbortSignal): Promise<PublicTaskDetail> {
	return api.get('/api/v1/public/tasks/{slug}', {
		signal,
		params: {
			path: { slug },
		},
	});
}
