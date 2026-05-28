import { PlaceholderPage } from '@pages/placeholder';
import { buildRouteMeta } from '@shared/lib/seo';

export function meta() {
	return buildRouteMeta({
		pathname: '/admin/feedback',
		title: 'Обратная связь',
		description: 'Админский просмотр обратной связи infraege.',
		profile: 'privateNoIndex',
	});
}

export default function AdminFeedbackRoute() {
	return (
		<PlaceholderPage
			kicker='Админ'
			title='Обратная связь'
			description='Поверхность разбора обратной связи появится только если админский UI войдет в MVP.'
		/>
	);
}
