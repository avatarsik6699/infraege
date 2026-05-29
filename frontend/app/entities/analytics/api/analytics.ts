import { api } from '@shared/api/client';
import type { components } from '@shared/types/schema';

export type PageviewStats = components['schemas']['PageviewStats'];
export type TopPage = components['schemas']['TopPage'];
export type DailyViews = components['schemas']['DailyViews'];
export type DetailedHealth = components['schemas']['DetailedHealth'];

export function getPageviewStats(signal?: AbortSignal): Promise<PageviewStats> {
	return api.get('/api/v1/admin/analytics/pageviews', { signal });
}

export function getDetailedHealth(signal?: AbortSignal): Promise<DetailedHealth> {
	return api.get('/api/v1/health/detailed', { signal });
}
