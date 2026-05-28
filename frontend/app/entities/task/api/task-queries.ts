import { queryOptions } from '@tanstack/react-query';

import { taskQueryKeys } from '@shared/api/keys';

import type { CatalogFilters } from '../model/task.types';

import { getPublicTask, listPublicTasks } from './tasks';

export function publicTaskCatalogQueryOptions(filters: Partial<CatalogFilters> = {}) {
	return queryOptions({
		queryKey: taskQueryKeys.publicCatalog(filters),
		queryFn: ({ signal }) => listPublicTasks({ ...filters, signal }),
	});
}

export function publicTaskDetailQueryOptions(slug: string) {
	return queryOptions({
		queryKey: taskQueryKeys.publicDetail(slug),
		queryFn: ({ signal }) => getPublicTask(slug, signal),
	});
}
