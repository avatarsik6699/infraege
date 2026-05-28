import { PlaceholderPage } from '@pages/placeholder';
import { buildRouteMeta } from '@shared/lib/seo';

export function meta() {
	return buildRouteMeta({
		pathname: '/terms',
		title: 'Условия',
		description: 'Условия использования infraege.',
		profile: 'publicIndexable',
	});
}

export default function TermsRoute() {
	return (
		<PlaceholderPage
			kicker='Документы'
			title='Условия использования'
			description='Полные условия использования будут подготовлены в фазе юридических страниц.'
		/>
	);
}
