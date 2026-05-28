import { PlaceholderPage } from '@pages/placeholder';
import { buildRouteMeta } from '@shared/lib/seo';

export function meta() {
	return buildRouteMeta({
		pathname: '/privacy',
		title: 'Персональные данные',
		description: 'Политика обработки персональных данных infraege.',
		profile: 'publicIndexable',
	});
}

export default function PrivacyRoute() {
	return (
		<PlaceholderPage
			kicker='Документы'
			title='Персональные данные'
			description='Полный текст политики будет подготовлен в фазе юридических страниц.'
		/>
	);
}
