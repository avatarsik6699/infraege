import { api } from '@shared/api/client';
import type { components } from '@shared/types/schema';

export type FeedbackRequest = components['schemas']['FeedbackRequest'];
export type FeedbackResponse = components['schemas']['FeedbackResponse'];
export type FeedbackReportAdmin = components['schemas']['FeedbackReportAdmin'];
export type FeedbackStatus = components['schemas']['FeedbackStatus'];
export type FeedbackListResponse = components['schemas']['FeedbackListResponse'];
export type FeedbackStatusUpdate = components['schemas']['FeedbackStatusUpdate'];

export function submitFeedback(body: FeedbackRequest, signal?: AbortSignal): Promise<FeedbackResponse> {
	return api.post('/api/v1/public/feedback', { body, signal });
}

export function listAdminFeedback(
	params: { page?: number; per_page?: number; status?: FeedbackStatus | null } = {},
	signal?: AbortSignal
): Promise<FeedbackListResponse> {
	return api.get('/api/v1/admin/feedback', {
		signal,
		query: {
			page: params.page,
			per_page: params.per_page,
			status: params.status ?? undefined,
		},
	});
}

export function patchFeedbackStatus(
	reportId: string,
	body: FeedbackStatusUpdate,
	signal?: AbortSignal
): Promise<FeedbackReportAdmin> {
	return api.patch('/api/v1/admin/feedback/{report_id}', {
		body,
		signal,
		params: { path: { report_id: reportId } },
	});
}
