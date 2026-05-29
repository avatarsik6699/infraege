import { AdminAnalyticsPage } from '@pages/admin/analytics';
import { buildRouteMeta } from '@shared/lib/seo';

export function meta() {
	return buildRouteMeta({
		pathname: '/admin/analytics',
		title: 'Аналитика',
		description: 'Статистика просмотров страниц.',
		profile: 'privateNoIndex',
	});
}

export default function AdminAnalyticsRoute() {
	return <AdminAnalyticsPage />;
}
