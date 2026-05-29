import { PrivacyPage } from '@pages/legal/privacy-page';
import { buildRouteMeta } from '@shared/lib/seo';

export function meta() {
	return buildRouteMeta({
		pathname: '/privacy',
		title: 'Политика персональных данных',
		description: 'Политика обработки персональных данных infraege в соответствии с ФЗ-152.',
		profile: 'publicIndexable',
	});
}

export default function PrivacyRoute() {
	return <PrivacyPage />;
}
