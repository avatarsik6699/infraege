import { api } from '@shared/api/client';
import type { components } from '@shared/types/schema';

export async function syncProgress(
	payload: components['schemas']['ProgressSyncRequest']
): Promise<components['schemas']['ProgressSyncResponse']> {
	return api.post('/api/v1/public/progress/sync', { body: payload });
}

export async function getProgressMe(): Promise<components['schemas']['ProfileMe']> {
	return api.get('/api/v1/public/progress/me');
}
