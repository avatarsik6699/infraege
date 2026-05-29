import { AdminFeedbackPage } from '@pages/admin/feedback';
import { buildRouteMeta } from '@shared/lib/seo';

export function meta() {
	return buildRouteMeta({
		pathname: '/admin/feedback',
		title: 'Обратная связь',
		description: 'Административный раздел просмотра обратной связи.',
		profile: 'privateNoIndex',
	});
}

export default function AdminFeedbackRoute() {
	return <AdminFeedbackPage />;
}
